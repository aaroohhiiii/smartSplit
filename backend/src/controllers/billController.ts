import { type Request, type Response } from "express";
import "dotenv/config";
import multer from "multer";
import path from "path";
import fs from "fs";
import { parseBillWithGroq, validateBillParsing } from "../services/llmService";
import { prisma } from "../lib/prisma";

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadsDir = path.join(process.cwd(), "uploads", "bills");
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|pdf/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error("Only JPEG, PNG, and PDF files are allowed"));
        }
    },
});

// Helper: Smart allocation based on member preferences
const allocateItemsByPreferences = (
    items: Array<{name: string, amount: number, category: string}>,
    members: Array<{userId: string, isVegetarian: boolean, drinksAlcohol: boolean}>
) => {
    const allocatedItems = items.map(item => {
        let eligibleMembers = members;

        // Filter based on category and preferences
        switch (item.category.toLowerCase()) {
            case 'veg':
                // All members can share vegetarian items
                eligibleMembers = members;
                break;
            case 'non_veg':
                // Only non-vegetarians can share non-veg items
                eligibleMembers = members.filter(m => !m.isVegetarian);
                break;
            case 'alcohol':
                // Only members who drink alcohol
                eligibleMembers = members.filter(m => m.drinksAlcohol);
                break;
            case 'shared':
            default:
                // Shared items can be split among all members
                eligibleMembers = members;
                break;
        }

        // If no eligible members, default to all (fallback)
        if (eligibleMembers.length === 0) {
            eligibleMembers = members;
        }

        return {
            name: item.name,
            amount: item.amount,
            category: item.category.toUpperCase(),
            sharedBy: eligibleMembers.map(m => m.userId),
        };
    });

    return allocatedItems;
};

