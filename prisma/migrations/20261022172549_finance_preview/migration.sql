-- CreateTable
CREATE TABLE "FeeAssessment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "enrollmentId" TEXT NOT NULL,
    "feeScheduleId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "isPreview" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "programmeId" TEXT,
    CONSTRAINT "FeeAssessment_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "StudentEnrollment" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FeeAssessment_feeScheduleId_fkey" FOREIGN KEY ("feeScheduleId") REFERENCES "FeeSchedule" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FeeAssessment_programmeId_fkey" FOREIGN KEY ("programmeId") REFERENCES "Programme" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FinancePayment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "feeAssessmentId" TEXT NOT NULL,
    "providerName" TEXT NOT NULL DEFAULT 'PREVIEW_SIMULATOR',
    "providerReference" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "status" TEXT NOT NULL DEFAULT 'PREVIEW_CAPTURED',
    "receiptCode" TEXT NOT NULL,
    "receiptToken" TEXT NOT NULL,
    "settlementBatchId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FinancePayment_feeAssessmentId_fkey" FOREIGN KEY ("feeAssessmentId") REFERENCES "FeeAssessment" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FinancePayment_settlementBatchId_fkey" FOREIGN KEY ("settlementBatchId") REFERENCES "SettlementBatch" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FinanceLedgerEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "feeAssessmentId" TEXT NOT NULL,
    "paymentId" TEXT,
    "entryType" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "idempotencyKey" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FinanceLedgerEntry_feeAssessmentId_fkey" FOREIGN KEY ("feeAssessmentId") REFERENCES "FeeAssessment" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FinanceLedgerEntry_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "FinancePayment" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SettlementBatch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "providerName" TEXT NOT NULL DEFAULT 'PREVIEW_SIMULATOR',
    "providerBatchReference" TEXT NOT NULL,
    "requestHash" TEXT NOT NULL,
    "reportedAmount" INTEGER NOT NULL,
    "matchedAmount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "status" TEXT NOT NULL,
    "createdById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "PreviewReceiptSequence" (
    "year" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nextNumber" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "FeeAssessment_enrollmentId_key" ON "FeeAssessment"("enrollmentId");

-- CreateIndex
CREATE INDEX "FeeAssessment_createdAt_idx" ON "FeeAssessment"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "FinancePayment_feeAssessmentId_key" ON "FinancePayment"("feeAssessmentId");

-- CreateIndex
CREATE UNIQUE INDEX "FinancePayment_providerReference_key" ON "FinancePayment"("providerReference");

-- CreateIndex
CREATE UNIQUE INDEX "FinancePayment_idempotencyKey_key" ON "FinancePayment"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "FinancePayment_receiptCode_key" ON "FinancePayment"("receiptCode");

-- CreateIndex
CREATE UNIQUE INDEX "FinancePayment_receiptToken_key" ON "FinancePayment"("receiptToken");

-- CreateIndex
CREATE INDEX "FinancePayment_createdAt_idx" ON "FinancePayment"("createdAt");

-- CreateIndex
CREATE INDEX "FinancePayment_settlementBatchId_idx" ON "FinancePayment"("settlementBatchId");

-- CreateIndex
CREATE UNIQUE INDEX "FinanceLedgerEntry_paymentId_key" ON "FinanceLedgerEntry"("paymentId");

-- CreateIndex
CREATE UNIQUE INDEX "FinanceLedgerEntry_idempotencyKey_key" ON "FinanceLedgerEntry"("idempotencyKey");

-- CreateIndex
CREATE INDEX "FinanceLedgerEntry_feeAssessmentId_createdAt_idx" ON "FinanceLedgerEntry"("feeAssessmentId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SettlementBatch_providerBatchReference_key" ON "SettlementBatch"("providerBatchReference");

-- CreateIndex
CREATE INDEX "SettlementBatch_createdAt_idx" ON "SettlementBatch"("createdAt");

-- CreateIndex
CREATE INDEX "SettlementBatch_status_createdAt_idx" ON "SettlementBatch"("status", "createdAt");
