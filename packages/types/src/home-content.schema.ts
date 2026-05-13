export interface HomePageContentResponse {
  bannerImageUrl: string | null;
  bannerTitle: string | null;
  bannerSubtitle: string | null;
  bannerButtonText: string | null;
  bannerButtonUrl: string | null;
  aboutTitle: string | null;
  aboutText: string | null;
  whatsappNumber: string | null;
  instagramUrl: string | null;
  updatedAt: string;
}

export interface UpdateHomePageContentInput {
  bannerImageUrl?: string | null;
  bannerTitle?: string | null;
  bannerSubtitle?: string | null;
  bannerButtonText?: string | null;
  bannerButtonUrl?: string | null;
  aboutTitle?: string | null;
  aboutText?: string | null;
  whatsappNumber?: string | null;
  instagramUrl?: string | null;
}
