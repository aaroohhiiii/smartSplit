import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import multer from "multer";
import path from "path";
import fs from "fs";
import { parseBillWithGroq } from "../services/llmService";
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
// Configure multer for bill uploads
const billStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadsDir = path.join(process.cwd(), "uploads", "group-bills");
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
const billUpload = multer({
    storage: billStorage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|pdf/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        }
        else {
            cb(new Error("Only JPEG, PNG, and PDF files are allowed"));
        }
    },
});
// Helper function to process bill asynchronously
const processBillForGroupAsync = async (groupId, billUploadId, filePath) => {
    try {
        // Update AI job status to RUNNING
        await prisma.aIProcessingJob.update({
            where: { billUploadId },
            data: { status: "RUNNING" },
        });
        // Process with Groq LLM
        const fileBuffer = fs.readFileSync(filePath);
        const result = await parseBillWithGroq(fileBuffer, filePath);
        // Create ParsedBill record
        await prisma.parsedBill.create({
            data: {
                billUploadId,
                items: result.items,
                totalAmount: result.totalAmount,
                completedAt: new Date(),
            },
        });
        // Update bill status to COMPLETED
        await prisma.billUpload.update({
            where: { id: billUploadId },
            data: { status: "COMPLETED" },
        });
        // Update AI job to COMPLETED
        await prisma.aIProcessingJob.update({
            where: { billUploadId },
            data: {
                status: "COMPLETED",
                finishedAt: new Date(),
            },
        });
        console.log(`[Group Bill Processing] Successfully processed bill ${billUploadId} for group ${groupId}`);
    }
    catch (error) {
        console.error("[Group Bill Processing Error]", error);
        // Update bill status to FAILED
        await prisma.billUpload.update({
            where: { id: billUploadId },
            data: { status: "FAILED" },
        });
        // Update AI job to FAILED
        await prisma.aIProcessingJob.update({
            where: { billUploadId },
            data: {
                status: "FAILED",
                finishedAt: new Date(),
                error: error instanceof Error ? error.message : "Failed to process bill with Groq",
            },
        });
    }
};
export const createGroup = async (req, res) => {
    try {
        const { name, description, currency, initialPayer } = req.body;
        const createdBy = req.auth?.userId;
        const file = req.file;
        if (!name || !currency || !createdBy) {
            return res.status(400).json({
                error: {
                    code: "MISSING_FIELDS",
                    message: "Name, currency, and authentication are required",
                },
            });
        }
        if (name.length > 100) {
            return res.status(400).json({
                error: {
                    code: "INVALID_NAME",
                    message: "Name must be at most 100 characters",
                },
            });
        }
        const group = await prisma.group.create({
            data: {
                name,
                description: description || null,
                currency,
                createdBy,
                ...(initialPayer && { initialPayer }),
            },
        });
        // Add creator as OWNER member
        await prisma.groupMember.create({
            data: {
                groupId: group.id,
                userId: createdBy,
                role: "OWNER",
                isVegetarian: false,
                drinksAlcohol: false,
            },
        });
        // Handle optional bill upload
        let billData = null;
        if (file) {
            try {
                const billUploadRecord = await prisma.billUpload.create({
                    data: {
                        groupId: group.id,
                        fileUrl: file.path,
                        status: "UPLOADED",
                        uploadedBy: createdBy,
                    },
                });
                // Create AI processing job
                await prisma.aIProcessingJob.create({
                    data: {
                        billUploadId: billUploadRecord.id,
                        status: "QUEUED",
                    },
                });
                // Start async processing
                processBillForGroupAsync(group.id, billUploadRecord.id, file.path).catch(console.error);
                billData = {
                    billId: billUploadRecord.id,
                    status: "QUEUED",
                    uploadedAt: billUploadRecord.uploadedAt,
                };
            }
            catch (billError) {
                console.error("[Group Bill Upload Error]", billError);
                // Don't fail group creation if bill upload fails, just log it
                console.warn(`Bill upload failed for group ${group.id}, but group was created successfully`);
            }
        }
        const groupWithMembers = await prisma.group.findUnique({
            where: { id: group.id },
            include: { members: true },
        });
        res.status(201).json({
            ...groupWithMembers,
            bill: billData, // Include bill info if uploaded
        });
    }
    catch (error) {
        console.error("[createGroup error]", error);
        res.status(500).json({
            error: {
                code: "INTERNAL_SERVER_ERROR",
                message: "An error occurred while creating the group",
            },
        });
    }
};
export const createGroupWithBill = async (req, res) => {
    billUpload.single("bill")(req, res, async (err) => {
        if (err) {
            return res.status(400).json({
                error: {
                    code: "FILE_UPLOAD_ERROR",
                    message: err.message,
                },
            });
        }
        await createGroup(req, res);
    });
};
export const listGroups = async (req, res) => {
    try {
        // Use query param ONLY — no Clerk auth check
        const userId = req.query.userId;
        if (!userId) {
            return res.status(400).json({
                error: {
                    code: "MISSING_USER_ID",
                    message: "userId is required as query parameter",
                },
            });
        }
        console.log(`[listGroups] Fetching groups for userId: ${userId}`);
        const groups = await prisma.group.findMany({
            where: {
                members: {
                    some: {
                        userId: userId,
                    },
                },
            },
            include: {
                members: true,
            },
        });
        const groupsWithCount = groups.map((g) => ({
            ...g,
            memberCount: g.members.length,
        }));
        console.log(`[listGroups] Found ${groupsWithCount.length} groups`);
        res.status(200).json(groupsWithCount);
    }
    catch (error) {
        console.error("[listGroups error]", error);
        res.status(500).json({
            error: {
                code: "INTERNAL_SERVER_ERROR",
                message: "An error occurred while fetching groups",
            },
        });
    }
};
export const getGroupDetails = async (req, res) => {
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
        const group = await prisma.group.findUnique({
            where: {
                id: groupId,
            },
            include: {
                members: true,
            },
        });
        if (!group) {
            return res.status(404).json({
                error: {
                    code: "GROUP_NOT_FOUND",
                    message: "No group found with the provided groupId",
                },
            });
        }
        res.status(200).json(group);
    }
    catch (error) {
        console.error("[getGroupDetails error]", error);
        res.status(500).json({
            error: {
                code: "INTERNAL_SERVER_ERROR",
                message: "An error occurred while fetching group details",
            },
        });
    }
};
export const addGroupMember = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { userId, preferences } = req.body;
        console.log(`[addGroupMember] groupId=${groupId}, userId=${userId}, preferences=`, preferences);
        if (!userId || !groupId) {
            return res.status(400).json({
                error: {
                    code: "MISSING_FIELDS",
                    message: "userId (body) and groupId (path) are required",
                },
            });
        }
        if (!preferences || typeof preferences.isVegetarian !== "boolean" || typeof preferences.drinksAlcohol !== "boolean") {
            return res.status(400).json({
                error: {
                    code: "INVALID_PREFERENCES",
                    message: "preferences with isVegetarian and drinksAlcohol (boolean) are required",
                },
            });
        }
        // Check if group exists
        const group = await prisma.group.findUnique({ where: { id: groupId } });
        if (!group) {
            return res.status(404).json({
                error: { code: "GROUP_NOT_FOUND", message: "Group does not exist" },
            });
        }
        // Check if user already a member
        const existingMember = await prisma.groupMember.findFirst({
            where: { groupId: groupId, userId },
        });
        if (existingMember) {
            return res.status(409).json({
                error: {
                    code: "MEMBER_ALREADY_EXISTS",
                    message: "User is already a member of the group",
                },
            });
        }
        const member = await prisma.groupMember.create({
            data: {
                groupId: groupId,
                userId,
                isVegetarian: preferences.isVegetarian,
                drinksAlcohol: preferences.drinksAlcohol,
                role: "MEMBER",
            },
        });
        console.log(`[addGroupMember] Success: ${member.id}`);
        res.status(201).json(member);
    }
    catch (error) {
        console.error("[addGroupMember error]", error);
        res.status(500).json({
            error: {
                code: "INTERNAL_SERVER_ERROR",
                message: "An error occurred while adding group member",
            },
        });
    }
};
export const updateMemberPreferences = async (req, res) => {
    try {
        const { groupId, memberId } = req.params;
        const { preferences } = req.body;
        if (!groupId || !memberId) {
            return res.status(400).json({
                error: {
                    code: "MISSING_FIELDS",
                    message: "groupId and memberId are required",
                },
            });
        }
        if (!preferences || typeof preferences.isVegetarian !== "boolean" || typeof preferences.drinksAlcohol !== "boolean") {
            return res.status(400).json({
                error: {
                    code: "INVALID_PREFERENCES",
                    message: "preferences with isVegetarian and drinksAlcohol (boolean) are required",
                },
            });
        }
        const member = await prisma.groupMember.findUnique({
            where: {
                id: memberId,
            },
        });
        if (!member || member.groupId !== groupId) {
            return res.status(404).json({
                error: {
                    code: "MEMBER_NOT_FOUND",
                    message: "No member found with the provided memberId in the specified group",
                },
            });
        }
        const updatedMember = await prisma.groupMember.update({
            where: {
                id: memberId,
            },
            data: {
                isVegetarian: preferences.isVegetarian,
                drinksAlcohol: preferences.drinksAlcohol,
            },
        });
        res.status(200).json(updatedMember);
    }
    catch (error) {
        console.error("[updateMemberPreferences error]", error);
        res.status(500).json({
            error: {
                code: "INTERNAL_SERVER_ERROR",
                message: "An error occurred while updating member preferences",
            },
        });
    }
};
export const removeGroupMember = async (req, res) => {
    try {
        const { groupId, memberId } = req.params;
        if (!groupId || !memberId) {
            return res.status(400).json({
                error: {
                    code: "MISSING_FIELDS",
                    message: "groupId and memberId are required",
                },
            });
        }
        const member = await prisma.groupMember.findUnique({
            where: {
                id: memberId,
            },
        });
        if (!member || member.groupId !== groupId) {
            return res.status(404).json({
                error: {
                    code: "MEMBER_NOT_FOUND",
                    message: "No member found with the provided memberId in the specified group",
                },
            });
        }
        if (member.role === "OWNER") {
            const ownerCount = await prisma.groupMember.count({
                where: {
                    groupId: groupId,
                    role: "OWNER",
                },
            });
            if (ownerCount === 1) {
                return res.status(400).json({
                    error: {
                        code: "CANNOT_REMOVE_OWNER",
                        message: "Cannot remove the only owner of the group. Please transfer ownership before removing this member.",
                    },
                });
            }
        }
        await prisma.groupMember.delete({
            where: {
                id: memberId,
            },
        });
        console.log(`[removeGroupMember] Deleted member ${memberId}`);
        res.status(204).send();
    }
    catch (error) {
        console.error("[removeGroupMember error]", error);
        res.status(500).json({
            error: {
                code: "INTERNAL_SERVER_ERROR",
                message: "An error occurred while removing group member",
            },
        });
    }
};
//# sourceMappingURL=groupController.js.map