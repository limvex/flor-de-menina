-- CreateTable
CREATE TABLE "HomePageContent" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "bannerImageUrl" TEXT,
    "bannerTitle" TEXT,
    "bannerSubtitle" TEXT,
    "bannerButtonText" TEXT,
    "bannerButtonUrl" TEXT,
    "aboutTitle" TEXT,
    "aboutText" TEXT,
    "whatsappNumber" TEXT,
    "instagramUrl" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomePageContent_pkey" PRIMARY KEY ("id")
);
