import { type Request, type Response } from "express";
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Helper: Calculate net balances for all group members
const calculateGroupBalances = async (groupId: string) => {
    // Get all expenses for the group
    const expenses = await prisma.expense.findMany({
        where: { groupId },
        include: {
            items: {
                include: {
                    participants: true,
                },
            },
        },
    });

    const balances: { [userId: string]: { paid: number; owes: number } } = {};

    // Process each expense
    for (const expense of expenses) {
        const paidBy = expense.paidBy;
        const taxAmount = Number(expense.taxAmount);

        // Initialize payer if not exists
        if (!balances[paidBy]) {
            balances[paidBy] = { paid: 0, owes: 0 };
        }
        balances[paidBy].paid += taxAmount;

        // Process each item
        for (const item of expense.items) {
            const itemAmount = Number(item.amount);
            
            // Payer paid for this item
            balances[paidBy].paid += itemAmount;

            // Split among participants
            if (item.participants.length > 0) {
                const perPersonAmount = itemAmount / item.participants.length;

                for (const participant of item.participants) {
                    const userId = participant.userId;
                    
                    if (!balances[userId]) {
                        balances[userId] = { paid: 0, owes: 0 };
                    }
                    balances[userId].owes += perPersonAmount;
                }
            }
        }
    }

    // Convert to net balances
    return Object.entries(balances).map(([userId, { paid, owes }]) => ({
        userId,
        balance: Math.round((paid - owes) * 100) / 100,
    }));
};

// Helper: Generate optimized settlement transactions
const generateOptimizedTransactions = (balances: { userId: string; balance: number }[]) => {
    const creditors = balances.filter(b => b.balance > 0).sort((a, b) => b.balance - a.balance);
    const debtors = balances.filter(b => b.balance < 0).sort((a, b) => a.balance - b.balance);
    
    const transactions: Array<{
        fromUserId: string;
        toUserId: string;
        amount: number;
        timestamp: string;
        status: string;
    }> = [];
    let i = 0, j = 0;

    while (i < creditors.length && j < debtors.length) {
        const creditor = creditors[i]!;
        const debtor = debtors[j]!;
        
        const amount = Math.min(creditor.balance, Math.abs(debtor.balance));
        
        if (amount > 0.01) { // Only create transactions for amounts > 1 cent
            transactions.push({
                fromUserId: debtor.userId,
                toUserId: creditor.userId,
                amount: Math.round(amount * 100) / 100,
                timestamp: new Date().toISOString(),
                status: "PENDING",
            });
        }

        creditor.balance -= amount;
        debtor.balance += amount;

        if (Math.abs(creditor.balance) < 0.01) i++;
        if (Math.abs(debtor.balance) < 0.01) j++;
    }

    return transactions;
};

// GET /groups/:groupId/settlements
export const getSettlementSummary = async (req: Request, res: Response) => {
    try {
        const { groupId } = req.params;
        const { includeTransactions = "true" } = req.query;

        if (!groupId) {
            return res.status(400).json({
                error: {
                    code: "MISSING_GROUP_ID",
                    message: "groupId is required as path parameter",
                },
            });
        }

        // Verify group exists
        const group = await prisma.group.findUnique({
            where: { id: groupId as string },
        });

        if (!group) {
            return res.status(404).json({
                error: {
                    code: "GROUP_NOT_FOUND",
                    message: "Group does not exist",
                },
            });
        }

        // Calculate net balances
        const netBalances = await calculateGroupBalances(groupId as string);

        // Calculate total settled amount (sum of all expenses)
        const totalExpenses = await prisma.expense.aggregate({
            where: { groupId: groupId as string },
            _sum: {
                taxAmount: true,
            },
        });

        const totalItemsAmount = await prisma.expenseItem.aggregate({
            where: {
                expense: {
                    groupId: groupId as string,
                },
            },
            _sum: {
                amount: true,
            },
        });

        const totalSettled = Number(totalExpenses._sum.taxAmount || 0) + Number(totalItemsAmount._sum.amount || 0);

        // Generate optimized transactions if requested
        let optimizedTransactions: Array<{
            fromUserId: string;
            toUserId: string;
            amount: number;
            timestamp: string;
            status: string;
        }> = [];
        if (includeTransactions === "true") {
            optimizedTransactions = generateOptimizedTransactions([...netBalances]);
        }

        return res.status(200).json({
            groupId: groupId as string,
            totalSettled: Math.round(totalSettled * 100) / 100,
            netBalances,
            ...(includeTransactions === "true" && { optimizedTransactions }),
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            error: {
                code: "INTERNAL_SERVER_ERROR",
                message: "An error occurred while fetching settlement summary",
            },
        });
    }
};

// POST /groups/:groupId/settlements/recalculate
export const recalculateSettlements = async (req: Request, res: Response) => {
    try {
        const { groupId } = req.params;

        if (!groupId) {
            return res.status(400).json({
                error: {
                    code: "MISSING_GROUP_ID",
                    message: "groupId is required as path parameter",
                },
            });
        }

        // Verify group exists
        const group = await prisma.group.findUnique({
            where: { id: groupId as string },
        });

        if (!group) {
            return res.status(404).json({
                error: {
                    code: "GROUP_NOT_FOUND",
                    message: "Group does not exist",
                },
            });
        }

        // Delete old settlement records for this group (if any)
        await prisma.settlement.deleteMany({
            where: { groupId: groupId as string },
        });

        // Recalculate balances
        const netBalances = await calculateGroupBalances(groupId as string);
        const optimizedTransactions = generateOptimizedTransactions([...netBalances]);

        // Store new settlement records (Settlement model doesn't have status field)
        for (const transaction of optimizedTransactions) {
            await prisma.settlement.create({
                data: {
                    groupId: groupId as string,
                    fromUserId: transaction.fromUserId,
                    toUserId: transaction.toUserId,
                    amount: transaction.amount,
                },
            });
        }

        // Calculate total settled amount
        const totalExpenses = await prisma.expense.aggregate({
            where: { groupId: groupId as string },
            _sum: {
                taxAmount: true,
            },
        });

        const totalItemsAmount = await prisma.expenseItem.aggregate({
            where: {
                expense: {
                    groupId: groupId as string,
                },
            },
            _sum: {
                amount: true,
            },
        });

        const totalSettled = Number(totalExpenses._sum.taxAmount || 0) + Number(totalItemsAmount._sum.amount || 0);

        return res.status(200).json({
            groupId: groupId as string,
            totalSettled: Math.round(totalSettled * 100) / 100,
            netBalances,
            optimizedTransactions: optimizedTransactions.map(t => ({
                ...t,
                timestamp: new Date().toISOString(),
            })),
            message: "Settlement recalculated successfully",
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            error: {
                code: "INTERNAL_SERVER_ERROR",
                message: "An error occurred while recalculating settlements",
            },
        });
    }
};


