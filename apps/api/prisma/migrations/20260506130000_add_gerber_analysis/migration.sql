CREATE TABLE "GerberUpload" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "originalFilename" TEXT NOT NULL,
  "sanitizedFilename" TEXT NOT NULL,
  "storageKey" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "fileSizeBytes" INTEGER NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'uploaded',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "GerberUpload_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GerberAnalysis" (
  "id" TEXT NOT NULL,
  "uploadId" TEXT NOT NULL,
  "widthMm" DECIMAL(10, 2),
  "heightMm" DECIMAL(10, 2),
  "detectedLayers" INTEGER,
  "holesCount" INTEGER NOT NULL DEFAULT 0,
  "hasSlots" BOOLEAN NOT NULL DEFAULT false,
  "boardAreaCm2" DECIMAL(12, 2),
  "complexity" TEXT NOT NULL DEFAULT 'unknown',
  "parserConfidence" DECIMAL(5, 4) NOT NULL DEFAULT 0,
  "units" TEXT,
  "outlineSource" TEXT,
  "copperLayerFiles" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "drillFiles" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "warnings" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "rawSummary" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "GerberAnalysis_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "GerberUpload_userId_idx" ON "GerberUpload"("userId");
CREATE INDEX "GerberUpload_storageKey_idx" ON "GerberUpload"("storageKey");
CREATE UNIQUE INDEX "GerberAnalysis_uploadId_key" ON "GerberAnalysis"("uploadId");
CREATE INDEX "GerberAnalysis_complexity_idx" ON "GerberAnalysis"("complexity");

ALTER TABLE "GerberUpload" ADD CONSTRAINT "GerberUpload_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GerberAnalysis" ADD CONSTRAINT "GerberAnalysis_uploadId_fkey" FOREIGN KEY ("uploadId") REFERENCES "GerberUpload"("id") ON DELETE CASCADE ON UPDATE CASCADE;
