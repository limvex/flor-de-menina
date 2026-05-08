-- CreateIndex
CREATE INDEX "CartItem_variantId_reservedUntil_idx" ON "CartItem"("variantId", "reservedUntil");
