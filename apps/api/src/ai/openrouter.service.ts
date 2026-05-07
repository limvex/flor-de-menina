import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class OpenRouterService {
  private readonly logger = new Logger(OpenRouterService.name);
  private readonly client: OpenAI | null;
  private readonly model: string;
  readonly mockMode: boolean;

  constructor(private config: ConfigService) {
    const apiKey = this.config.get<string>('OPENROUTER_API_KEY');
    this.model =
      this.config.get<string>('OPENROUTER_MODEL') ??
      'anthropic/claude-haiku-4-5';
    this.mockMode =
      !apiKey || this.config.get('MOCK_AI_DESCRIPTION') === 'true';

    if (this.mockMode) {
      this.client = null;
      this.logger.warn('OpenRouter rodando em MOCK MODE');
    } else {
      this.client = new OpenAI({
        apiKey,
        baseURL: 'https://openrouter.ai/api/v1',
        defaultHeaders: {
          'HTTP-Referer': 'https://flordemenina.site',
          'X-Title': 'Flor de Menina',
        },
      });
    }
  }

  async generateText(
    systemPrompt: string,
    userPrompt: string,
  ): Promise<string> {
    if (this.mockMode) {
      return this.generateMock(userPrompt);
    }

    const completion = await this.client!.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 600,
      temperature: 0.7,
    });

    const text = completion.choices[0]?.message?.content;
    if (!text) throw new Error('Resposta vazia do modelo');

    this.logger.log(`Geração IA: ${completion.usage?.total_tokens} tokens`);
    return text.trim();
  }

  private generateMock(userPrompt: string): string {
    return `[MOCK] Descrição gerada automaticamente. Configure OPENROUTER_API_KEY para gerações reais.\n\nProduto baseado em: ${userPrompt.slice(0, 100)}...`;
  }

  async getCreditBalance(): Promise<{
    available: number;
    used: number;
  } | null> {
    if (this.mockMode) return null;

    try {
      const res = await fetch('https://openrouter.ai/api/v1/credits', {
        headers: {
          Authorization: `Bearer ${this.config.get('OPENROUTER_API_KEY')}`,
        },
      });
      const data = (await res.json()) as {
        data?: { total_credits?: number; total_usage?: number };
      };
      return {
        available: data.data?.total_credits ?? 0,
        used: data.data?.total_usage ?? 0,
      };
    } catch (e) {
      this.logger.error('Erro buscando saldo OpenRouter', e);
      return null;
    }
  }
}
