import "dotenv/config"
import express, { type Request, type Response } from "express";
import cors from "cors";


import groupRoutes from "./routes/groupRoutes.ts";
import expenseRoutes from "./routes/expenseRoutes.ts";
import settlementRoutes from "./routes/settlementRoutes.ts";
import billRoutes from "./routes/billRoutes.ts";

import { clerkMiddleware } from "@clerk/express";

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ───────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
}));
app.use(express.json());
app.use(clerkMiddleware());


// ─── Health check (no auth) ────────────────────────────────────────────────
app.get('/api/v1/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: "ok" });
});

// ─── Routes (auth applied selectively per route) ──────────────────────────
// GET routes (no auth needed)
app.use("/api/v1/groups", groupRoutes);
app.use("/api/v1/groups/:groupId/bills", billRoutes);
app.use("/api/v1/groups", expenseRoutes);
app.use("/api/v1/settlements", settlementRoutes);

// ─── Error handling ───────────────────────────────────────────────────────
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("[Server Error]", err);
  res.status(err.status || 500).json({
    error: {
      code: "SERVER_ERROR",
      message: err.message || "An unexpected error occurred",
    },
  });
});

// ─── Start server ─────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`✓ Server running on http://localhost:${PORT}`);
    console.log(`✓ CORS enabled for ${process.env.FRONTEND_URL || "http://localhost:5173"}`);
});

