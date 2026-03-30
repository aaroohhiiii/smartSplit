import type { Request, Response, NextFunction } from "express";
declare global {
    namespace Express {
        interface Request {
            auth?: {
                userId: string;
                clerkUserId: string;
            };
        }
    }
}
/**
 * Middleware to verify Clerk JWT tokens and attach user info to request
 */
export declare const verifyClerkToken: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Middleware to verify JWT token using simple verification
 * This is a fallback method that parses the token without external API calls
 */
export declare const verifyClerkTokenLocal: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Middleware to require authentication
 */
export declare const requireAuth: (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.d.ts.map