-- AlterTable
ALTER TABLE "InstitutionalPage" ADD COLUMN "ogImage" TEXT;
ALTER TABLE "InstitutionalPage" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "InstitutionalPage_isActive_idx" ON "InstitutionalPage"("isActive");
