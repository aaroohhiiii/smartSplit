-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('VEG', 'NON_VEG', 'ALCOHOL', 'SHARED');

-- CreateEnum
CREATE TYPE "BillStatus" AS ENUM ('UPLOADED', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "paidBy" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "taxAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpenseItem" (
    "id" TEXT NOT NULL,
    "expenseId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "category" "ExpenseCategory" NOT NULL,

    CONSTRAINT "ExpenseItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemParticipant" (
    "id" TEXT NOT NULL,
    "expenseItemId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "ItemParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SplitAllocation" (
    "id" TEXT NOT NULL,
    "expenseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "paid" DECIMAL(65,30) NOT NULL DEFAULT 0,

    CONSTRAINT "SplitAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settlement" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Settlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillUpload" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "status" "BillStatus" NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BillUpload_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParsedBill" (
    "id" TEXT NOT NULL,
    "billUploadId" TEXT NOT NULL,
    "items" JSONB NOT NULL,
    "totalAmount" DECIMAL(65,30) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ParsedBill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIProcessingJob" (
    "id" TEXT NOT NULL,
    "billUploadId" TEXT NOT NULL,
    "status" "JobStatus" NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "error" TEXT,

    CONSTRAINT "AIProcessingJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ParsedBill_billUploadId_key" ON "ParsedBill"("billUploadId");

-- CreateIndex
CREATE UNIQUE INDEX "AIProcessingJob_billUploadId_key" ON "AIProcessingJob"("billUploadId");

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseItem" ADD CONSTRAINT "ExpenseItem_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "Expense"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemParticipant" ADD CONSTRAINT "ItemParticipant_expenseItemId_fkey" FOREIGN KEY ("expenseItemId") REFERENCES "ExpenseItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SplitAllocation" ADD CONSTRAINT "SplitAllocation_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "Expense"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Settlement" ADD CONSTRAINT "Settlement_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillUpload" ADD CONSTRAINT "BillUpload_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParsedBill" ADD CONSTRAINT "ParsedBill_billUploadId_fkey" FOREIGN KEY ("billUploadId") REFERENCES "BillUpload"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIProcessingJob" ADD CONSTRAINT "AIProcessingJob_billUploadId_fkey" FOREIGN KEY ("billUploadId") REFERENCES "BillUpload"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
