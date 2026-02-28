-- Create quotation_templates table
CREATE TABLE "quotation_templates" (
    "id"              UUID         NOT NULL DEFAULT gen_random_uuid(),
    "name"            TEXT         NOT NULL,
    "code"            TEXT,
    "description"     TEXT,
    "category"        TEXT,
    "isActive"        BOOLEAN      NOT NULL DEFAULT TRUE,
    "title"           TEXT         NOT NULL DEFAULT 'BÁO GIÁ DỊCH VỤ MÔ HÌNH BIM',
    "introText"       TEXT,
    "scopeText"       TEXT,
    "deliverablesText" TEXT        NOT NULL DEFAULT '',
    "scheduleText"    TEXT,
    "vatRate"         DOUBLE PRECISION NOT NULL DEFAULT 0.08,
    "theme"           TEXT,
    "layoutTemplate"  TEXT,
    "createdById"     TEXT         NOT NULL,
    "createdAt"       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    "updatedAt"       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT "quotation_templates_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "quotation_templates_code_key" UNIQUE ("code"),
    CONSTRAINT "quotation_templates_createdById_fkey"
        FOREIGN KEY ("createdById") REFERENCES "users"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "quotation_templates_category_idx" ON "quotation_templates"("category");
CREATE INDEX "quotation_templates_createdById_idx" ON "quotation_templates"("createdById");
CREATE INDEX "quotation_templates_isActive_idx" ON "quotation_templates"("isActive");

-- Create quotation_template_lines table
CREATE TABLE "quotation_template_lines" (
    "id"            UUID         NOT NULL DEFAULT gen_random_uuid(),
    "templateId"    UUID         NOT NULL,
    "section"       TEXT,
    "itemNo"        TEXT,
    "title"         TEXT         NOT NULL,
    "qty"           DOUBLE PRECISION,
    "unit"          TEXT,
    "unitPrice"     DOUBLE PRECISION,
    "total"         DOUBLE PRECISION NOT NULL DEFAULT 0,
    "note"          TEXT,
    "order"         INTEGER      NOT NULL,
    "isGroupHeader" BOOLEAN      NOT NULL DEFAULT FALSE,
    "isChargeable"  BOOLEAN      NOT NULL DEFAULT TRUE,
    "createdAt"     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    "updatedAt"     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT "quotation_template_lines_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "quotation_template_lines_templateId_fkey"
        FOREIGN KEY ("templateId") REFERENCES "quotation_templates"("id")
        ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "quotation_template_lines_templateId_idx"
    ON "quotation_template_lines"("templateId");

-- Create quotation_template_payment_milestones table
CREATE TABLE "quotation_template_payment_milestones" (
    "id"           UUID         NOT NULL DEFAULT gen_random_uuid(),
    "templateId"   UUID         NOT NULL,
    "no"           INTEGER      NOT NULL,
    "title"        TEXT         NOT NULL,
    "percent"      DOUBLE PRECISION NOT NULL,
    "description"  TEXT,
    "expectedDate" TIMESTAMPTZ,
    "order"        INTEGER      NOT NULL,
    "createdAt"    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    "updatedAt"    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT "quotation_template_payment_milestones_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "quotation_template_payment_milestones_templateId_fkey"
        FOREIGN KEY ("templateId") REFERENCES "quotation_templates"("id")
        ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "quotation_template_payment_milestones_templateId_idx"
    ON "quotation_template_payment_milestones"("templateId");

