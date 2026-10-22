/*
  Warnings:

  - You are about to drop the column `programmeId` on the `FeeAssessment` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_FeeAssessment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "enrollmentId" TEXT NOT NULL,
    "feeScheduleId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "isPreview" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FeeAssessment_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "StudentEnrollment" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FeeAssessment_feeScheduleId_fkey" FOREIGN KEY ("feeScheduleId") REFERENCES "FeeSchedule" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_FeeAssessment" ("amount", "createdAt", "currency", "enrollmentId", "feeScheduleId", "id", "isPreview") SELECT "amount", "createdAt", "currency", "enrollmentId", "feeScheduleId", "id", "isPreview" FROM "FeeAssessment";
DROP TABLE "FeeAssessment";
ALTER TABLE "new_FeeAssessment" RENAME TO "FeeAssessment";
CREATE UNIQUE INDEX "FeeAssessment_enrollmentId_key" ON "FeeAssessment"("enrollmentId");
CREATE INDEX "FeeAssessment_createdAt_idx" ON "FeeAssessment"("createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
