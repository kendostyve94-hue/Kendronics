-- CreateTable
CREATE TABLE "ProfileVerificationCode" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfileVerificationCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProfileVerificationCode_userId_action_key" ON "ProfileVerificationCode"("userId", "action");

-- CreateIndex
CREATE INDEX "ProfileVerificationCode_expiresAt_idx" ON "ProfileVerificationCode"("expiresAt");

-- AddForeignKey
ALTER TABLE "ProfileVerificationCode" ADD CONSTRAINT "ProfileVerificationCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
