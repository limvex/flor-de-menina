-- AlterTable
ALTER TABLE "Address" RENAME COLUMN "recipient" TO "recipientName";
ALTER TABLE "Address" RENAME COLUMN "isDefault" TO "isDefaultShipping";
ALTER TABLE "Address" ADD COLUMN "isDefaultBilling" BOOLEAN NOT NULL DEFAULT false;
