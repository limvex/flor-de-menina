-- AlterEnum
ALTER TYPE "PaymentStatus" ADD VALUE 'IN_PROCESS';

-- DropIndex
DROP INDEX IF EXISTS "Payment_transactionId_key";

-- AlterTable
ALTER TABLE "Payment"
  ADD COLUMN IF NOT EXISTS "externalId"      TEXT,
  ADD COLUMN IF NOT EXISTS "pixQrCode"       TEXT,
  ADD COLUMN IF NOT EXISTS "pixQrCodeBase64" TEXT,
  ADD COLUMN IF NOT EXISTS "pixExpiresAt"    TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "cardLast4"       TEXT,
  ADD COLUMN IF NOT EXISTS "cardBrand"       TEXT,
  ADD COLUMN IF NOT EXISTS "cardHolderName"  TEXT,
  ADD COLUMN IF NOT EXISTS "failureReason"   TEXT,
  ADD COLUMN IF NOT EXISTS "metadata"        JSONB;

-- Migrate existing data: qrCode -> pixQrCode, qrCodeBase64 -> pixQrCodeBase64
UPDATE "Payment" SET
  "pixQrCode"       = "qrCode",
  "pixQrCodeBase64" = "qrCodeBase64",
  "externalId"      = "transactionId"
WHERE "pixQrCode" IS NULL AND "qrCode" IS NOT NULL;

-- DropColumn (old fields)
ALTER TABLE "Payment"
  DROP COLUMN IF EXISTS "qrCode",
  DROP COLUMN IF EXISTS "qrCodeBase64",
  DROP COLUMN IF EXISTS "rawResponse",
  DROP COLUMN IF EXISTS "webhookEvents";

-- Make transactionId non-unique (now externalId is the gateway key)
ALTER TABLE "Payment" ALTER COLUMN "transactionId" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Payment_externalId_key" ON "Payment"("externalId");
CREATE INDEX IF NOT EXISTS "Payment_createdAt_idx" ON "Payment"("createdAt");

-- CreateTable PaymentEvent
CREATE TABLE IF NOT EXISTS "PaymentEvent" (
    "id"              TEXT NOT NULL,
    "paymentId"       TEXT NOT NULL,
    "eventType"       TEXT NOT NULL,
    "externalEventId" TEXT,
    "rawPayload"      JSONB NOT NULL,
    "processed"       BOOLEAN NOT NULL DEFAULT false,
    "processedAt"     TIMESTAMP(3),
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "PaymentEvent_externalEventId_key" ON "PaymentEvent"("externalEventId");
CREATE INDEX IF NOT EXISTS "PaymentEvent_paymentId_idx" ON "PaymentEvent"("paymentId");
CREATE INDEX IF NOT EXISTS "PaymentEvent_createdAt_idx" ON "PaymentEvent"("createdAt");

-- AddForeignKey
ALTER TABLE "PaymentEvent" ADD CONSTRAINT "PaymentEvent_paymentId_fkey"
  FOREIGN KEY ("paymentId") REFERENCES "Payment"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
