import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';

@Injectable()
export class R2Service {
  private readonly logger = new Logger(R2Service.name);
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicUrl: string;

  constructor(private config: ConfigService) {
    this.bucket = this.config.getOrThrow('R2_BUCKET_NAME');
    this.publicUrl = this.config.getOrThrow('R2_PUBLIC_URL');

    this.client = new S3Client({
      region: 'auto',
      endpoint: this.config.getOrThrow('R2_ENDPOINT'),
      credentials: {
        accessKeyId: this.config.getOrThrow('R2_ACCESS_KEY_ID'),
        secretAccessKey: this.config.getOrThrow('R2_SECRET_ACCESS_KEY'),
      },
    });
  }

  async upload(
    key: string,
    buffer: Buffer,
    contentType: string,
  ): Promise<string> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        CacheControl: 'public, max-age=31536000, immutable',
      }),
    );
    return `${this.publicUrl}/${key}`;
  }

  async delete(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
  }

  async deleteByUrl(url: string): Promise<void> {
    if (!url.startsWith(this.publicUrl)) {
      this.logger.warn(`URL fora do bucket, ignorando delete: ${url}`);
      return;
    }
    const key = url.replace(`${this.publicUrl}/`, '');
    await this.delete(key);
  }

  buildKey(
    productId: string,
    imageId: string,
    size: 'thumb' | 'card' | 'full',
  ): string {
    return `produtos/${productId}/${imageId}-${size}.webp`;
  }
}
