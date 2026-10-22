/*
  Warnings:

  - You are about to drop the column `jambRegNo` on the `Applicant` table. All the data in the column will be lost.
  - You are about to drop the column `nin` on the `Applicant` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "OtpChallenge" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "channel" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "sendCount" INTEGER NOT NULL DEFAULT 1,
    "sendWindowStartedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    "lockedUntil" DATETIME,
    "verifiedAt" DATETIME,
    "consumedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ApplicationSequence" (
    "year" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nextNumber" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ApplicationEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "applicationId" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT NOT NULL,
    "changedById" TEXT,
    "note" TEXT,
    "applicantMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ApplicationEvent_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ApplicationEvent_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Applicant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "jambRegNoEncrypted" TEXT,
    "jambRegNoHash" TEXT,
    "jambRegNoLast4" TEXT,
    "dateOfBirth" DATETIME,
    "gender" TEXT,
    "stateOfOrigin" TEXT,
    "nationality" TEXT NOT NULL DEFAULT 'Nigeria',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Applicant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Applicant" ("createdAt", "dateOfBirth", "gender", "id", "nationality", "stateOfOrigin", "updatedAt", "userId") SELECT "createdAt", "dateOfBirth", "gender", "id", "nationality", "stateOfOrigin", "updatedAt", "userId" FROM "Applicant";
DROP TABLE "Applicant";
ALTER TABLE "new_Applicant" RENAME TO "Applicant";
CREATE UNIQUE INDEX "Applicant_userId_key" ON "Applicant"("userId");
CREATE UNIQUE INDEX "Applicant_jambRegNoHash_key" ON "Applicant"("jambRegNoHash");
CREATE TABLE "new_Application" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "applicantId" TEXT NOT NULL,
    "programmeId" TEXT NOT NULL,
    "session" TEXT NOT NULL,
    "appNo" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "entryMode" TEXT NOT NULL DEFAULT 'UTME',
    "jambScore" INTEGER,
    "jambCapsStatus" TEXT NOT NULL DEFAULT 'NOT_SYNCED',
    "olevel" TEXT,
    "documents" TEXT,
    "counsellorId" TEXT,
    "submittedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Application_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "Applicant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Application_programmeId_fkey" FOREIGN KEY ("programmeId") REFERENCES "Programme" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Application" ("appNo", "applicantId", "counsellorId", "createdAt", "documents", "id", "jambScore", "olevel", "programmeId", "session", "status", "submittedAt", "updatedAt") SELECT "appNo", "applicantId", "counsellorId", "createdAt", "documents", "id", "jambScore", "olevel", "programmeId", "session", "status", "submittedAt", "updatedAt" FROM "Application";
DROP TABLE "Application";
ALTER TABLE "new_Application" RENAME TO "Application";
CREATE UNIQUE INDEX "Application_appNo_key" ON "Application"("appNo");
CREATE INDEX "Application_applicantId_updatedAt_idx" ON "Application"("applicantId", "updatedAt");
CREATE INDEX "Application_status_updatedAt_idx" ON "Application"("status", "updatedAt");
CREATE UNIQUE INDEX "Application_applicantId_programmeId_session_key" ON "Application"("applicantId", "programmeId", "session");
CREATE TABLE "new_Programme" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "school" TEXT NOT NULL,
    "durationYears" INTEGER NOT NULL DEFAULT 4,
    "degree" TEXT NOT NULL DEFAULT 'BSc',
    "nucRef" TEXT,
    "nucValidUntil" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isAcceptingApplications" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Programme" ("createdAt", "degree", "durationYears", "id", "isActive", "nucRef", "nucValidUntil", "school", "slug", "title", "updatedAt") SELECT "createdAt", "degree", "durationYears", "id", "isActive", "nucRef", "nucValidUntil", "school", "slug", "title", "updatedAt" FROM "Programme";
DROP TABLE "Programme";
ALTER TABLE "new_Programme" RENAME TO "Programme";
CREATE UNIQUE INDEX "Programme_slug_key" ON "Programme"("slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "OtpChallenge_expiresAt_idx" ON "OtpChallenge"("expiresAt");

-- CreateIndex
CREATE INDEX "ApplicationEvent_applicationId_createdAt_idx" ON "ApplicationEvent"("applicationId", "createdAt");
