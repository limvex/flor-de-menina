import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createId, prisma } from '@flor/database';
import { R2Service } from './r2.service';
import { ImageProcessorService } from './image-processor.service';

@Injectable()
export class UploadsService {
  constructor(
    private r2: R2Service,
    private imageProcessor: ImageProcessorService,
  ) {}

  async uploadProductImage(
    productId: string,
    fileBuffer: Buffer,
  ): Promise<{
    id: string;
    urls: { thumb: string; card: string; full: string };
  }> {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });
    if (!product) throw new NotFoundException('Produto não encontrado');

    const validation = await this.imageProcessor.validateImage(fileBuffer);
    if (!validation.valid) {
      throw new BadRequestException(validation.error);
    }

    const imageId = createId();
    const sizes = await this.imageProcessor.processProductImage(fileBuffer);

    const [thumbUrl, cardUrl, fullUrl] = await Promise.all([
      this.r2.upload(
        this.r2.buildKey(productId, imageId, 'thumb'),
        sizes.thumb,
        'image/webp',
      ),
      this.r2.upload(
        this.r2.buildKey(productId, imageId, 'card'),
        sizes.card,
        'image/webp',
      ),
      this.r2.upload(
        this.r2.buildKey(productId, imageId, 'full'),
        sizes.full,
        'image/webp',
      ),
    ]);

    const lastImage = await prisma.productImage.findFirst({
      where: { productId },
      orderBy: { position: 'desc' },
      select: { position: true },
    });

    await prisma.productImage.create({
      data: {
        id: imageId,
        productId,
        url: fullUrl,
        thumbUrl,
        cardUrl,
        position: (lastImage?.position ?? -1) + 1,
      },
    });

    return {
      id: imageId,
      urls: { thumb: thumbUrl, card: cardUrl, full: fullUrl },
    };
  }

  async deleteProductImage(imageId: string): Promise<void> {
    const image = await prisma.productImage.findUnique({
      where: { id: imageId },
    });
    if (!image) throw new NotFoundException('Imagem não encontrada');

    await Promise.all([
      this.r2.deleteByUrl(image.url),
      image.thumbUrl ? this.r2.deleteByUrl(image.thumbUrl) : undefined,
      image.cardUrl ? this.r2.deleteByUrl(image.cardUrl) : undefined,
    ]);

    await prisma.productImage.delete({ where: { id: imageId } });
  }

  async reorderImages(productId: string, imageIds: string[]): Promise<void> {
    await prisma.$transaction(
      imageIds.map((id, index) =>
        prisma.productImage.update({
          where: { id, productId },
          data: { position: index },
        }),
      ),
    );
  }
}