// Process bill with Groq LLM API
const processBillWithLLM = async (fileBuffer: Buffer, filePath: string): Promise<{
    items: Array<{name: string, amount: number, category: string}>,
    totalAmount: number,
    taxAmount: number,
}> => {
    try {
        const result = await parseBillWithGroq(fileBuffer, filePath);
        
        // Validate result
        const validationErrors = validateBillParsing(result);
        if (validationErrors.length > 0) {
            console.warn("Bill parsing validation warnings:", validationErrors);
        }
        
        return result;
    } catch (error) {
        console.error("LLM processing error:", error);
        throw new Error(`Failed to process bill with Groq API: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
};

// Export multer instance for use in routes
export const billUpload = upload;

// POST /groups/:groupId/bills - Upload and process bill
export const uploadBill = async (req: Request, res: Response) => {
    try {
        console.log("[BILL] uploadBill handler called");
        console.log("[BILL] req.params:", req.params);
        console.log("[BILL] req.file:", req.file ? { filename: req.file.filename, size: req.file.size, path: req.file.path } : "NO FILE");
        console.log("[BILL] req.auth.userId:", (req as any).auth?.userId);

        const { groupId } = req.params;

        if (!groupId) {
            console.log("[BILL] Missing groupId");
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
            console.log("[BILL] Group not found:", groupId);
            return res.status(404).json({
                error: {
                    code: "GROUP_NOT_FOUND",
                    message: "Group does not exist",
                },
            });
        }

        // File is already processed by multer middleware in route
        if (!req.file) {
            console.log("[BILL] No file uploaded");
            return res.status(400).json({
                error: {
                    code: "NO_FILE_UPLOADED",
                    message: "Please upload a bill image or PDF",
                },
            });
        }

        try {
            console.log("[BILL] Creating bill upload record...");
            // Create bill upload record
            const billUpload = await prisma.billUpload.create({
                data: {
                    groupId: groupId as string,
                    fileUrl: req.file.path,
                    status: "UPLOADED",
                    uploadedBy: (req as any).auth?.userId || "guest",
                },
            });

            // Create AI processing job
            await prisma.aIProcessingJob.create({
                data: {
                    billUploadId: billUpload.id,
                    status: "QUEUED",
                },
            });

            // Start async processing
            processBillAsync(billUpload.id, req.file.path).catch(console.error);

            console.log("[BILL] Upload successful:", billUpload.id);
            return res.status(202).json({
                billId: billUpload.id,
                groupId: groupId as string,
                status: "UPLOADED",
                uploadedAt: billUpload.uploadedAt,
            });
        } catch (error) {
            console.error("[BILL] Error in inner try-catch:", error);
            return res.status(500).json({
                error: {
                    code: "INTERNAL_SERVER_ERROR",
                    message: error instanceof Error ? error.message : "An error occurred while processing the upload",
                },
            });
        }
    } catch (error) {
        console.error("[BILL] Error in outer try-catch:", error);
        return res.status(500).json({
            error: {
                code: "INTERNAL_SERVER_ERROR",
                message: "An error occurred while uploading the bill",
            },
        });
    }
};

// Async processing function
const processBillAsync = async (billId: string, filePath: string) => {
    try {
        // Update AI job status to RUNNING
        await prisma.aIProcessingJob.update({
            where: { billUploadId: billId },
            data: { status: "RUNNING" },
        });

        // Process with LLM
        const fileBuffer = fs.readFileSync(filePath);
        const result = await processBillWithLLM(fileBuffer, filePath);

        // Create ParsedBill record
        await prisma.parsedBill.create({
            data: {
                billUploadId: billId,
                items: result.items, // JSON field
                totalAmount: result.totalAmount,
                completedAt: new Date(),
            },
        });

        // Update bill status to COMPLETED
        await prisma.billUpload.update({
            where: { id: billId },
            data: { status: "COMPLETED" },
        });

        // Update AI job to COMPLETED
        await prisma.aIProcessingJob.update({
            where: { billUploadId: billId },
            data: {
                status: "COMPLETED",
                finishedAt: new Date(),
            },
        });
    } catch (error) {
        console.error("Bill processing error:", error);

        // Update bill status to FAILED
        await prisma.billUpload.update({
            where: { id: billId },
            data: { status: "FAILED" },
        });

        // Update AI job to FAILED
        await prisma.aIProcessingJob.update({
            where: { billUploadId: billId },
            data: {
                status: "FAILED",
                finishedAt: new Date(),
                error: "Failed to process bill with LLM",
            },
        });
    }
};

// GET /bills/:billId - Get bill processing status
export const getBillStatus = async (req: Request, res: Response) => {
    try {
        const { billId } = req.params;

        if (!billId) {
            return res.status(400).json({
                error: {
                    code: "MISSING_BILL_ID",
                    message: "billId is required as path parameter",
                },
            });
        }

        const billUpload = await prisma.billUpload.findUnique({
            where: { id: billId as string },
            include: {
                parsedBill: true,
                aiJob: true,
            },
        });

        if (!billUpload) {
            return res.status(404).json({
                error: {
                    code: "BILL_NOT_FOUND",
                    message: "Bill does not exist",
                },
            });
        }

        const response: any = {
            billId: billUpload.id,
            groupId: billUpload.groupId,
            status: billUpload.status,
            uploadedAt: billUpload.uploadedAt,
        };

        if (billUpload.status === "COMPLETED" && billUpload.parsedBill) {
            response.parsedItems = billUpload.parsedBill.items;
            response.totalDetectedAmount = Number(billUpload.parsedBill.totalAmount);
            response.completedAt = billUpload.parsedBill.completedAt;
        }

        if (billUpload.status === "PROCESSING" && billUpload.aiJob) {
            response.progress = 50; // Mock progress
        }

        if (billUpload.status === "FAILED" && billUpload.aiJob) {
            response.error = {
                code: "PROCESSING_FAILED",
                message: billUpload.aiJob.error || "Processing failed",
            };
        }

        return res.status(200).json(response);
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            error: {
                code: "INTERNAL_SERVER_ERROR",
                message: "An error occurred while fetching bill status",
            },
        });
    }
};

// POST /bills/:billId/confirm - Confirm and create smart expense
export const confirmBillItems = async (req: Request, res: Response) => {
    try {
        const { billId } = req.params;
        const { paidBy, expenseTitle, adjustedItems } = req.body;

        if (!billId) {
            return res.status(400).json({
                error: {
                    code: "MISSING_BILL_ID",
                    message: "billId is required as path parameter",
                },
            });
        }

        if (!paidBy || !expenseTitle) {
            return res.status(400).json({
                error: {
                    code: "MISSING_FIELDS",
                    message: "paidBy and expenseTitle are required",
                },
            });
        }

        const billUpload = await prisma.billUpload.findUnique({
            where: { id: billId as string },
            include: { parsedBill: true },
        });

        if (!billUpload || billUpload.status !== "COMPLETED" || !billUpload.parsedBill) {
            return res.status(400).json({
                error: {
                    code: "BILL_NOT_READY",
                    message: "Bill is not ready for confirmation",
                },
            });
        }

        // Get group members with preferences
        const members = await prisma.groupMember.findMany({
            where: { groupId: billUpload.groupId },
            select: {
                userId: true,
                isVegetarian: true,
                drinksAlcohol: true,
            },
        });

        if (members.length === 0) {
            return res.status(400).json({
                error: {
                    code: "NO_GROUP_MEMBERS",
                    message: "Group has no members",
                },
            });
        }

        // Verify paidBy is a group member
        const paidByMember = members.find(m => m.userId === paidBy);
        if (!paidByMember) {
            return res.status(400).json({
                error: {
                    code: "INVALID_PAYER",
                    message: "paidBy user must be a group member",
                },
            });
        }

        // Get group details
        const group = await prisma.group.findUnique({
            where: { id: billUpload.groupId },
        });

        // Use adjusted items if provided, otherwise use parsed items
        const items = adjustedItems || (billUpload.parsedBill.items as any[]);

        // Apply smart allocation based on preferences
        const smartAllocatedItems = allocateItemsByPreferences(items, members);

        // Calculate total
        const itemsTotal = items.reduce((sum: number, item: any) => sum + parseFloat(item.amount), 0);
        const taxAmount = Number(billUpload.parsedBill.totalAmount || 0) - itemsTotal;
        const totalAmount = itemsTotal + taxAmount;

        // Create expense with smart allocation
        const expense = await prisma.expense.create({
            data: {
                groupId: billUpload.groupId,
                title: expenseTitle as string,
                paidBy: paidBy as string,
                currency: group!.currency,
                createdBy: paidBy as string,
                taxAmount: Math.max(0, taxAmount),
                items: {
                    create: smartAllocatedItems.map((item: any) => ({
                        name: item.name,
                        amount: parseFloat(item.amount),
                        category: item.category,
                        participants: {
                            create: item.sharedBy.map((userId: string) => ({ userId })),
                        },
                    })),
                },
            },
            include: {
                items: {
                    include: {
                        participants: true,
                    },
                },
            },
        });

        // Update bill upload with expenseId (store as JSON or create relationship)
        await prisma.billUpload.update({
            where: { id: billId as string },
            data: { status: "COMPLETED" }, // Mark as fully processed
        });

        // Calculate split summary
        const splitSummary = await calculateSplitSummary(expense.id);

        return res.status(201).json({
            billId: billUpload.id,
            expenseId: expense.id,
            message: "Expense created from bill with smart allocation",
            expense: {
                expenseId: expense.id,
                groupId: expense.groupId,
                title: expense.title,
                paidBy: expense.paidBy,
                totalAmount: Math.round(totalAmount * 100) / 100,
                items: expense.items.map((item) => ({
                    name: item.name,
                    amount: Number(item.amount),
                    category: item.category,
                    sharedBy: item.participants.map((p) => p.userId),
                })),
                splitSummary,
            },
            smartAllocation: {
                message: "Items automatically allocated based on member preferences",
                allocationDetails: smartAllocatedItems.map((item: any) => ({
                    item: item.name,
                    category: item.category,
                    allocatedTo: item.sharedBy,
                    reason: getAllocationReason(item.category, members),
                })),
            },
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            error: {
                code: "INTERNAL_SERVER_ERROR",
                message: "An error occurred while confirming bill items",
            },
        });
    }
};

// Helper: Get allocation reason for transparency
const getAllocationReason = (
    category: string,
    members: Array<{userId: string, isVegetarian: boolean, drinksAlcohol: boolean}>
) => {
    switch (category.toLowerCase()) {
        case 'veg':
            return "All members can share vegetarian items";
        case 'non_veg':
            const nonVegCount = members.filter(m => !m.isVegetarian).length;
            return `Split among ${nonVegCount} non-vegetarian members`;
        case 'alcohol':
            const drinkerCount = members.filter(m => m.drinksAlcohol).length;
            return `Split among ${drinkerCount} members who drink alcohol`;
        default:
            return "Split equally among all members";
    }
};

// Helper function (import from expense controller or create shared utility)
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
        (splitMap[expense.paidBy]!.paid) += itemAmount;

        // Split item among participants
        if (item.participants.length > 0) {
            const perPersonAmount = itemAmount / item.participants.length;

            for (const participant of item.participants) {
                if (!splitMap[participant.userId]) {
                    splitMap[participant.userId] = { owes: 0, paid: 0 };
                }
                splitMap[participant.userId]!.owes = (splitMap[participant.userId]!.owes || 0) + perPersonAmount;
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

export { upload };