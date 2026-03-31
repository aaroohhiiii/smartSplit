import { type Request, type Response } from "express";
import "dotenv/config";
import { prisma } from "../lib/prisma";

// Helper: Calculate split summary for an expense
const calculateSplitSummary = async (expenseId: string) => {
    const expense = await prisma.expense.findUnique({
        where: { id: expenseId },
        include: {
            items: {
                include: {
                    participants: true,
                },
            },
        },
    });

    if (!expense) return null;

    const splitMap: { [userId: string]: { owes: number; paid: number } } = {};

    // Initialize paidBy in map
    splitMap[expense.paidBy] = { owes: 0, paid: Number(expense.taxAmount) };

    // Distribute item amounts
    for (const item of expense.items) {
        const itemAmount = Number(item.amount);
        
        // Ensure paidBy is in the map and add item amount to their paid
        if (!splitMap[expense.paidBy]) {
            splitMap[expense.paidBy] = { owes: 0, paid: 0 };
        }
        splitMap[expense.paidBy]!.paid += itemAmount;

        // Split item among participants
        if (item.participants.length > 0) {
            const perPersonAmount = itemAmount / item.participants.length;

            for (const participant of item.participants) {
                if (!splitMap[participant.userId]) {
                    splitMap[participant.userId] = { owes: 0, paid: 0 };
                }
                splitMap[participant.userId]!.owes += perPersonAmount;
            }
        }
    }

    return Object.entries(splitMap).map(([userId, { owes, paid }]) => ({
        userId,
        owes: Math.round(owes * 100) / 100,
        paid: Math.round(paid * 100) / 100,
        netBalance: Math.round((paid - owes) * 100) / 100,
    }));
};




export const createExpense = async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;
    const groupIdStr = Array.isArray(groupId) ? groupId[0] : groupId;
    const { title, paidBy, items, taxAmount = 0 } = req.body;
    const createdBy = req.auth?.userId || paidBy;

    if (!groupIdStr || !title || !paidBy || !items || items.length === 0) {
      return res.status(400).json({
        error: { code: "MISSING_FIELDS", message: "groupId (in URL), title, paidBy, and items (non-empty array) are required" },
      });
    }

    if (title.length > 200) {
      return res.status(400).json({
        error: { code: "INVALID_TITLE", message: "title must be at most 200 characters" },
      });
    }

    const group = await prisma.group.findUnique({ where: { id: groupIdStr } });
    if (!group) {
      return res.status(404).json({ error: { code: "GROUP_NOT_FOUND", message: "Group does not exist" } });
    }

    const paidByMember = await prisma.groupMember.findFirst({ where: { groupId: groupIdStr, userId: paidBy } });
    if (!paidByMember) {
      return res.status(400).json({ error: { code: "INVALID_PAYER", message: "paidBy user must be a group member" } });
    }

    // Validate items and participants
    for (const item of items) {
      if (!item.name || !item.amount || item.amount <= 0 || !item.category || !item.sharedBy || item.sharedBy.length === 0) {
        return res.status(400).json({
          error: { code: "INVALID_ITEM", message: "Each item must have name, amount > 0, category, and sharedBy array" },
        });
      }
    }

   
    const allParticipantIds = items.flatMap((item: any) => item.sharedBy);
    const members = await prisma.groupMember.findMany({
      where: { groupId: groupIdStr, userId: { in: allParticipantIds } },
    });
    const memberIdsSet = new Set(members.map(m => m.userId));

    for (const item of items) {
      for (const userId of item.sharedBy) {
        if (!memberIdsSet.has(userId)) {
          return res.status(400).json({
            error: { code: "INVALID_PARTICIPANT", message: `User ${userId} is not a group member` },
          });
        }
      }
    }

    // Calculate totals
    const itemsTotal = items.reduce((sum: number, item: any) => sum + parseFloat(item.amount), 0);
    const totalAmount = itemsTotal + parseFloat(taxAmount);

    // Create expense with nested items
    const expense = await prisma.expense.create({
      data: {
        groupId: groupIdStr,
        title: title as string,
        paidBy: paidBy as string,
        currency: group.currency,
        createdBy: createdBy as string,
        taxAmount: parseFloat(taxAmount as string),
        items: {
          create: items.map((item: any) => ({
            name: item.name as string,
            amount: parseFloat(item.amount),
            category: item.category.toUpperCase() as string,
            participants: { 
              create: item.sharedBy.map((userId: string) => ({ userId })) 
            },
          })),
        },
      },
      include: { 
        items: { 
          include: { 
            participants: true 
          } 
        } 
      },
    });

    const splitSummary = await calculateSplitSummary(expense.id);

    return res.status(201).json({
      expenseId: expense.id,
      groupId: expense.groupId,
      totalAmount: Math.round(totalAmount * 100) / 100,
      splitSummary,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: { code: "INTERNAL_SERVER_ERROR", message: "An error occurred while creating the expense" },
    });
  }
};


