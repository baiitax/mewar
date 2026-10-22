-- CreateTable
CREATE TABLE "GovernanceEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "accountableOwnerLabel" TEXT,
    "ownerOffice" TEXT,
    "ownerRole" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "decisionSummary" TEXT,
    "evidenceReference" TEXT,
    "updatedById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GovernanceEntry_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "GovernanceEntry_code_key" ON "GovernanceEntry"("code");

-- CreateIndex
CREATE INDEX "GovernanceEntry_status_updatedAt_idx" ON "GovernanceEntry"("status", "updatedAt");
