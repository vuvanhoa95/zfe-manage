-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "company_profile" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "name" TEXT NOT NULL,
    "taxCode" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "website" TEXT,
    "phone" TEXT NOT NULL,
    "logoUrl" TEXT,
    "signerName" TEXT NOT NULL,
    "signerTitle" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "taxCode" TEXT,
    "address" TEXT,
    "contactName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectNo" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "customerId" TEXT,
    "location" TEXT NOT NULL DEFAULT 'Hà Nội',
    "startDate" DATETIME,
    "endDate" DATETIME,
    "totalArea" REAL,
    "totalBudget" REAL NOT NULL DEFAULT 0,
    "totalRevenue" REAL NOT NULL DEFAULT 0,
    "totalCost" REAL NOT NULL DEFAULT 0,
    "totalProfit" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PLANNING',
    "notes" TEXT,
    "imageUrl" TEXT,
    "createdById" TEXT NOT NULL,
    "finalQuotationId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "projects_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "projects_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "projects_finalQuotationId_fkey" FOREIGN KEY ("finalQuotationId") REFERENCES "quotations" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "cash_flows" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT,
    "description" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "date" DATETIME NOT NULL,
    "quotationId" TEXT,
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "cash_flows_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "cash_flows_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "quotations" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "cash_flows_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "quotations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quotationNo" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "location" TEXT NOT NULL DEFAULT 'Hà Nội',
    "customerId" TEXT NOT NULL,
    "projectName" TEXT NOT NULL,
    "projectItem" TEXT,
    "projectNotes" TEXT,
    "title" TEXT NOT NULL DEFAULT 'BÁO GIÁ DỊCH VỤ MÔ HÌNH BIM',
    "introText" TEXT,
    "scopeText" TEXT,
    "deliverablesText" TEXT NOT NULL DEFAULT '',
    "scheduleText" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'VND',
    "vatRate" REAL NOT NULL DEFAULT 0.08,
    "totalBeforeVat" REAL NOT NULL DEFAULT 0,
    "vatAmount" REAL NOT NULL DEFAULT 0,
    "totalAfterVat" REAL NOT NULL DEFAULT 0,
    "totalInWords" TEXT,
    "outsourceCost" REAL,
    "taxRate" REAL,
    "taxCost" REAL,
    "commissionType" TEXT,
    "commissionRate" REAL,
    "commissionCost" REAL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "quotations_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "quotations_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "quotations_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "quotation_lines" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quotationId" TEXT NOT NULL,
    "section" TEXT,
    "itemNo" TEXT,
    "title" TEXT NOT NULL,
    "qty" REAL,
    "unit" TEXT,
    "unitPrice" REAL,
    "total" REAL NOT NULL DEFAULT 0,
    "note" TEXT,
    "order" INTEGER NOT NULL,
    "isGroupHeader" BOOLEAN NOT NULL DEFAULT false,
    "isChargeable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "quotation_lines_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "quotations" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "payment_milestones" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quotationId" TEXT NOT NULL,
    "no" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "percent" REAL NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "payment_milestones_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "quotations" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "quotation_revisions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quotationId" TEXT NOT NULL,
    "revisionNo" INTEGER NOT NULL,
    "revisionDate" DATETIME NOT NULL,
    "note" TEXT,
    "snapshotJson" TEXT NOT NULL,
    "totalBeforeVat" REAL NOT NULL,
    "vatAmount" REAL NOT NULL,
    "totalAfterVat" REAL NOT NULL,
    "exportedDocxUrl" TEXT,
    "exportedPdfUrl" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "quotation_revisions_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "quotations" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "quotation_revisions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "catalog_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "unit" TEXT,
    "defaultPrice" REAL,
    "description" TEXT,
    "group" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "outsourcing_staff" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "position" TEXT,
    "department" TEXT,
    "discipline" TEXT,
    "avatarUrl" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "companyName" TEXT,
    "companyTaxCode" TEXT,
    "personalTaxCode" TEXT,
    "bankAccount" TEXT,
    "bankName" TEXT,
    "skills" TEXT,
    "experience" TEXT,
    "certifications" TEXT,
    "hourlyRate" REAL,
    "dailyRate" REAL,
    "monthlyRate" REAL,
    "rateType" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "projects_projectNo_key" ON "projects"("projectNo");

-- CreateIndex
CREATE UNIQUE INDEX "projects_finalQuotationId_key" ON "projects"("finalQuotationId");

-- CreateIndex
CREATE INDEX "projects_customerId_idx" ON "projects"("customerId");

-- CreateIndex
CREATE INDEX "projects_createdById_idx" ON "projects"("createdById");

-- CreateIndex
CREATE INDEX "projects_status_idx" ON "projects"("status");

-- CreateIndex
CREATE INDEX "projects_projectNo_idx" ON "projects"("projectNo");

-- CreateIndex
CREATE INDEX "cash_flows_projectId_idx" ON "cash_flows"("projectId");

-- CreateIndex
CREATE INDEX "cash_flows_date_idx" ON "cash_flows"("date");

-- CreateIndex
CREATE INDEX "cash_flows_type_idx" ON "cash_flows"("type");

-- CreateIndex
CREATE UNIQUE INDEX "quotations_quotationNo_key" ON "quotations"("quotationNo");

-- CreateIndex
CREATE INDEX "quotations_projectId_idx" ON "quotations"("projectId");

-- CreateIndex
CREATE INDEX "quotations_customerId_idx" ON "quotations"("customerId");

-- CreateIndex
CREATE INDEX "quotations_createdById_idx" ON "quotations"("createdById");

-- CreateIndex
CREATE INDEX "quotations_status_idx" ON "quotations"("status");

-- CreateIndex
CREATE INDEX "quotations_quotationNo_idx" ON "quotations"("quotationNo");

-- CreateIndex
CREATE INDEX "quotation_lines_quotationId_idx" ON "quotation_lines"("quotationId");

-- CreateIndex
CREATE INDEX "payment_milestones_quotationId_idx" ON "payment_milestones"("quotationId");

-- CreateIndex
CREATE INDEX "quotation_revisions_quotationId_idx" ON "quotation_revisions"("quotationId");

-- CreateIndex
CREATE INDEX "quotation_revisions_revisionDate_idx" ON "quotation_revisions"("revisionDate");

-- CreateIndex
CREATE UNIQUE INDEX "quotation_revisions_quotationId_revisionNo_key" ON "quotation_revisions"("quotationId", "revisionNo");

-- CreateIndex
CREATE INDEX "catalog_items_category_idx" ON "catalog_items"("category");

-- CreateIndex
CREATE INDEX "catalog_items_group_idx" ON "catalog_items"("group");

-- CreateIndex
CREATE INDEX "outsourcing_staff_isActive_idx" ON "outsourcing_staff"("isActive");

-- CreateIndex
CREATE INDEX "outsourcing_staff_code_idx" ON "outsourcing_staff"("code");
