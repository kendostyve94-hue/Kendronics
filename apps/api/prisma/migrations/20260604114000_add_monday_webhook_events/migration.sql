CREATE TABLE "MondayWebhookEvent" (
    "id" TEXT NOT NULL,
    "providerEventId" TEXT NOT NULL,
    "board" TEXT,
    "boardId" TEXT,
    "itemId" TEXT,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "processedAt" TIMESTAMP(3),
    "processingError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MondayWebhookEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MondayWebhookEvent_providerEventId_key" ON "MondayWebhookEvent"("providerEventId");
CREATE INDEX "MondayWebhookEvent_board_idx" ON "MondayWebhookEvent"("board");
CREATE INDEX "MondayWebhookEvent_boardId_idx" ON "MondayWebhookEvent"("boardId");
CREATE INDEX "MondayWebhookEvent_itemId_idx" ON "MondayWebhookEvent"("itemId");
CREATE INDEX "MondayWebhookEvent_eventType_idx" ON "MondayWebhookEvent"("eventType");
CREATE INDEX "MondayWebhookEvent_processedAt_idx" ON "MondayWebhookEvent"("processedAt");
