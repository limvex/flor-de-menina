import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { R2Service } from '../r2.service';

const mockSend = jest.fn().mockResolvedValue({});

jest.mock('@aws-sdk/client-s3', () => {
  return {
    S3Client: jest.fn().mockImplementation(() => ({ send: mockSend })),
    PutObjectCommand: jest
      .fn()
      .mockImplementation((input) => ({ ...input, _type: 'Put' })),
    DeleteObjectCommand: jest
      .fn()
      .mockImplementation((input) => ({ ...input, _type: 'Delete' })),
  };
});

const { PutObjectCommand, DeleteObjectCommand } =
  jest.requireMock('@aws-sdk/client-s3');

const mockConfig = {
  getOrThrow: (key: string) => {
    const map: Record<string, string> = {
      R2_BUCKET_NAME: 'test-bucket',
      R2_PUBLIC_URL: 'https://cdn.exemplo.com',
      R2_ENDPOINT: 'https://endpoint.r2.cloudflarestorage.com',
      R2_ACCESS_KEY_ID: 'key',
      R2_SECRET_ACCESS_KEY: 'secret',
    };
    return map[key];
  },
};

describe('R2Service', () => {
  let service: R2Service;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockSend.mockResolvedValue({});
    const module = await Test.createTestingModule({
      providers: [R2Service, { provide: ConfigService, useValue: mockConfig }],
    }).compile();
    service = module.get(R2Service);
  });

  describe('upload', () => {
    it('retorna URL pública correta', async () => {
      const url = await service.upload(
        'produtos/abc/img-full.webp',
        Buffer.from('test'),
        'image/webp',
      );
      expect(url).toBe('https://cdn.exemplo.com/produtos/abc/img-full.webp');
    });

    it('chama PutObjectCommand com parâmetros corretos', async () => {
      await service.upload('minha/key.webp', Buffer.from('data'), 'image/webp');
      expect(PutObjectCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          Bucket: 'test-bucket',
          Key: 'minha/key.webp',
          ContentType: 'image/webp',
        }),
      );
    });
  });

  describe('delete', () => {
    it('chama DeleteObjectCommand com a key correta', async () => {
      await service.delete('produtos/xyz/img-thumb.webp');
      expect(DeleteObjectCommand).toHaveBeenCalledWith({
        Bucket: 'test-bucket',
        Key: 'produtos/xyz/img-thumb.webp',
      });
    });
  });

  describe('deleteByUrl', () => {
    it('extrai key e chama delete quando URL está no bucket', async () => {
      const spy = jest.spyOn(service, 'delete').mockResolvedValue();
      await service.deleteByUrl(
        'https://cdn.exemplo.com/produtos/id1/img-full.webp',
      );
      expect(spy).toHaveBeenCalledWith('produtos/id1/img-full.webp');
    });

    it('não chama delete para URLs externas', async () => {
      const spy = jest.spyOn(service, 'delete').mockResolvedValue();
      await service.deleteByUrl('https://outro-cdn.com/foto.webp');
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('buildKey', () => {
    it('formata path correto para thumb', () => {
      expect(service.buildKey('prod1', 'img1', 'thumb')).toBe(
        'produtos/prod1/img1-thumb.webp',
      );
    });

    it('formata path correto para card', () => {
      expect(service.buildKey('prod1', 'img1', 'card')).toBe(
        'produtos/prod1/img1-card.webp',
      );
    });

    it('formata path correto para full', () => {
      expect(service.buildKey('prod1', 'img1', 'full')).toBe(
        'produtos/prod1/img1-full.webp',
      );
    });
  });
});
