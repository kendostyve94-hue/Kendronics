CREATE TABLE "PricingSnapshot" (
  "id" TEXT NOT NULL,
  "quoteId" TEXT NOT NULL,
  "supplier" TEXT NOT NULL DEFAULT 'jlcpcb',
  "supplierEstimatedPrice" DECIMAL(12, 2) NOT NULL,
  "supplierRealPrice" DECIMAL(12, 2),
  "bufferUsed" DECIMAL(6, 4) NOT NULL,
  "serviceFee" DECIMAL(12, 2) NOT NULL,
  "pcbClientPrice" DECIMAL(12, 2) NOT NULL,
  "shippingPrice" DECIMAL(12, 2) NOT NULL DEFAULT 0,
  "totalClientPrice" DECIMAL(12, 2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'EUR',
  "bucketKey" TEXT NOT NULL,
  "riskScore" DECIMAL(6, 4) NOT NULL,
  "confidence" TEXT NOT NULL,
  "formulaVersion" TEXT NOT NULL DEFAULT 'smart-buffer-v1',
  "reasons" JSONB NOT NULL,
  "inputSnapshot" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "PricingSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BufferBucket" (
  "id" TEXT NOT NULL,
  "bucketKey" TEXT NOT NULL,
  "layersRange" TEXT NOT NULL,
  "priceRange" TEXT NOT NULL,
  "finish" TEXT NOT NULL,
  "complexity" TEXT NOT NULL,
  "quantityRange" TEXT NOT NULL,
  "currentBuffer" DECIMAL(6, 4) NOT NULL,
  "minBuffer" DECIMAL(6, 4) NOT NULL DEFAULT 1.0800,
  "maxBuffer" DECIMAL(6, 4) NOT NULL DEFAULT 1.7000,
  "averageErrorRate" DECIMAL(8, 6) NOT NULL DEFAULT 0,
  "sampleCount" INTEGER NOT NULL DEFAULT 0,
  "confidence" TEXT NOT NULL DEFAULT 'low',
  "riskFlag" BOOLEAN NOT NULL DEFAULT false,
  "lastErrorRate" DECIMAL(8, 6),
  "lastAdjustedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "BufferBucket_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BufferAdjustment" (
  "id" TEXT NOT NULL,
  "bucketId" TEXT NOT NULL,
  "pricingSnapshotId" TEXT,
  "quoteId" TEXT,
  "previousBuffer" DECIMAL(6, 4) NOT NULL,
  "nextBuffer" DECIMAL(6, 4) NOT NULL,
  "errorRate" DECIMAL(8, 6) NOT NULL,
  "direction" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "BufferAdjustment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PricingSnapshot_quoteId_key" ON "PricingSnapshot"("quoteId");
CREATE INDEX "PricingSnapshot_bucketKey_idx" ON "PricingSnapshot"("bucketKey");
CREATE INDEX "PricingSnapshot_supplier_idx" ON "PricingSnapshot"("supplier");
CREATE UNIQUE INDEX "BufferBucket_bucketKey_key" ON "BufferBucket"("bucketKey");
CREATE INDEX "BufferAdjustment_bucketId_idx" ON "BufferAdjustment"("bucketId");
CREATE INDEX "BufferAdjustment_pricingSnapshotId_idx" ON "BufferAdjustment"("pricingSnapshotId");
CREATE INDEX "BufferAdjustment_quoteId_idx" ON "BufferAdjustment"("quoteId");

ALTER TABLE "PricingSnapshot" ADD CONSTRAINT "PricingSnapshot_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BufferAdjustment" ADD CONSTRAINT "BufferAdjustment_bucketId_fkey" FOREIGN KEY ("bucketId") REFERENCES "BufferBucket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BufferAdjustment" ADD CONSTRAINT "BufferAdjustment_pricingSnapshotId_fkey" FOREIGN KEY ("pricingSnapshotId") REFERENCES "PricingSnapshot"("id") ON DELETE SET NULL ON UPDATE CASCADE;
