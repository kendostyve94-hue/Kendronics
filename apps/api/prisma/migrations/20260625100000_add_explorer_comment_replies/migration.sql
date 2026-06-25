ALTER TABLE "ExplorerComment" ADD COLUMN "parentId" TEXT;

CREATE INDEX "ExplorerComment_parentId_idx" ON "ExplorerComment"("parentId");

ALTER TABLE "ExplorerComment"
  ADD CONSTRAINT "ExplorerComment_parentId_fkey"
  FOREIGN KEY ("parentId")
  REFERENCES "ExplorerComment"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;
