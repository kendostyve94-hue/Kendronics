CREATE TABLE "AdminAccess" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "professionalEmail" TEXT NOT NULL,
    "personalCodeHash" TEXT,
    "personalCodeExpiresAt" TIMESTAMP(3),
    "setupCodeHash" TEXT,
    "setupCodeExpiresAt" TIMESTAMP(3),
    "failedAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "lastVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminAccess_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AdminAccess_professionalEmail_key" ON "AdminAccess"("professionalEmail");
CREATE UNIQUE INDEX "AdminAccess_userId_professionalEmail_key" ON "AdminAccess"("userId", "professionalEmail");
CREATE INDEX "AdminAccess_userId_idx" ON "AdminAccess"("userId");
CREATE INDEX "AdminAccess_professionalEmail_idx" ON "AdminAccess"("professionalEmail");
CREATE INDEX "AdminAccess_personalCodeExpiresAt_idx" ON "AdminAccess"("personalCodeExpiresAt");

ALTER TABLE "AdminAccess" ADD CONSTRAINT "AdminAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

UPDATE "User"
SET "roles" = array_append("roles", 'admin')
WHERE "email" = 'kendostyve94@gmail.com'
  AND NOT ("roles" @> ARRAY['admin']::TEXT[]);
