ALTER TABLE "User"
ADD COLUMN "phoneVerifiedAt" TIMESTAMP(3),
ADD COLUMN "accountType" TEXT NOT NULL DEFAULT 'individual',
ADD COLUMN "verificationLevel" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "verificationStatus" TEXT NOT NULL DEFAULT 'unverified',
ADD COLUMN "riskScore" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "cguAcceptedAt" TIMESTAMP(3);

ALTER TABLE "Session"
ADD COLUMN "ipAddress" TEXT,
ADD COLUMN "userAgent" TEXT,
ADD COLUMN "deviceFingerprint" TEXT;

CREATE TABLE "EmailVerification" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "verifiedAt" TIMESTAMP(3),
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EmailVerification_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "EmailVerification_userId_idx" ON "EmailVerification"("userId");
CREATE INDEX "EmailVerification_tokenHash_idx" ON "EmailVerification"("tokenHash");
CREATE INDEX "EmailVerification_expiresAt_idx" ON "EmailVerification"("expiresAt");

CREATE TABLE "PhoneVerification" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "providerVerificationSid" TEXT,
  "codeHash" TEXT,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "expiresAt" TIMESTAMP(3),
  "verifiedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PhoneVerification_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "PhoneVerification_userId_idx" ON "PhoneVerification"("userId");
CREATE INDEX "PhoneVerification_phone_idx" ON "PhoneVerification"("phone");
CREATE INDEX "PhoneVerification_status_idx" ON "PhoneVerification"("status");

CREATE TABLE "IdentityVerification" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "providerSessionId" TEXT,
  "providerClientReferenceId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "documentType" TEXT,
  "country" TEXT,
  "verifiedName" TEXT,
  "verifiedBirthDate" TIMESTAMP(3),
  "mismatchReason" TEXT,
  "rawProviderResultJson" JSONB,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  CONSTRAINT "IdentityVerification_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "IdentityVerification_userId_idx" ON "IdentityVerification"("userId");
CREATE INDEX "IdentityVerification_providerSessionId_idx" ON "IdentityVerification"("providerSessionId");
CREATE INDEX "IdentityVerification_status_idx" ON "IdentityVerification"("status");

CREATE TABLE "BusinessVerification" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "companyName" TEXT NOT NULL,
  "registrationNumber" TEXT,
  "taxId" TEXT,
  "companyAddressId" TEXT,
  "businessEmail" TEXT,
  "website" TEXT,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "reviewedBy" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "rejectionReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BusinessVerification_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "BusinessVerification_userId_idx" ON "BusinessVerification"("userId");
CREATE INDEX "BusinessVerification_status_idx" ON "BusinessVerification"("status");

CREATE TABLE "VerificationDocument" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "verificationType" TEXT NOT NULL,
  "fileUrl" TEXT NOT NULL,
  "fileType" TEXT NOT NULL,
  "storageProvider" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'uploaded',
  "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "VerificationDocument_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "VerificationDocument_userId_idx" ON "VerificationDocument"("userId");
CREATE INDEX "VerificationDocument_verificationType_idx" ON "VerificationDocument"("verificationType");

CREATE TABLE "MfaFactor" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "provider" TEXT,
  "secretEncrypted" TEXT,
  "verifiedAt" TIMESTAMP(3),
  "lastUsedAt" TIMESTAMP(3),
  "enabled" BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "MfaFactor_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "MfaFactor_userId_idx" ON "MfaFactor"("userId");
CREATE INDEX "MfaFactor_enabled_idx" ON "MfaFactor"("enabled");

CREATE TABLE "RiskEvent" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "riskScoreDelta" INTEGER NOT NULL,
  "metadataJson" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RiskEvent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "RiskEvent_userId_idx" ON "RiskEvent"("userId");
CREATE INDEX "RiskEvent_eventType_idx" ON "RiskEvent"("eventType");

CREATE TABLE "UserAuditLog" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "actorId" TEXT,
  "eventType" TEXT NOT NULL,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "metadataJson" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserAuditLog_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "UserAuditLog_userId_idx" ON "UserAuditLog"("userId");
CREATE INDEX "UserAuditLog_actorId_idx" ON "UserAuditLog"("actorId");
CREATE INDEX "UserAuditLog_eventType_idx" ON "UserAuditLog"("eventType");

CREATE TABLE "NotificationPreference" (
  "userId" TEXT NOT NULL,
  "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
  "pushEnabled" BOOLEAN NOT NULL DEFAULT true,
  "smsEnabled" BOOLEAN NOT NULL DEFAULT false,
  "whatsappEnabled" BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("userId")
);

CREATE TABLE "PushSubscription" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "provider" TEXT NOT NULL DEFAULT 'onesignal',
  "externalId" TEXT NOT NULL,
  "subscriptionId" TEXT NOT NULL,
  "deviceType" TEXT,
  "optedIn" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PushSubscription_provider_subscriptionId_key" ON "PushSubscription"("provider", "subscriptionId");
CREATE INDEX "PushSubscription_userId_idx" ON "PushSubscription"("userId");

ALTER TABLE "EmailVerification" ADD CONSTRAINT "EmailVerification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PhoneVerification" ADD CONSTRAINT "PhoneVerification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "IdentityVerification" ADD CONSTRAINT "IdentityVerification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BusinessVerification" ADD CONSTRAINT "BusinessVerification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VerificationDocument" ADD CONSTRAINT "VerificationDocument_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MfaFactor" ADD CONSTRAINT "MfaFactor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RiskEvent" ADD CONSTRAINT "RiskEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserAuditLog" ADD CONSTRAINT "UserAuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "UserAuditLog" ADD CONSTRAINT "UserAuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "NotificationPreference" ADD CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