export const listExpense = async (req: Request, res: Response) => {
    try {
        const { groupId } = req.params;
        const groupIdStr = Array.isArray(groupId) ? groupId[0] : groupId;
        const { limit = "20", offset = "0" } = req.query;

        if (!groupIdStr) {
            return res.status(400).json({
                error: {
                    code: "MISSING_GROUP_ID",
                    message: "groupId is required as path parameter"
                }
            });
        }

        const group = await prisma.group.findUnique({
            where: {
                id: groupIdStr
            }
        });

        if (!group) {
            return res.status(404).json({
                error: {
                    code: "GROUP_NOT_FOUND",
                    message: "Group with given id does not exist"
                }
            });
        }

        const expenses = await prisma.expense.findMany({
            where: {
                groupId: groupIdStr,
            },
            include: {
                items: {
                    include: {
                        participants: true,
                    }
                }
            },
            orderBy: { createdAt: "desc" },
            take: parseInt(limit as string),
            skip: parseInt(offset as string),
        });

        // Enrich with split summaries
        const enrichedExpenses = await Promise.all(
            expenses.map(async (exp) => {
                const splitSummary = await calculateSplitSummary(exp.id);
                const itemsTotal = exp.items.reduce((sum, item) => sum + Number(item.amount), 0);
                const totalAmount = itemsTotal + Number(exp.taxAmount);

                return {
                    expenseId: exp.id,
                    title: exp.title,
                    paidBy: exp.paidBy,
                    totalAmount: Math.round(totalAmount * 100) / 100,
                    createdAt: exp.createdAt,
                    items: exp.items.map((item) => ({
                        name: item.name,
                        amount: Number(item.amount),
                        category: item.category,
                        sharedBy: item.participants.map((p) => p.userId),
                    })),
                    splitSummary,
                };
            })
        );

        return res.status(200).json(enrichedExpenses);
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            error: {
                code: "INTERNAL_SERVER_ERROR",
                message: "An error occurred while fetching the expenses"
            }
        });
    }
};


export const getExpenseDetails = async (req:Request , res : Response)=>{
    try{
  const {expenseId} = req.params ;
    if(!expenseId){
        return res.status(400).json({
            error:{
                code: "MISSING_EXPENSE_ID",
                message : "expenseId is required as path parameter"
            }
        })
    }
    const expense = await prisma.expense.findUnique({
        where:{
            id : expenseId as string,

        },
        include:{
            items:{
                include:{
                    participants:true ,
            }
            }
        }
    })

    if(!expense){
            return res.status(404).json({
                error:{
                    code:"EXPENSE_NOT_FOUND",
                    message : "Expense with given id does not exist"
                }
            })
    }
    const splitSummary = await calculateSplitSummary(expense.id);
    const itemsTotal = expense.items.reduce((sum , item)=> sum + Number(item.amount ), 0);


    const totalAmount = itemsTotal + Number( expense.taxAmount) ;
    res.status(200).json({
        expenseId : expense.id,
        groupId : expense.groupId ,
        title : expense.title,
        paidBy : expense.paidBy,
        totalAmount : Math.round(totalAmount * 100) / 100,
        createdAt : expense.createdAt,
        items : expense.items.map((item)=>{
            return {
                name : item.name,
                amount : Number(item.amount),
                category : item.category,
                sharedBy : item.participants.map(p=> p.userId)
            }
        }),
        splitSummary
    })



    }catch(error){
        res.status(500).json({
            error:{
                code:"INTERNAL_SERVER_ERROR",
                message : "An error occurred while fetching expense details"
            }
        })
    }
};


