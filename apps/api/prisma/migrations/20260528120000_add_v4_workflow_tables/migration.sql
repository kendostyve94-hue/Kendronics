ALTER TABLE "Order"
ADD COLUMN "supplierReviewStatus" TEXT NOT NULL DEFAULT 'not_sent',
ADD COLUMN "reviewAttemptCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "maxReviewAttempts" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN "customerDecisionAfterRejection" TEXT,
ADD COLUMN "supplierFeedback" TEXT,
ADD COLUMN "currentFileVersion" INTEGER NOT NULL DEFAULT 1;

CREATE INDEX "Order_supplierReviewStatus_idx" ON "Order"("supplierReviewStatus");

CREATE TABLE "OrderFile" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "fileType" TEXT NOT NULL,
  "uploadId" TEXT,
  "fileUrl" TEXT,
  "fileVersion" INTEGER NOT NULL,
  "isCurrentVersion" BOOLEAN NOT NULL DEFAULT true,
  "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OrderFile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OrderFile_orderId_fileType_fileVersion_key" ON "OrderFile"("orderId", "fileType", "fileVersion");
CREATE INDEX "OrderFile_orderId_isCurrentVersion_idx" ON "OrderFile"("orderId", "isCurrentVersion");
CREATE INDEX "OrderFile_uploadId_idx" ON "OrderFile"("uploadId");

CREATE TABLE "TechnicalSpecFile" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "fileVersion" INTEGER NOT NULL,
  "storageKey" TEXT,
  "payload" JSONB NOT NULL,
  "isCurrentVersion" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TechnicalSpecFile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TechnicalSpecFile_orderId_fileVersion_key" ON "TechnicalSpecFile"("orderId", "fileVersion");
CREATE INDEX "TechnicalSpecFile_orderId_isCurrentVersion_idx" ON "TechnicalSpecFile"("orderId", "isCurrentVersion");

CREATE TABLE "SupplierReview" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "attemptNumber" INTEGER NOT NULL,
  "supplier" TEXT NOT NULL,
  "supplierStatus" TEXT NOT NULL,
  "supplierFeedback" TEXT,
  "externalReviewId" TEXT,
  "technicalPackageVersion" INTEGER NOT NULL,
  "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SupplierReview_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SupplierReview_orderId_attemptNumber_supplier_externalReviewId_key" ON "SupplierReview"("orderId", "attemptNumber", "supplier", "externalReviewId");
CREATE INDEX "SupplierReview_orderId_attemptNumber_idx" ON "SupplierReview"("orderId", "attemptNumber");
CREATE INDEX "SupplierReview_supplierStatus_idx" ON "SupplierReview"("supplierStatus");

CREATE TABLE "FinanceRecord" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "amount" DECIMAL(12,2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'EUR',
  "status" TEXT NOT NULL DEFAULT 'recorded',
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FinanceRecord_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "FinanceRecord_orderId_idx" ON "FinanceRecord"("orderId");
CREATE INDEX "FinanceRecord_type_idx" ON "FinanceRecord"("type");

CREATE TABLE "Invoice" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "invoiceNumber" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'issued',
  "pdfUrl" TEXT,
  "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "sentAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");
CREATE INDEX "Invoice_orderId_idx" ON "Invoice"("orderId");

CREATE TABLE "ProductionJob" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "internalReference" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'created',
  "startedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProductionJob_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProductionJob_internalReference_key" ON "ProductionJob"("internalReference");
CREATE INDEX "ProductionJob_orderId_idx" ON "ProductionJob"("orderId");
CREATE INDEX "ProductionJob_status_idx" ON "ProductionJob"("status");

CREATE TABLE "InternationalShipment" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "carrierName" TEXT,
  "trackingNumber" TEXT,
  "cost" DECIMAL(12,2),
  "currency" TEXT NOT NULL DEFAULT 'EUR',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InternationalShipment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "InternationalShipment_orderId_idx" ON "InternationalShipment"("orderId");
CREATE INDEX "InternationalShipment_status_idx" ON "InternationalShipment"("status");

CREATE TABLE "LocalShipment" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "carrierName" TEXT,
  "trackingNumber" TEXT,
  "cost" DECIMAL(12,2),
  "currency" TEXT NOT NULL DEFAULT 'EUR',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "LocalShipment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "LocalShipment_orderId_idx" ON "LocalShipment"("orderId");
CREATE INDEX "LocalShipment_status_idx" ON "LocalShipment"("status");

CREATE TABLE "MondaySyncLog" (
  "id" TEXT NOT NULL,
  "orderId" TEXT,
  "board" TEXT NOT NULL,
  "itemId" TEXT,
  "operation" TEXT NOT NULL,
  "sourceEventId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "payload" JSONB,
  "processedAt" TIMESTAMP(3),
  "error" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MondaySyncLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MondaySyncLog_board_operation_sourceEventId_key" ON "MondaySyncLog"("board", "operation", "sourceEventId");
CREATE INDEX "MondaySyncLog_orderId_idx" ON "MondaySyncLog"("orderId");
CREATE INDEX "MondaySyncLog_status_idx" ON "MondaySyncLog"("status");

ALTER TABLE "OrderFile" ADD CONSTRAINT "OrderFile_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TechnicalSpecFile" ADD CONSTRAINT "TechnicalSpecFile_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SupplierReview" ADD CONSTRAINT "SupplierReview_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FinanceRecord" ADD CONSTRAINT "FinanceRecord_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductionJob" ADD CONSTRAINT "ProductionJob_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InternationalShipment" ADD CONSTRAINT "InternationalShipment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LocalShipment" ADD CONSTRAINT "LocalShipment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MondaySyncLog" ADD CONSTRAINT "MondaySyncLog_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
