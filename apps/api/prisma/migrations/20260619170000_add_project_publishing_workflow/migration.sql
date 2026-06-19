ALTER TABLE "ExplorerProject"
ADD COLUMN "projectType" TEXT NOT NULL DEFAULT 'free',
ADD COLUMN "priceCents" INTEGER,
ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'EUR',
ADD COLUMN "licenseCode" TEXT NOT NULL DEFAULT 'CC-BY-SA-4.0',
ADD COLUMN "allowedUses" TEXT[] NOT NULL DEFAULT ARRAY['download', 'modify', 'manufacture', 'republish']::TEXT[],
ADD COLUMN "visibility" TEXT NOT NULL DEFAULT 'public',
ADD COLUMN "technicalDetails" JSONB,
ADD COLUMN "documentation" JSONB,
ADD COLUMN "publishedAt" TIMESTAMP(3);

ALTER TABLE "ExplorerProject" ALTER COLUMN "status" SET DEFAULT 'draft';

UPDATE "ExplorerProject"
SET "projectType" = 'free',
    "publishedAt" = COALESCE("publishedAt", "createdAt")
WHERE "status" = 'published';

CREATE TABLE "ExplorerProjectAsset" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "uploadId" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "visibility" TEXT NOT NULL DEFAULT 'protected',
  "originalName" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "sizeBytes" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ExplorerProjectAsset_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ExplorerProjectAsset_projectId_uploadId_key" ON "ExplorerProjectAsset"("projectId", "uploadId");
CREATE INDEX "ExplorerProjectAsset_projectId_idx" ON "ExplorerProjectAsset"("projectId");
CREATE INDEX "ExplorerProjectAsset_userId_idx" ON "ExplorerProjectAsset"("userId");
CREATE INDEX "ExplorerProjectAsset_uploadId_idx" ON "ExplorerProjectAsset"("uploadId");
CREATE INDEX "ExplorerProjectAsset_visibility_idx" ON "ExplorerProjectAsset"("visibility");
CREATE INDEX "ExplorerProject_projectType_idx" ON "ExplorerProject"("projectType");

ALTER TABLE "ExplorerProjectAsset"
ADD CONSTRAINT "ExplorerProjectAsset_projectId_fkey"
FOREIGN KEY ("projectId") REFERENCES "ExplorerProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ExplorerProjectAsset"
ADD CONSTRAINT "ExplorerProjectAsset_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ExplorerProjectAsset"
ADD CONSTRAINT "ExplorerProjectAsset_uploadId_fkey"
FOREIGN KEY ("uploadId") REFERENCES "GerberUpload"("id") ON DELETE CASCADE ON UPDATE CASCADE;
