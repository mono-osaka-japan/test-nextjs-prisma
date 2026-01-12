-- CreateTable
CREATE TABLE "SystemGroup" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "startDate" DATETIME,
    "endDate" DATETIME,
    "budget" REAL,
    "targetMetrics" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "systemGroupId" TEXT,
    CONSTRAINT "Campaign_systemGroupId_fkey" FOREIGN KEY ("systemGroupId") REFERENCES "SystemGroup" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Pattern" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'DEFAULT',
    "config" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "campaignId" TEXT,
    "systemGroupId" TEXT,
    CONSTRAINT "Pattern_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Pattern_systemGroupId_fkey" FOREIGN KEY ("systemGroupId") REFERENCES "SystemGroup" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "SystemGroup_name_key" ON "SystemGroup"("name");

-- CreateIndex
CREATE INDEX "SystemGroup_name_idx" ON "SystemGroup"("name");

-- CreateIndex
CREATE INDEX "SystemGroup_isActive_idx" ON "SystemGroup"("isActive");

-- CreateIndex
CREATE INDEX "Campaign_name_idx" ON "Campaign"("name");

-- CreateIndex
CREATE INDEX "Campaign_status_idx" ON "Campaign"("status");

-- CreateIndex
CREATE INDEX "Campaign_systemGroupId_idx" ON "Campaign"("systemGroupId");

-- CreateIndex
CREATE INDEX "Campaign_startDate_idx" ON "Campaign"("startDate");

-- CreateIndex
CREATE INDEX "Campaign_endDate_idx" ON "Campaign"("endDate");

-- CreateIndex
CREATE INDEX "Pattern_name_idx" ON "Pattern"("name");

-- CreateIndex
CREATE INDEX "Pattern_type_idx" ON "Pattern"("type");

-- CreateIndex
CREATE INDEX "Pattern_isActive_idx" ON "Pattern"("isActive");

-- CreateIndex
CREATE INDEX "Pattern_campaignId_idx" ON "Pattern"("campaignId");

-- CreateIndex
CREATE INDEX "Pattern_systemGroupId_idx" ON "Pattern"("systemGroupId");
