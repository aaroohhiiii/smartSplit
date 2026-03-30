import type { Request, Response } from "express";
export declare const getAuthenticatedUserId: (req: Request) => string;
export declare const errorResponse: (res: Response, statusCode: number, code: string, message: string) => Response<any, Record<string, any>>;
export declare const successResponse: (res: Response, statusCode: number, data: any) => Response<any, Record<string, any>>;
//# sourceMappingURL=apiHelper.d.ts.map