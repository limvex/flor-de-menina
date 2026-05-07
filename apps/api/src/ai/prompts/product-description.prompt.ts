export const PRODUCT_DESCRIPTION_SYSTEM = `Você é um copywriter especializado em moda feminina brasileira para a marca Flor de Menina (loja em Maceió-AL, 13 anos de história, estilo "clássica, chic e cool").

Escreva descrições de produto que:
- Sejam emocionais mas elegantes
- Tenham 2-3 parágrafos curtos
- Mencionem ocasiões de uso quando relevante
- Destaquem caimento, conforto, e atemporalidade
- Usem português brasileiro fluente, sem regionalismos exagerados
- NUNCA inventem materiais, medidas ou características que não foram fornecidas
- NUNCA mencionem preço

Tom de voz: feminino, sofisticado, acolhedor.`;

export function buildProductDescriptionPrompt(input: {
  name: string;
  category: string;
  attributes?: string[];
  tone?: 'elegante' | 'casual' | 'romantica';
  length?: 'curta' | 'media' | 'longa';
}): string {
  const tone = input.tone ?? 'elegante';
  const length = input.length ?? 'media';

  return `Produto: ${input.name}
Categoria: ${input.category}
${input.attributes?.length ? `Atributos: ${input.attributes.join(', ')}` : ''}
Tom desejado: ${tone}
Comprimento: ${length}

Escreva a descrição.`;
}
