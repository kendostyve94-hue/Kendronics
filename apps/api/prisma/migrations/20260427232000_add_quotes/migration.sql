CREATE TABLE "Quote" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "productType" TEXT NOT NULL,
  "gerberFileId" TEXT NOT NULL,
  "bomFileId" TEXT,
  "cplFileId" TEXT,
  "layers" INTEGER NOT NULL,
  "lengthMm" DECIMAL(10, 2) NOT NULL,
  "widthMm" DECIMAL(10, 2) NOT NULL,
  "quantity" INTEGER NOT NULL,
  "destinationCountryIso2" TEXT NOT NULL,
  "shippingMode" TEXT NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'EUR',
  "finalTotal" DECIMAL(12, 2) NOT NULL,
  "breakdown" JSONB NOT NULL,
  "validUntil" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Quote_userId_idx" ON "Quote"("userId");
CREATE INDEX "Quote_validUntil_idx" ON "Quote"("validUntil");

ALTER TABLE "Quote" ADD CONSTRAINT "Quote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
