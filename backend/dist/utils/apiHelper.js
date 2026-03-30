export const getAuthenticatedUserId = (req) => {
    const userId = req.auth?.userId;
    if (!userId) {
        throw new Error("User not authenticated");
    }
    return userId;
};
export const errorResponse = (res, statusCode, code, message) => {
    return res.status(statusCode).json({
        error: {
            code,
            message,
        },
    });
};
export const successResponse = (res, statusCode, data) => {
    return res.status(statusCode).json(data);
};
//# sourceMappingURL=apiHelper.js.map