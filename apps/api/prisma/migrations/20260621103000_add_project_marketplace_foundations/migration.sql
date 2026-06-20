CREATE TABLE "ProjectPurchase" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "buyerId" TEXT NOT NULL,
  "sellerId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "amountCents" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'EUR',
  "provider" TEXT,
  "providerSessionId" TEXT,
  "providerPaymentId" TEXT,
  "priceSnapshot" JSONB NOT NULL,
  "paidAt" TIMESTAMP(3),
  "canceledAt" TIMESTAMP(3),
  "refundedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProjectPurchase_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProjectLicenseGrant" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "purchaseId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'active',
  "licenseCode" TEXT NOT NULL,
  "allowedUses" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "source" TEXT NOT NULL DEFAULT 'purchase',
  "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "revokedAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProjectLicenseGrant_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProjectLicenseGrant_purchaseId_key" ON "ProjectLicenseGrant"("purchaseId");
CREATE UNIQUE INDEX "ProjectLicenseGrant_projectId_userId_key" ON "ProjectLicenseGrant"("projectId", "userId");

CREATE INDEX "ProjectPurchase_projectId_idx" ON "ProjectPurchase"("projectId");
CREATE INDEX "ProjectPurchase_buyerId_idx" ON "ProjectPurchase"("buyerId");
CREATE INDEX "ProjectPurchase_sellerId_idx" ON "ProjectPurchase"("sellerId");
CREATE INDEX "ProjectPurchase_status_idx" ON "ProjectPurchase"("status");
CREATE INDEX "ProjectPurchase_providerSessionId_idx" ON "ProjectPurchase"("providerSessionId");
CREATE INDEX "ProjectPurchase_providerPaymentId_idx" ON "ProjectPurchase"("providerPaymentId");
CREATE INDEX "ProjectPurchase_createdAt_idx" ON "ProjectPurchase"("createdAt");

CREATE INDEX "ProjectLicenseGrant_projectId_idx" ON "ProjectLicenseGrant"("projectId");
CREATE INDEX "ProjectLicenseGrant_userId_idx" ON "ProjectLicenseGrant"("userId");
CREATE INDEX "ProjectLicenseGrant_status_idx" ON "ProjectLicenseGrant"("status");
CREATE INDEX "ProjectLicenseGrant_grantedAt_idx" ON "ProjectLicenseGrant"("grantedAt");

ALTER TABLE "ProjectPurchase"
ADD CONSTRAINT "ProjectPurchase_projectId_fkey"
FOREIGN KEY ("projectId") REFERENCES "ExplorerProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProjectPurchase"
ADD CONSTRAINT "ProjectPurchase_buyerId_fkey"
FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProjectPurchase"
ADD CONSTRAINT "ProjectPurchase_sellerId_fkey"
FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ProjectLicenseGrant"
ADD CONSTRAINT "ProjectLicenseGrant_projectId_fkey"
FOREIGN KEY ("projectId") REFERENCES "ExplorerProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProjectLicenseGrant"
ADD CONSTRAINT "ProjectLicenseGrant_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProjectLicenseGrant"
ADD CONSTRAINT "ProjectLicenseGrant_purchaseId_fkey"
FOREIGN KEY ("purchaseId") REFERENCES "ProjectPurchase"("id") ON DELETE SET NULL ON UPDATE CASCADE;
