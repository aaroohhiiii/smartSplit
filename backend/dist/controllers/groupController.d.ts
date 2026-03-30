import { type Request, type Response } from "express";
import "dotenv/config";
export declare const createGroup: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const createGroupWithBill: (req: Request, res: Response) => Promise<void>;
export declare const listGroups: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getGroupDetails: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const addGroupMember: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateMemberPreferences: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const removeGroupMember: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=groupController.d.ts.map