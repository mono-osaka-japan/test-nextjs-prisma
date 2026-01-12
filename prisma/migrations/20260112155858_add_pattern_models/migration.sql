-- CreateTable
CREATE TABLE "Pattern" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "authorId" TEXT NOT NULL,
    CONSTRAINT "Pattern_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PatternStep" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "action" TEXT NOT NULL,
    "config" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "patternId" TEXT NOT NULL,
    CONSTRAINT "PatternStep_patternId_fkey" FOREIGN KEY ("patternId") REFERENCES "Pattern" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PatternTestResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL,
    "input" TEXT,
    "output" TEXT,
    "error" TEXT,
    "duration" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "patternId" TEXT NOT NULL,
    CONSTRAINT "PatternTestResult_patternId_fkey" FOREIGN KEY ("patternId") REFERENCES "Pattern" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Pattern_authorId_idx" ON "Pattern"("authorId");

-- CreateIndex
CREATE INDEX "Pattern_isActive_idx" ON "Pattern"("isActive");

-- CreateIndex
CREATE INDEX "PatternStep_patternId_idx" ON "PatternStep"("patternId");

-- CreateIndex
CREATE INDEX "PatternStep_sortOrder_idx" ON "PatternStep"("sortOrder");

-- CreateIndex
CREATE INDEX "PatternTestResult_patternId_idx" ON "PatternTestResult"("patternId");

-- CreateIndex
CREATE INDEX "PatternTestResult_status_idx" ON "PatternTestResult"("status");

-- CreateIndex
CREATE INDEX "PatternTestResult_createdAt_idx" ON "PatternTestResult"("createdAt");
