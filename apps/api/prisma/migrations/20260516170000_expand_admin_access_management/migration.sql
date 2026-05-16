ALTER TABLE "AdminAuditLog" ADD COLUMN "ipAddress" TEXT;
ALTER TABLE "AdminAuditLog" ADD COLUMN "metadata" JSONB;

ALTER TABLE "AdminAccess" ADD COLUMN "accessRoles" TEXT[] NOT NULL DEFAULT ARRAY['admin']::TEXT[];
ALTER TABLE "AdminAccess" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "AdminAccess" ADD COLUMN "lastFailedAt" TIMESTAMP(3);

CREATE INDEX "AdminAccess_isActive_idx" ON "AdminAccess"("isActive");
CREATE INDEX "AdminAccess_lockedUntil_idx" ON "AdminAccess"("lockedUntil");
