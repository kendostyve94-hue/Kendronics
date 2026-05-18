-- CreateTable
CREATE TABLE "AccountDeletionFeedback" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "emailHash" TEXT,
    "reason" TEXT NOT NULL,
    "details" JSONB,
    "orderedBefore" TEXT,
    "improvementPriority" TEXT,
    "keepReason" TEXT,
    "alternative" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountDeletionFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AccountDeletionFeedback_userId_idx" ON "AccountDeletionFeedback"("userId");

-- CreateIndex
CREATE INDEX "AccountDeletionFeedback_reason_idx" ON "AccountDeletionFeedback"("reason");

-- CreateIndex
CREATE INDEX "AccountDeletionFeedback_alternative_idx" ON "AccountDeletionFeedback"("alternative");

-- CreateIndex
CREATE INDEX "AccountDeletionFeedback_createdAt_idx" ON "AccountDeletionFeedback"("createdAt");

-- AddForeignKey
ALTER TABLE "AccountDeletionFeedback" ADD CONSTRAINT "AccountDeletionFeedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
