import * as runtime from "@prisma/client/runtime/client";
import * as $Class from "./internal/class.js";
import * as Prisma from "./internal/prismaNamespace.js";
export * as $Enums from './enums.js';
export * from "./enums.js";
/**
 * ## Prisma Client
 *
 * Type-safe database client for TypeScript
 * @example
 * ```
 * const prisma = new PrismaClient({
 *   adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL })
 * })
 * // Fetch zero or more Groups
 * const groups = await prisma.group.findMany()
 * ```
 *
 * Read more in our [docs](https://pris.ly/d/client).
 */
export declare const PrismaClient: any;
export type PrismaClient<LogOpts extends Prisma.LogLevel = never, OmitOpts extends Prisma.PrismaClientOptions["omit"] = Prisma.PrismaClientOptions["omit"], ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = $Class.PrismaClient<LogOpts, OmitOpts, ExtArgs>;
export { Prisma };
/**
 * Model Group
 *
 */
export type Group = Prisma.GroupModel;
/**
 * Model GroupMember
 *
 */
export type GroupMember = Prisma.GroupMemberModel;
/**
 * Model Expense
 *
 */
export type Expense = Prisma.ExpenseModel;
/**
 * Model ExpenseItem
 *
 */
export type ExpenseItem = Prisma.ExpenseItemModel;
/**
 * Model ItemParticipant
 *
 */
export type ItemParticipant = Prisma.ItemParticipantModel;
/**
 * Model SplitAllocation
 *
 */
export type SplitAllocation = Prisma.SplitAllocationModel;
/**
 * Model Settlement
 *
 */
export type Settlement = Prisma.SettlementModel;
/**
 * Model BillUpload
 *
 */
export type BillUpload = Prisma.BillUploadModel;
/**
 * Model ParsedBill
 *
 */
export type ParsedBill = Prisma.ParsedBillModel;
/**
 * Model AIProcessingJob
 *
 */
export type AIProcessingJob = Prisma.AIProcessingJobModel;
//# sourceMappingURL=client.d.ts.map