declare class AppError extends Error {
    statusCode: number;
    code: string;
    details?: unknown;
    constructor(message: string, statusCode: number, code: string, details?: unknown);
}
//# sourceMappingURL=AppError.d.ts.map