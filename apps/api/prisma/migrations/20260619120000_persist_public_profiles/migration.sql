ALTER TABLE "User"
ADD COLUMN "promoCode" TEXT,
ADD COLUMN "publicDescription" TEXT;

CREATE UNIQUE INDEX "User_promoCode_key" ON "User"("promoCode");

ALTER TABLE "ExplorerProjectLike"
ADD COLUMN "userId" TEXT;

CREATE INDEX "ExplorerProjectLike_userId_idx" ON "ExplorerProjectLike"("userId");

ALTER TABLE "ExplorerProjectLike"
ADD CONSTRAINT "ExplorerProjectLike_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "UserFollow" (
    "id" TEXT NOT NULL,
    "followerId" TEXT NOT NULL,
    "followingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserFollow_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserFollow_followerId_followingId_key" ON "UserFollow"("followerId", "followingId");
CREATE INDEX "UserFollow_followerId_idx" ON "UserFollow"("followerId");
CREATE INDEX "UserFollow_followingId_idx" ON "UserFollow"("followingId");

ALTER TABLE "UserFollow"
ADD CONSTRAINT "UserFollow_followerId_fkey"
FOREIGN KEY ("followerId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserFollow"
ADD CONSTRAINT "UserFollow_followingId_fkey"
FOREIGN KEY ("followingId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
