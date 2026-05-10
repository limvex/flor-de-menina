import { MockShippingAdapter } from '../adapters/mock.adapter';
import type { ShippingQuoteInput } from '@flor/types';

const BASE_INPUT: ShippingQuoteInput = {
  originZipCode: '57000000',
  destinationZipCode: '01310100',
  package: { weight: 300, width: 20, height: 5, length: 30 },
  insuranceValue: 150,
};

describe('MockShippingAdapter', () => {
  const adapter = new MockShippingAdapter();

  it('retorna exatamente 3 opções', async () => {
    const options = await adapter.quote(BASE_INPUT);
    expect(options).toHaveLength(3);
  });

  it('todas as opções têm os campos obrigatórios', async () => {
    const options = await adapter.quote(BASE_INPUT);
    for (const opt of options) {
      expect(opt).toHaveProperty('id');
      expect(opt).toHaveProperty('carrier');
      expect(opt).toHaveProperty('service');
      expect(opt).toHaveProperty('cost');
      expect(opt).toHaveProperty('estimatedDays');
      expect(opt).toHaveProperty('label');
      expect(opt.cost).toBeGreaterThan(0);
      expect(opt.estimatedDays).toBeGreaterThan(0);
    }
  });

  it('CEP de NE tem prazo menor que CEP de N', async () => {
    const neOptions = await adapter.quote({
      ...BASE_INPUT,
      destinationZipCode: '57000000',
    }); // Maceió - NE
    const nOptions = await adapter.quote({
      ...BASE_INPUT,
      destinationZipCode: '66000000',
    }); // Belém - N

    const nePac = neOptions.find((o) => o.id === 'pac')!;
    const nPac = nOptions.find((o) => o.id === 'pac')!;

    expect(nePac.estimatedDays).toBeLessThan(nPac.estimatedDays);
  });

  it('peso maior aumenta o custo', async () => {
    const light = await adapter.quote({
      ...BASE_INPUT,
      package: { ...BASE_INPUT.package, weight: 100 },
    });
    const heavy = await adapter.quote({
      ...BASE_INPUT,
      package: { ...BASE_INPUT.package, weight: 2000 },
    });

    const lightPac = light.find((o) => o.id === 'pac')!;
    const heavyPac = heavy.find((o) => o.id === 'pac')!;

    expect(heavyPac.cost).toBeGreaterThan(lightPac.cost);
  });

  it('retorna opções para qualquer região', async () => {
    const ceps = ['01310100', '40010000', '66010000', '70010000', '80010000'];
    for (const cep of ceps) {
      const options = await adapter.quote({
        ...BASE_INPUT,
        destinationZipCode: cep,
      });
      expect(options.length).toBeGreaterThan(0);
    }
  });

  it('getName retorna "mock"', () => {
    expect(adapter.getName()).toBe('mock');
  });
});
