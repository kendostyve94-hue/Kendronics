ALTER TABLE "Payment"
ADD COLUMN "providerIntentId" TEXT,
ADD COLUMN "authorizedAt" TIMESTAMP(3),
ADD COLUMN "captureBefore" TIMESTAMP(3),
ADD COLUMN "canceledAt" TIMESTAMP(3);

CREATE INDEX "Payment_providerIntentId_idx" ON "Payment"("providerIntentId");
