/*
  Warnings:

  - You are about to drop the column `measureTable` on the `Category` table. All the data in the column will be lost.
  - You are about to drop the column `position` on the `Category` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[parentId,slug]` on the table `Category` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Category_slug_idx";

-- DropIndex
DROP INDEX "Category_slug_key";

-- AlterTable
ALTER TABLE "Category" DROP COLUMN "measureTable",
DROP COLUMN "position",
ADD COLUMN     "sizeChart" JSONB,
ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "Category_parentId_slug_key" ON "Category"("parentId", "slug");
