import { BadRequestException, Injectable } from '@nestjs/common';
import { prisma, createId } from '@flor/database';
import { R2Service } from '../../uploads/r2.service';
import type { UpdateHomeContentDto } from './dto/update-home-content.dto';
import sharp = require('sharp');

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const BANNER_MAX_WIDTH = 1440;

@Injectable()
export class HomeContentService {
  constructor(private readonly r2: R2Service) {}

  async getContent() {
    const record = await prisma.homePageContent.findUnique({
      where: { id: 'singleton' },
    });
    if (!record) {
      return {
        bannerImageUrl: null,
        bannerTitle: null,
        bannerSubtitle: null,
        bannerButtonText: null,
        bannerButtonUrl: null,
        aboutTitle: null,
        aboutText: null,
        whatsappNumber: null,
        instagramUrl: null,
        updatedAt: new Date().toISOString(),
      };
    }
    return {
      bannerImageUrl: record.bannerImageUrl,
      bannerTitle: record.bannerTitle,
      bannerSubtitle: record.bannerSubtitle,
      bannerButtonText: record.bannerButtonText,
      bannerButtonUrl: record.bannerButtonUrl,
      aboutTitle: record.aboutTitle,
      aboutText: record.aboutText,
      whatsappNumber: record.whatsappNumber,
      instagramUrl: record.instagramUrl,
      updatedAt: record.updatedAt.toISOString(),
    };
  }

  async updateContent(dto: UpdateHomeContentDto) {
    const data: Record<string, unknown> = {};

    const fields = [
      'bannerImageUrl',
      'bannerTitle',
      'bannerSubtitle',
      'bannerButtonText',
      'bannerButtonUrl',
      'aboutTitle',
      'aboutText',
      'whatsappNumber',
      'instagramUrl',
    ] as const;

    for (const field of fields) {
      if (dto[field] !== undefined) {
        data[field] = dto[field];
      }
    }

    const record = await prisma.homePageContent.upsert({
      where: { id: 'singleton' },
      update: data,
      create: { id: 'singleton', ...data },
    });

    return {
      bannerImageUrl: record.bannerImageUrl,
      bannerTitle: record.bannerTitle,
      bannerSubtitle: record.bannerSubtitle,
      bannerButtonText: record.bannerButtonText,
      bannerButtonUrl: record.bannerButtonUrl,
      aboutTitle: record.aboutTitle,
      aboutText: record.aboutText,
      whatsappNumber: record.whatsappNumber,
      instagramUrl: record.instagramUrl,
      updatedAt: record.updatedAt.toISOString(),
    };
  }

  async uploadBannerImage(
    fileBuffer: Buffer,
    mimeType: string,
  ): Promise<{ url: string }> {
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      throw new BadRequestException({ error: 'INVALID_FORMAT' });
    }
    if (fileBuffer.length > MAX_FILE_SIZE) {
      throw new BadRequestException({ error: 'FILE_TOO_LARGE', maxMb: 5 });
    }

    const processed = await sharp(fileBuffer)
      .resize(BANNER_MAX_WIDTH, undefined, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: 85, effort: 4 })
      .toBuffer();

    const imageId = createId();
    const key = `home/banner-${imageId}.webp`;
    const url = await this.r2.upload(key, processed, 'image/webp');
    return { url };
  }
}
