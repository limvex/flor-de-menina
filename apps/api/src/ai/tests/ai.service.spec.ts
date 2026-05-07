import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AiService } from '../ai.service';
import { OpenRouterService } from '../openrouter.service';

jest.mock('@flor/database', () => ({
  prisma: {
    category: {
      findUnique: jest.fn(),
    },
  },
}));

import { prisma } from '@flor/database';

const mockOpenRouter = {
  generateText: jest.fn(),
  getCreditBalance: jest.fn(),
  mockMode: false,
};

describe('AiService', () => {
  let service: AiService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        AiService,
        { provide: OpenRouterService, useValue: mockOpenRouter },
      ],
    }).compile();
    service = module.get(AiService);
  });

  describe('generateProductDescription', () => {
    it('retorna texto com [MOCK] em mock mode', async () => {
      (prisma.category.findUnique as jest.Mock).mockResolvedValue({
        name: 'Vestidos',
      });
      mockOpenRouter.generateText.mockResolvedValue(
        '[MOCK] Descrição mock gerada automaticamente.',
      );

      const result = await service.generateProductDescription({
        name: 'Vestido Floral',
        categoryId: 'cat1',
      });

      expect(result.mock).toBe(true);
      expect(result.description).toContain('[MOCK]');
    });

    it('retorna mock=false quando texto não começa com [MOCK]', async () => {
      (prisma.category.findUnique as jest.Mock).mockResolvedValue({
        name: 'Blusas',
      });
      mockOpenRouter.generateText.mockResolvedValue(
        'Elegante blusa com caimento impecável.',
      );

      const result = await service.generateProductDescription({
        name: 'Blusa Elegante',
        categoryId: 'cat2',
      });

      expect(result.mock).toBe(false);
      expect(result.description).toBe('Elegante blusa com caimento impecável.');
    });

    it('lança NotFoundException quando categoria não existe', async () => {
      (prisma.category.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.generateProductDescription({
          name: 'Produto',
          categoryId: 'inexistente',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('propaga erro do OpenRouter', async () => {
      (prisma.category.findUnique as jest.Mock).mockResolvedValue({
        name: 'Vestidos',
      });
      mockOpenRouter.generateText.mockRejectedValue(
        new Error('API indisponível'),
      );

      await expect(
        service.generateProductDescription({
          name: 'Vestido',
          categoryId: 'cat1',
        }),
      ).rejects.toThrow('API indisponível');
    });

    it('chama OpenRouter com system e user prompt', async () => {
      (prisma.category.findUnique as jest.Mock).mockResolvedValue({
        name: 'Calças',
      });
      mockOpenRouter.generateText.mockResolvedValue('Calça elegante.');

      await service.generateProductDescription({
        name: 'Calça Slim',
        categoryId: 'cat3',
        tone: 'elegante',
        length: 'curta',
      });

      expect(mockOpenRouter.generateText).toHaveBeenCalledWith(
        expect.stringContaining('Flor de Menina'),
        expect.stringContaining('Calça Slim'),
      );
    });
  });

  describe('getCreditInfo', () => {
    it('repassa resultado do OpenRouter', async () => {
      mockOpenRouter.getCreditBalance.mockResolvedValue({
        available: 5.0,
        used: 1.2,
      });
      const result = await service.getCreditInfo();
      expect(result).toEqual({ available: 5.0, used: 1.2 });
    });

    it('retorna null quando OpenRouter retorna null', async () => {
      mockOpenRouter.getCreditBalance.mockResolvedValue(null);
      const result = await service.getCreditInfo();
      expect(result).toBeNull();
    });
  });
});
