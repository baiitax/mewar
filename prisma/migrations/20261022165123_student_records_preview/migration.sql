-- CreateTable
CREATE TABLE "StudentRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "sourceApplicationId" TEXT NOT NULL,
    "previewStudentId" TEXT NOT NULL,
    "officialMatricNo" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PREVIEW_PROVISIONED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StudentRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StudentRecord_sourceApplicationId_fkey" FOREIGN KEY ("sourceApplicationId") REFERENCES "Application" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StudentSequence" (
    "year" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nextNumber" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AcademicSession" (
    "code" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "status" TEXT NOT NULL DEFAULT 'UNCONFIGURED',
    "isPreview" BOOLEAN NOT NULL DEFAULT true,
    "officialSourceRef" TEXT,
    "approvedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CurriculumVersion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "programmeId" TEXT NOT NULL,
    "academicSessionCode" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'UNCONFIGURED',
    "isPreview" BOOLEAN NOT NULL DEFAULT true,
    "officialSourceRef" TEXT,
    "approvedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CurriculumVersion_programmeId_fkey" FOREIGN KEY ("programmeId") REFERENCES "Programme" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CurriculumVersion_academicSessionCode_fkey" FOREIGN KEY ("academicSessionCode") REFERENCES "AcademicSession" ("code") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CurriculumCourse" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "curriculumVersionId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "level" INTEGER,
    "semester" INTEGER,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CurriculumCourse_curriculumVersionId_fkey" FOREIGN KEY ("curriculumVersionId") REFERENCES "CurriculumVersion" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CurriculumCourse_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StudentEnrollment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentRecordId" TEXT NOT NULL,
    "programmeId" TEXT NOT NULL,
    "academicSessionCode" TEXT NOT NULL,
    "curriculumVersionId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PREVIEW_PENDING',
    "curriculumStatus" TEXT NOT NULL DEFAULT 'UNCONFIGURED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StudentEnrollment_studentRecordId_fkey" FOREIGN KEY ("studentRecordId") REFERENCES "StudentRecord" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StudentEnrollment_programmeId_fkey" FOREIGN KEY ("programmeId") REFERENCES "Programme" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StudentEnrollment_academicSessionCode_fkey" FOREIGN KEY ("academicSessionCode") REFERENCES "AcademicSession" ("code") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StudentEnrollment_curriculumVersionId_fkey" FOREIGN KEY ("curriculumVersionId") REFERENCES "CurriculumVersion" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "StudentRecord_userId_key" ON "StudentRecord"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentRecord_sourceApplicationId_key" ON "StudentRecord"("sourceApplicationId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentRecord_previewStudentId_key" ON "StudentRecord"("previewStudentId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentRecord_officialMatricNo_key" ON "StudentRecord"("officialMatricNo");

-- CreateIndex
CREATE UNIQUE INDEX "CurriculumVersion_programmeId_academicSessionCode_version_key" ON "CurriculumVersion"("programmeId", "academicSessionCode", "version");

-- CreateIndex
CREATE UNIQUE INDEX "CurriculumCourse_curriculumVersionId_courseId_key" ON "CurriculumCourse"("curriculumVersionId", "courseId");

-- CreateIndex
CREATE INDEX "StudentEnrollment_programmeId_academicSessionCode_idx" ON "StudentEnrollment"("programmeId", "academicSessionCode");

-- CreateIndex
CREATE UNIQUE INDEX "StudentEnrollment_studentRecordId_academicSessionCode_key" ON "StudentEnrollment"("studentRecordId", "academicSessionCode");
