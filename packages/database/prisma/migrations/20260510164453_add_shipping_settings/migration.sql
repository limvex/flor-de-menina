-- CreateEnum
CREATE TYPE "BrazilRegion" AS ENUM ('N', 'NE', 'CO', 'SE', 'S');

-- CreateTable
CREATE TABLE "StoreSettings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "originZipCode" TEXT NOT NULL DEFAULT '57000000',
    "originAddress" JSONB,
    "freeShippingGlobalThreshold" DECIMAL(10,2),
    "shippingProvider" TEXT NOT NULL DEFAULT 'mock',
    "storeName" TEXT NOT NULL DEFAULT 'Flor de Menina',
    "storeEmail" TEXT,
    "storePhone" TEXT,
    "storeCnpj" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegionShippingRule" (
    "id" TEXT NOT NULL,
    "region" "BrazilRegion" NOT NULL,
    "freeShippingMin" DECIMAL(10,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "RegionShippingRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MelhorEnvioCredentials" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "scope" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MelhorEnvioCredentials_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RegionShippingRule_region_key" ON "RegionShippingRule"("region");
