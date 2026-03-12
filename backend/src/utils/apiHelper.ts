import type { Request, Response } from "express";

export const getAuthenticatedUserId = (req: Request): string => {
    const userId = req.auth?.userId;
    if (!userId) {
        throw new Error("User not authenticated");
    }
    return userId;
};


export const errorResponse = (res: Response, statusCode: number, code: string, message: string) => {
    return res.status(statusCode).json({
        error: {
            code,
            message,
        },
    });
};


export const successResponse = (res: Response, statusCode: number, data: any) => {
    return res.status(statusCode).json(data);
};
