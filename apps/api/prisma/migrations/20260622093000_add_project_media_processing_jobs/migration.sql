CREATE TABLE "ProjectMediaProcessingJob" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "jobType" TEXT NOT NULL DEFAULT 'video_16x9',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "lockedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectMediaProcessingJob_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProjectMediaProcessingJob_assetId_jobType_key" ON "ProjectMediaProcessingJob"("assetId", "jobType");
CREATE INDEX "ProjectMediaProcessingJob_status_createdAt_idx" ON "ProjectMediaProcessingJob"("status", "createdAt");
CREATE INDEX "ProjectMediaProcessingJob_projectId_idx" ON "ProjectMediaProcessingJob"("projectId");
CREATE INDEX "ProjectMediaProcessingJob_userId_idx" ON "ProjectMediaProcessingJob"("userId");

ALTER TABLE "ProjectMediaProcessingJob" ADD CONSTRAINT "ProjectMediaProcessingJob_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ExplorerProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProjectMediaProcessingJob" ADD CONSTRAINT "ProjectMediaProcessingJob_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "ExplorerProjectAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProjectMediaProcessingJob" ADD CONSTRAINT "ProjectMediaProcessingJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
