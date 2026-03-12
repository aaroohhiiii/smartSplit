import { type Request, type Response } from "express";
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export const createGroup = async (req: Request, res: Response) => {
    try {
        const { name, description, currency } = req.body;
        const createdBy = req.auth?.userId;

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

        const groupWithMembers = await prisma.group.findUnique({
            where: { id: group.id },
            include: { members: true },
        });

        res.status(201).json(groupWithMembers);
    } catch (error) {
        console.error("[createGroup error]", error);
        res.status(500).json({
            error: {
                code: "INTERNAL_SERVER_ERROR",
                message: "An error occurred while creating the group",
            },
        });
    }
};

export const listGroups = async (req: Request, res: Response) => {
    try {
        // Use query param ONLY — no Clerk auth check
        const userId = req.query.userId as string;

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
    } catch (error) {
        console.error("[listGroups error]", error);
        res.status(500).json({
            error: {
                code: "INTERNAL_SERVER_ERROR",
                message: "An error occurred while fetching groups",
            },
        });
    }
};

export const getGroupDetails = async (req: Request, res: Response) => {
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
                id: groupId as string,
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
    } catch (error) {
        console.error("[getGroupDetails error]", error);
        res.status(500).json({
            error: {
                code: "INTERNAL_SERVER_ERROR",
                message: "An error occurred while fetching group details",
            },
        });
    }
};

export const addGroupMember = async (req: Request, res: Response) => {
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
        const group = await prisma.group.findUnique({ where: { id: groupId as string } });
        if (!group) {
            return res.status(404).json({
                error: { code: "GROUP_NOT_FOUND", message: "Group does not exist" },
            });
        }

        // Check if user already a member
        const existingMember = await prisma.groupMember.findFirst({
            where: { groupId: groupId as string, userId },
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
                groupId: groupId as string,
                userId,
                isVegetarian: preferences.isVegetarian,
                drinksAlcohol: preferences.drinksAlcohol,
                role: "MEMBER",
            },
        });

        console.log(`[addGroupMember] Success: ${member.id}`);
        res.status(201).json(member);
    } catch (error) {
        console.error("[addGroupMember error]", error);
        res.status(500).json({
            error: {
                code: "INTERNAL_SERVER_ERROR",
                message: "An error occurred while adding group member",
            },
        });
    }
};

export const updateMemberPreferences = async (req: Request, res: Response) => {
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
                id: memberId as string,
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
                id: memberId as string,
            },
            data: {
                isVegetarian: preferences.isVegetarian,
                drinksAlcohol: preferences.drinksAlcohol,
            },
        });

        res.status(200).json(updatedMember);
    } catch (error) {
        console.error("[updateMemberPreferences error]", error);
        res.status(500).json({
            error: {
                code: "INTERNAL_SERVER_ERROR",
                message: "An error occurred while updating member preferences",
            },
        });
    }
};

export const removeGroupMember = async (req: Request, res: Response) => {
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
                id: memberId as string,
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
                    groupId: groupId as string,
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
                id: memberId as string,
            },
        });

        console.log(`[removeGroupMember] Deleted member ${memberId}`);
        res.status(204).send();
    } catch (error) {
        console.error("[removeGroupMember error]", error);
        res.status(500).json({
            error: {
                code: "INTERNAL_SERVER_ERROR",
                message: "An error occurred while removing group member",
            },
        });
    }
};