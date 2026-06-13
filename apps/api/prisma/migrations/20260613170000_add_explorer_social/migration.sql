CREATE TABLE "ExplorerProject" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "authorName" TEXT NOT NULL,
    "authorAvatarUrl" TEXT,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "description" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "imageUrl" TEXT,
    "attachmentName" TEXT,
    "attachmentType" TEXT,
    "repositoryUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'published',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "viewsCount" INTEGER NOT NULL DEFAULT 0,
    "likesCount" INTEGER NOT NULL DEFAULT 0,
    "commentsCount" INTEGER NOT NULL DEFAULT 0,
    "forksCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExplorerProject_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExplorerProjectLike" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "actorKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExplorerProjectLike_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExplorerComment" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT,
    "authorName" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'visible',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExplorerComment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ExplorerProject_userId_idx" ON "ExplorerProject"("userId");
CREATE INDEX "ExplorerProject_status_idx" ON "ExplorerProject"("status");
CREATE INDEX "ExplorerProject_featured_idx" ON "ExplorerProject"("featured");
CREATE INDEX "ExplorerProject_category_idx" ON "ExplorerProject"("category");
CREATE INDEX "ExplorerProject_createdAt_idx" ON "ExplorerProject"("createdAt");
CREATE INDEX "ExplorerProject_likesCount_idx" ON "ExplorerProject"("likesCount");
CREATE INDEX "ExplorerProjectLike_projectId_idx" ON "ExplorerProjectLike"("projectId");
CREATE UNIQUE INDEX "ExplorerProjectLike_projectId_actorKey_key" ON "ExplorerProjectLike"("projectId", "actorKey");
CREATE INDEX "ExplorerComment_projectId_idx" ON "ExplorerComment"("projectId");
CREATE INDEX "ExplorerComment_userId_idx" ON "ExplorerComment"("userId");
CREATE INDEX "ExplorerComment_status_idx" ON "ExplorerComment"("status");
CREATE INDEX "ExplorerComment_createdAt_idx" ON "ExplorerComment"("createdAt");

ALTER TABLE "ExplorerProject" ADD CONSTRAINT "ExplorerProject_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ExplorerProjectLike" ADD CONSTRAINT "ExplorerProjectLike_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ExplorerProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExplorerComment" ADD CONSTRAINT "ExplorerComment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ExplorerProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExplorerComment" ADD CONSTRAINT "ExplorerComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
