-- Add outsource detail columns to quotations (if not already present)
ALTER TABLE "quotations" ADD COLUMN "outsourceStaff" TEXT;
ALTER TABLE "quotations" ADD COLUMN "outsourceDiscipline" TEXT;
ALTER TABLE "quotations" ADD COLUMN "outsourceRate" REAL;
ALTER TABLE "quotations" ADD COLUMN "outsourceNote" TEXT;

-- CreateTable
CREATE TABLE "quotation_outsource_lines" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quotationId" TEXT NOT NULL,
    "staffName" TEXT,
    "discipline" TEXT,
    "unit" TEXT,
    "qty" REAL,
    "unitRate" REAL,
    "amount" REAL NOT NULL DEFAULT 0,
    "note" TEXT,
    "order" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "quotation_outsource_lines_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "quotations" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "quotation_outsource_lines_quotationId_idx" ON "quotation_outsource_lines"("quotationId");

