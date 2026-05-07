/*
  Warnings:

  - Added the required column `source` to the `StockMovement` table without a default value. This is not possible if the table is not empty.
  - Added the required column `stockAfter` to the `StockMovement` table without a default value. This is not possible if the table is not empty.
  - Added the required column `stockBefore` to the `StockMovement` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "StockMovementSource" AS ENUM ('MANUAL_IN', 'MANUAL_ADJUST', 'COUNTER_SALE', 'ONLINE_ORDER', 'ORDER_CANCELLED', 'ORDER_REFUNDED', 'LOSS', 'RETURN');

-- DropIndex
DROP INDEX "StockMovement_variantId_idx";

-- AlterTable
ALTER TABLE "StockMovement" ADD COLUMN     "source" "StockMovementSource" NOT NULL,
ADD COLUMN     "stockAfter" INTEGER NOT NULL,
ADD COLUMN     "stockBefore" INTEGER NOT NULL,
ALTER COLUMN "reason" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "StockMovement_variantId_createdAt_idx" ON "StockMovement"("variantId", "createdAt");

-- CreateIndex
CREATE INDEX "StockMovement_source_idx" ON "StockMovement"("source");