export const updateExpense = async (req: Request , res : Response)=>{
    try{
        const { expenseId} = req.params ;
        const {title , items , taxAmount} = req.body ;
        
        if(!expenseId){
            return res.status(400).json({
                error:{
                    code: "MISSING_EXPENSE_ID",
                    message : "expenseId is required as path parameter"
                }
            })
        }


        const expense = await prisma.expense.findUnique({
            where:{
                id : expenseId as string, 
            },
            include:{
                items:{
                    include:{
                        participants:true ,
                    }
                }
            }
        })
        if(!expense){
            return res.status(404).json({
                error:{
                    code:"EXPENSE_NOT_FOUND",
                    message : "Expense with given id does not exist"
                }
            })
        }


        if(items){
            if(!Array.isArray(items)|| items.length ===0){
                return res.status(400).json({
                    error:{
                        code: "INVALID_ITEMS",
                        message : "items must be a non-empty array"
                    }
                })
            }
        }


        const group = await prisma.group.findUnique({
            where:{
                id : expense.groupId
            }
        })


        for(const item of items ){
            if(!item.name || item.amount<=0 ||!item.category || !item.sharedBy || item.sharedBy.length ===0){
                return res.status(400).json({
                    error:{
                        code: "INVALID_ITEM",
                        message : "Each item must have name, amount > 0, category, and sharedBy array"
                    }
                })
            } 
        }


        for (const item of items) {
            for (const userId of item.sharedBy) {
                const member = await prisma.groupMember.findFirst({
                    where: { groupId: group!.id, userId },
                });
                if (!member) {
                    return res.status(400).json({
                        error: { code: "INVALID_PARTICIPANT", message: `User ${userId} is not a group member` },
                    });
                }
            }
        }

        const updatedExpense = await prisma.expense.update({
          where: { id: expenseId as string },
          data :{
            ...( title && {title}),
            ...(taxAmount !== undefined &&{ taxAmount : parseFloat(taxAmount)}) ,
          },
          include:{
            items:{
                include:{
                    participants:true ,
                }
            }
          }
        })
            if(items){
                await prisma.expenseItem.deleteMany({
                    where:{
                        expenseId: expenseId as string,
                    }
                })
            }
        const newItems = items.map((item:any)=>({
expenseId,
name : item.name ,
amount : parseFloat(item.amount) ,
category : item.category.toUpperCase() ,
participants :{
    create : item.sharedBy.map((userId:string)=>({userId}))
}
        }))

        for(const itemData of newItems){
            await prisma.expenseItem.create({
                data : itemData,
            })
        }

         const finalExpense = await prisma.expense.findUnique({
            where: { id: expenseId as string },
            include: {
                items: { include: { participants: true } },
            },
        });
        const splitSummary = await calculateSplitSummary(expenseId as string);
        const itemsTotal = finalExpense!.items.reduce((sum, item) => sum + Number(item.amount), 0);
        const totalAmount = itemsTotal + Number(finalExpense!.taxAmount);
        

        res.status(200).json({
            expenseId : finalExpense!.id ,
             groupId: finalExpense!.groupId,
            title: finalExpense!.title,
            paidBy: finalExpense!.paidBy,
            currency: finalExpense!.currency,
            totalAmount: Math.round(totalAmount * 100) / 100,
            taxAmount: Number(finalExpense!.taxAmount),
            createdAt: finalExpense!.createdAt,
            items: finalExpense!.items.map((item) => ({
                name: item.name,
                amount: Number(item.amount),
                category: item.category,
                sharedBy: item.participants.map((p) => p.userId),
            })),
            splitSummary,
        })
    }catch(error){
        res.status(500).json({
            error:{
                code:"INTERNAL_SERVER_ERROR",
                message : "An error occurred while updating the expense"
            }
        })
    }
};


export const deleteExpense = async (req: Request, res: Response) => {
    try {
        const { expenseId } = req.params;

        if (!expenseId) {
            return res.status(400).json({
                error: { code: "MISSING_EXPENSE_ID", message: "expenseId is required as path parameter" },
            });
        }

        const expense = await prisma.expense.findUnique({
            where: { id: expenseId as string },
        });

        if (!expense) {
            return res.status(404).json({
                error: { code: "EXPENSE_NOT_FOUND", message: "Expense does not exist" },
            });
        }


        await prisma.expenseItem.deleteMany({
            where: { expenseId: expenseId as string },
        });

       
        await prisma.expense.delete({
            where: { id: expenseId as string },
        });

        res.status(204).send();
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: {
                code: "INTERNAL_SERVER_ERROR",
                message: "An error occurred while deleting the expense",
            },
        });
    }
};
