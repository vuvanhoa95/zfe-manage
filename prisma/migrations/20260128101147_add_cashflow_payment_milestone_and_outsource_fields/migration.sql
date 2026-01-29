-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_cash_flows" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT,
    "description" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "date" DATETIME NOT NULL,
    "quotationId" TEXT,
    "paymentMilestoneNo" INTEGER,
    "paymentMilestonePercent" REAL,
    "paymentMilestoneTitle" TEXT,
    "outsourcingStaffId" TEXT,
    "counterpartyName" TEXT,
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "cash_flows_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "cash_flows_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "quotations" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "cash_flows_outsourcingStaffId_fkey" FOREIGN KEY ("outsourcingStaffId") REFERENCES "outsourcing_staff" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "cash_flows_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_cash_flows" ("amount", "category", "createdAt", "createdById", "date", "description", "id", "notes", "projectId", "quotationId", "type", "updatedAt") SELECT "amount", "category", "createdAt", "createdById", "date", "description", "id", "notes", "projectId", "quotationId", "type", "updatedAt" FROM "cash_flows";
DROP TABLE "cash_flows";
ALTER TABLE "new_cash_flows" RENAME TO "cash_flows";
CREATE INDEX "cash_flows_projectId_idx" ON "cash_flows"("projectId");
CREATE INDEX "cash_flows_date_idx" ON "cash_flows"("date");
CREATE INDEX "cash_flows_type_idx" ON "cash_flows"("type");
CREATE INDEX "cash_flows_quotationId_idx" ON "cash_flows"("quotationId");
CREATE INDEX "cash_flows_outsourcingStaffId_idx" ON "cash_flows"("outsourcingStaffId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
