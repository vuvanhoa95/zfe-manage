-- AlterTable
ALTER TABLE "payment_milestones" ADD COLUMN "expectedDate" DATETIME;

-- CreateIndex
CREATE INDEX "payment_milestones_expectedDate_idx" ON "payment_milestones"("expectedDate");

