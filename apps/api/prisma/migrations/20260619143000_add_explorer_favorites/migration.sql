CREATE TABLE "ExplorerProjectFavorite" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExplorerProjectFavorite_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ExplorerProjectFavorite_projectId_userId_key"
ON "ExplorerProjectFavorite"("projectId", "userId");

CREATE INDEX "ExplorerProjectFavorite_projectId_idx"
ON "ExplorerProjectFavorite"("projectId");

CREATE INDEX "ExplorerProjectFavorite_userId_idx"
ON "ExplorerProjectFavorite"("userId");

ALTER TABLE "ExplorerProjectFavorite"
ADD CONSTRAINT "ExplorerProjectFavorite_projectId_fkey"
FOREIGN KEY ("projectId") REFERENCES "ExplorerProject"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ExplorerProjectFavorite"
ADD CONSTRAINT "ExplorerProjectFavorite_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
