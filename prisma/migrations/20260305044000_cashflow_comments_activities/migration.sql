-- CreateTable
CREATE TABLE "cash_flow_comments" (
    "id" TEXT NOT NULL,
    "cashFlowId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cash_flow_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cash_flow_activities" (
    "id" TEXT NOT NULL,
    "cashFlowId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "field" TEXT,
    "oldValue" TEXT,
    "newValue" TEXT,
    "summary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cash_flow_activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cash_flow_comments_cashFlowId_idx" ON "cash_flow_comments"("cashFlowId");

-- CreateIndex
CREATE INDEX "cash_flow_activities_cashFlowId_idx" ON "cash_flow_activities"("cashFlowId");

-- CreateIndex
CREATE INDEX "cash_flow_activities_createdAt_idx" ON "cash_flow_activities"("createdAt");

-- AddForeignKey
ALTER TABLE "cash_flow_comments" ADD CONSTRAINT "cash_flow_comments_cashFlowId_fkey" FOREIGN KEY ("cashFlowId") REFERENCES "cash_flows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_flow_comments" ADD CONSTRAINT "cash_flow_comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_flow_activities" ADD CONSTRAINT "cash_flow_activities_cashFlowId_fkey" FOREIGN KEY ("cashFlowId") REFERENCES "cash_flows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_flow_activities" ADD CONSTRAINT "cash_flow_activities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
