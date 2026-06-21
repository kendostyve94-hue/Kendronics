CREATE TABLE "ExplorerProjectView" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT,
    "actorKey" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExplorerProjectView_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ExplorerProjectView_projectId_actorKey_key"
ON "ExplorerProjectView"("projectId", "actorKey");

CREATE INDEX "ExplorerProjectView_projectId_idx"
ON "ExplorerProjectView"("projectId");

CREATE INDEX "ExplorerProjectView_userId_idx"
ON "ExplorerProjectView"("userId");

ALTER TABLE "ExplorerProjectView"
ADD CONSTRAINT "ExplorerProjectView_projectId_fkey"
FOREIGN KEY ("projectId") REFERENCES "ExplorerProject"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ExplorerProjectView"
ADD CONSTRAINT "ExplorerProjectView_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
