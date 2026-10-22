-- CreateTable
CREATE TABLE "AuthThrottle" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "failures" INTEGER NOT NULL DEFAULT 0,
    "windowStartedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedUntil" DATETIME,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_FeeSchedule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "programmeId" TEXT NOT NULL,
    "session" TEXT NOT NULL,
    "tuition" INTEGER NOT NULL,
    "hostel" INTEGER NOT NULL DEFAULT 0,
    "feeding" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" DATETIME,
    "publishedById" TEXT,
    "bursarSignature" TEXT,
    "bursarSignedAt" DATETIME,
    "approvalStatus" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdById" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "effectiveFrom" DATETIME NOT NULL,
    "effectiveUntil" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FeeSchedule_programmeId_fkey" FOREIGN KEY ("programmeId") REFERENCES "Programme" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_FeeSchedule" ("bursarSignature", "bursarSignedAt", "createdAt", "currency", "effectiveFrom", "effectiveUntil", "feeding", "hostel", "id", "isPublished", "programmeId", "publishedAt", "publishedById", "session", "total", "tuition", "updatedAt", "version") SELECT "bursarSignature", "bursarSignedAt", "createdAt", "currency", "effectiveFrom", "effectiveUntil", "feeding", "hostel", "id", "isPublished", "programmeId", "publishedAt", "publishedById", "session", "total", "tuition", "updatedAt", "version" FROM "FeeSchedule";
DROP TABLE "FeeSchedule";
ALTER TABLE "new_FeeSchedule" RENAME TO "FeeSchedule";
CREATE UNIQUE INDEX "FeeSchedule_programmeId_session_version_key" ON "FeeSchedule"("programmeId", "session", "version");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
