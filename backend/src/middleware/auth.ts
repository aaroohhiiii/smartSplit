import type { Request, Response, NextFunction } from "express";
import axios from "axios";

import { getAuth } from "@clerk/express";
// Extend Express Request to include user info
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

const CLERK_API_URL = "https://api.clerk.com/v1";
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;

/**
 * Middleware to verify Clerk JWT tokens and attach user info to request
 */
export const verifyClerkToken = (req: Request, res: Response, next: NextFunction): void => {
  const auth = getAuth(req);

  console.log("AUTH DEBUG:", auth);
console.log("AUTH HEADER:", req.headers.authorization);
  if (!auth.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  req.auth = {
    userId: auth.userId,
    clerkUserId: auth.userId,
  };

  next();
};

/**
 * Middleware to verify JWT token using simple verification
 * This is a fallback method that parses the token without external API calls
 */
export const verifyClerkTokenLocal = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;
        console.log("[Auth] Authorization header:", authHeader ? "present" : "missing");

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            console.log("[Auth] Missing or invalid Bearer token");
            res.status(401).json({ error: "Missing or invalid authorization header" });
            return;
        }

        const token = authHeader.substring(7);
        console.log("[Auth] Token received (first 20 chars):", token.substring(0, 20));

        const parts = token.split(".");
        if (parts.length !== 3) {
            console.log("[Auth] Invalid token format: expected 3 parts, got", parts.length);
            res.status(401).json({ error: "Invalid token format" });
            return;
        }

        try {
            const payload = JSON.parse(
                Buffer.from(parts[1]!, "base64").toString("utf-8")
            );
            console.log("[Auth] Decoded payload:", payload);

            const clerkUserId = payload.sub || payload.user_id;
            if (!clerkUserId) {
                console.log("[Auth] No userId found in payload");
                res.status(401).json({ error: "Invalid token: missing user ID" });
                return;
            }

            console.log("[Auth] ✓ User authenticated:", clerkUserId);
            req.auth = {
                userId: clerkUserId,
                clerkUserId,
            };

            next();
        } catch (decodeError) {
            console.log("[Auth] Failed to decode payload:", decodeError);
            res.status(401).json({ error: "Failed to decode token" });
        }
    } catch (error) {
        console.error("[Auth] Token verification failed:", error);
        res.status(401).json({
            error: "Token verification failed",
        });
    }
};

/**
 * Middleware to require authentication
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
    if (!req.auth || !req.auth.userId) {
        res.status(401).json({ error: "Authentication required" });
        return;
    }
    next();
};
