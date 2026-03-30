import * as runtime from "@prisma/client/runtime/index-browser";
export type * from '../models.js';
export type * from './prismaNamespace.js';
export declare const Decimal: typeof runtime.Decimal;
export declare const NullTypes: {
    DbNull: (new (secret: never) => typeof runtime.DbNull);
    JsonNull: (new (secret: never) => typeof runtime.JsonNull);
    AnyNull: (new (secret: never) => typeof runtime.AnyNull);
};
/**
 * Helper for filtering JSON entries that have `null` on the database (empty on the db)
 *
 * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
 */
export declare const DbNull: import("@prisma/client-runtime-utils").DbNullClass;
/**
 * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
 *
 * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
 */
export declare const JsonNull: import("@prisma/client-runtime-utils").JsonNullClass;
/**
 * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
 *
 * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
 */
export declare const AnyNull: import("@prisma/client-runtime-utils").AnyNullClass;
export declare const ModelName: {
    readonly Group: "Group";
    readonly GroupMember: "GroupMember";
    readonly Expense: "Expense";
    readonly ExpenseItem: "ExpenseItem";
    readonly ItemParticipant: "ItemParticipant";
    readonly SplitAllocation: "SplitAllocation";
    readonly Settlement: "Settlement";
    readonly BillUpload: "BillUpload";
    readonly ParsedBill: "ParsedBill";
    readonly AIProcessingJob: "AIProcessingJob";
};
export type ModelName = (typeof ModelName)[keyof typeof ModelName];
export declare const TransactionIsolationLevel: {
    readonly ReadUncommitted: "ReadUncommitted";
    readonly ReadCommitted: "ReadCommitted";
    readonly RepeatableRead: "RepeatableRead";
    readonly Serializable: "Serializable";
};
export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel];
export declare const GroupScalarFieldEnum: {
    readonly id: "id";
    readonly name: "name";
    readonly description: "description";
    readonly createdAt: "createdAt";
    readonly createdBy: "createdBy";
    readonly currency: "currency";
};
export type GroupScalarFieldEnum = (typeof GroupScalarFieldEnum)[keyof typeof GroupScalarFieldEnum];
export declare const GroupMemberScalarFieldEnum: {
    readonly id: "id";
    readonly groupId: "groupId";
    readonly userId: "userId";
    readonly isVegetarian: "isVegetarian";
    readonly drinksAlcohol: "drinksAlcohol";
    readonly role: "role";
    readonly joinedAt: "joinedAt";
};
export type GroupMemberScalarFieldEnum = (typeof GroupMemberScalarFieldEnum)[keyof typeof GroupMemberScalarFieldEnum];
export declare const ExpenseScalarFieldEnum: {
    readonly id: "id";
    readonly groupId: "groupId";
    readonly title: "title";
    readonly description: "description";
    readonly createdAt: "createdAt";
    readonly createdBy: "createdBy";
    readonly paidBy: "paidBy";
    readonly currency: "currency";
    readonly taxAmount: "taxAmount";
};
export type ExpenseScalarFieldEnum = (typeof ExpenseScalarFieldEnum)[keyof typeof ExpenseScalarFieldEnum];
export declare const ExpenseItemScalarFieldEnum: {
    readonly id: "id";
    readonly expenseId: "expenseId";
    readonly name: "name";
    readonly amount: "amount";
    readonly category: "category";
};
export type ExpenseItemScalarFieldEnum = (typeof ExpenseItemScalarFieldEnum)[keyof typeof ExpenseItemScalarFieldEnum];
export declare const ItemParticipantScalarFieldEnum: {
    readonly id: "id";
    readonly expenseItemId: "expenseItemId";
    readonly userId: "userId";
};
export type ItemParticipantScalarFieldEnum = (typeof ItemParticipantScalarFieldEnum)[keyof typeof ItemParticipantScalarFieldEnum];
export declare const SplitAllocationScalarFieldEnum: {
    readonly id: "id";
    readonly expenseId: "expenseId";
    readonly userId: "userId";
    readonly amount: "amount";
    readonly paid: "paid";
};
export type SplitAllocationScalarFieldEnum = (typeof SplitAllocationScalarFieldEnum)[keyof typeof SplitAllocationScalarFieldEnum];
export declare const SettlementScalarFieldEnum: {
    readonly id: "id";
    readonly groupId: "groupId";
    readonly fromUserId: "fromUserId";
    readonly toUserId: "toUserId";
    readonly amount: "amount";
    readonly createdAt: "createdAt";
};
export type SettlementScalarFieldEnum = (typeof SettlementScalarFieldEnum)[keyof typeof SettlementScalarFieldEnum];
export declare const BillUploadScalarFieldEnum: {
    readonly id: "id";
    readonly groupId: "groupId";
    readonly uploadedBy: "uploadedBy";
    readonly fileUrl: "fileUrl";
    readonly status: "status";
    readonly uploadedAt: "uploadedAt";
};
export type BillUploadScalarFieldEnum = (typeof BillUploadScalarFieldEnum)[keyof typeof BillUploadScalarFieldEnum];
export declare const ParsedBillScalarFieldEnum: {
    readonly id: "id";
    readonly billUploadId: "billUploadId";
    readonly items: "items";
    readonly totalAmount: "totalAmount";
    readonly completedAt: "completedAt";
};
export type ParsedBillScalarFieldEnum = (typeof ParsedBillScalarFieldEnum)[keyof typeof ParsedBillScalarFieldEnum];
export declare const AIProcessingJobScalarFieldEnum: {
    readonly id: "id";
    readonly billUploadId: "billUploadId";
    readonly status: "status";
    readonly startedAt: "startedAt";
    readonly finishedAt: "finishedAt";
    readonly error: "error";
};
export type AIProcessingJobScalarFieldEnum = (typeof AIProcessingJobScalarFieldEnum)[keyof typeof AIProcessingJobScalarFieldEnum];
export declare const SortOrder: {
    readonly asc: "asc";
    readonly desc: "desc";
};
export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder];
export declare const JsonNullValueInput: {
    readonly JsonNull: import("@prisma/client-runtime-utils").JsonNullClass;
};
export type JsonNullValueInput = (typeof JsonNullValueInput)[keyof typeof JsonNullValueInput];
export declare const QueryMode: {
    readonly default: "default";
    readonly insensitive: "insensitive";
};
export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode];
export declare const NullsOrder: {
    readonly first: "first";
    readonly last: "last";
};
export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder];
export declare const JsonNullValueFilter: {
    readonly DbNull: import("@prisma/client-runtime-utils").DbNullClass;
    readonly JsonNull: import("@prisma/client-runtime-utils").JsonNullClass;
    readonly AnyNull: import("@prisma/client-runtime-utils").AnyNullClass;
};
export type JsonNullValueFilter = (typeof JsonNullValueFilter)[keyof typeof JsonNullValueFilter];
//# sourceMappingURL=prismaNamespaceBrowser.d.ts.map