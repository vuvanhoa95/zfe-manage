-- AlterTable: Add mentions to CashFlowComment
ALTER TABLE "cash_flow_comments" ADD COLUMN "mentions" TEXT;

-- CreateTable
CREATE TABLE "cash_flow_comment_attachments" (
    "id" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cash_flow_comment_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cash_flow_comment_attachments_commentId_idx" ON "cash_flow_comment_attachments"("commentId");

-- AddForeignKey
ALTER TABLE "cash_flow_comment_attachments" ADD CONSTRAINT "cash_flow_comment_attachments_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "cash_flow_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
