import { type Request, type Response } from "express";
import "dotenv/config";
export declare const createExpense: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const listExpense: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getExpenseDetails: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateExpense: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const deleteExpense: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=expenseController.d.ts.map