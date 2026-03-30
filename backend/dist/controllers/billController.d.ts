import { type Request, type Response } from "express";
import "dotenv/config";
import multer from "multer";
declare const upload: multer.Multer;
export declare const billUpload: multer.Multer;
export declare const uploadBill: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getBillStatus: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const confirmBillItems: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export { upload };
//# sourceMappingURL=billController.d.ts.map