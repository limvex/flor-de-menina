import { buildPackage } from '../utils/cart-to-package.util';

const DEFAULT_WEIGHT = 300;
const DEFAULT_WIDTH = 25;
const DEFAULT_HEIGHT = 5;
const DEFAULT_LENGTH = 30;

describe('buildPackage', () => {
  it('soma peso e comprimento de múltiplos itens', () => {
    const result = buildPackage([
      {
        variantId: 'v1',
        quantity: 2,
        weight: 500,
        width: 20,
        height: 4,
        length: 25,
      },
      {
        variantId: 'v2',
        quantity: 1,
        weight: 300,
        width: 15,
        height: 3,
        length: 20,
      },
    ]);
    expect(result.weight).toBe(500 * 2 + 300 * 1);
    expect(result.length).toBe(25 * 2 + 20 * 1);
  });

  it('usa largura e altura máximas (não soma)', () => {
    const result = buildPackage([
      {
        variantId: 'v1',
        quantity: 1,
        weight: 300,
        width: 30,
        height: 10,
        length: 25,
      },
      {
        variantId: 'v2',
        quantity: 1,
        weight: 300,
        width: 20,
        height: 5,
        length: 25,
      },
    ]);
    expect(result.width).toBe(30);
    expect(result.height).toBe(10);
  });

  it('usa defaults quando peso/dimensão é null e loga warning', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const result = buildPackage([
      {
        variantId: 'v1',
        quantity: 1,
        weight: null,
        width: null,
        height: null,
        length: null,
      },
    ]);
    expect(result.weight).toBe(DEFAULT_WEIGHT);
    expect(result.width).toBe(DEFAULT_WIDTH);
    expect(result.height).toBe(DEFAULT_HEIGHT);
    expect(result.length).toBe(DEFAULT_LENGTH);
    warnSpy.mockRestore();
  });

  it('peso maior aumenta custo (verificação de proporção)', () => {
    const light = buildPackage([
      {
        variantId: 'v1',
        quantity: 1,
        weight: 100,
        width: 20,
        height: 5,
        length: 30,
      },
    ]);
    const heavy = buildPackage([
      {
        variantId: 'v1',
        quantity: 1,
        weight: 1000,
        width: 20,
        height: 5,
        length: 30,
      },
    ]);
    expect(heavy.weight).toBeGreaterThan(light.weight);
  });

  it('multiplica peso pela quantidade', () => {
    const result = buildPackage([
      {
        variantId: 'v1',
        quantity: 3,
        weight: 200,
        width: 20,
        height: 5,
        length: 30,
      },
    ]);
    expect(result.weight).toBe(600);
  });
});
