-- AlterEnum
ALTER TYPE "CouponType" ADD VALUE 'FREE_SHIPPING';
ALTER TYPE "CouponType" ADD VALUE 'FIXED_AMOUNT';

-- Update existing FIXED values to FIXED_AMOUNT before removing FIXED
UPDATE "Coupon" SET type = 'FIXED_AMOUNT' WHERE type = 'FIXED';

-- Rename old enum and recreate (PostgreSQL way to remove enum values)
ALTER TYPE "CouponType" RENAME TO "CouponType_old";
CREATE TYPE "CouponType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT', 'FREE_SHIPPING');
ALTER TABLE "Coupon" ALTER COLUMN "type" TYPE "CouponType" USING type::text::"CouponType";
DROP TYPE "CouponType_old";

-- AlterTable Cart: add couponCode
ALTER TABLE "Cart" ADD COLUMN "couponCode" TEXT;

-- AlterTable Coupon: restructure fields
ALTER TABLE "Coupon"
  ADD COLUMN "description" TEXT,
  ADD COLUMN "maxTotalUses" INTEGER,
  ADD COLUMN "maxUsesPerCustomer" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "firstOrderOnly" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "categoryIds" TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN "maxDiscountAmount" DECIMAL(10,2),
  ADD COLUMN "totalUses" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "totalRevenue" DECIMAL(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN "createdBy" TEXT;

-- Migrate existing data: uses -> totalUses, maxUses -> maxTotalUses, maxUsesPerUser -> maxUsesPerCustomer
UPDATE "Coupon" SET
  "totalUses" = COALESCE("uses", 0);

-- Add validFrom/validUntil as required (set defaults for existing rows)
ALTER TABLE "Coupon"
  ALTER COLUMN "validFrom" SET NOT NULL,
  ALTER COLUMN "validUntil" SET NOT NULL;

-- Drop old columns that were renamed/replaced
ALTER TABLE "Coupon"
  DROP COLUMN IF EXISTS "uses",
  DROP COLUMN IF EXISTS "maxUses",
  DROP COLUMN IF EXISTS "maxUsesPerUser",
  DROP COLUMN IF EXISTS "firstPurchaseOnly";

-- Rename constraint if maxUsesPerUser existed; maxUsesPerCustomer already added above

-- AlterTable CouponUsage: add discountAmount, make orderId unique
ALTER TABLE "CouponUsage"
  ADD COLUMN "discountAmount" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- Drop old unique constraint and add new ones
ALTER TABLE "CouponUsage" DROP CONSTRAINT IF EXISTS "CouponUsage_couponId_orderId_key";

-- CreateIndex on orderId (unique)
ALTER TABLE "CouponUsage" ADD CONSTRAINT "CouponUsage_orderId_key" UNIQUE ("orderId");

-- CreateIndex
CREATE INDEX "CouponUsage_couponId_idx" ON "CouponUsage"("couponId");
CREATE INDEX "CouponUsage_couponId_userId_idx" ON "CouponUsage"("couponId", "userId");

-- Update Coupon indexes
DROP INDEX IF EXISTS "Coupon_isActive_idx";
CREATE INDEX "Coupon_isActive_validFrom_validUntil_idx" ON "Coupon"("isActive", "validFrom", "validUntil");
