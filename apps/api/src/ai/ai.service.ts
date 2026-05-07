import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@flor/database';
import { OpenRouterService } from './openrouter.service';
import {
  PRODUCT_DESCRIPTION_SYSTEM,
  buildProductDescriptionPrompt,
} from './prompts/product-description.prompt';

@Injectable()
export class AiService {
  constructor(private openRouter: OpenRouterService) {}

  async generateProductDescription(input: {
    name: string;
    categoryId: string;
    attributes?: string[];
    tone?: string;
    length?: string;
  }): Promise<{ description: string; mock: boolean }> {
    const category = await prisma.category.findUnique({
      where: { id: input.categoryId },
      select: { name: true },
    });
    if (!category) throw new NotFoundException('Categoria não encontrada');

    const userPrompt = buildProductDescriptionPrompt({
      name: input.name,
      category: category.name,
      attributes: input.attributes,
      tone: input.tone as 'elegante' | 'casual' | 'romantica' | undefined,
      length: input.length as 'curta' | 'media' | 'longa' | undefined,
    });

    const description = await this.openRouter.generateText(
      PRODUCT_DESCRIPTION_SYSTEM,
      userPrompt,
    );

    return {
      description,
      mock: description.startsWith('[MOCK]'),
    };
  }

  async getCreditInfo() {
    return this.openRouter.getCreditBalance();
  }
}
