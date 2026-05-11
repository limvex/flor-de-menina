import { calculateInstallment } from '../utils/installment-calculator';

describe('calculateInstallment', () => {
  it('retorna parcela sem juros quando rate=0', () => {
    const result = calculateInstallment(300, 3, 0);
    expect(result.installmentAmount).toBe(100);
    expect(result.totalAmount).toBe(300);
  });

  it('retorna parcela com juros mensais usando tabela Price', () => {
    const result = calculateInstallment(1000, 12, 0.0199);
    expect(result.installmentAmount).toBeGreaterThan(83.33);
    expect(result.totalAmount).toBeGreaterThan(1000);
  });

  it('lança erro se installments < 1', () => {
    expect(() => calculateInstallment(100, 0, 0)).toThrow();
  });

  it('lança erro se rate negativa', () => {
    expect(() => calculateInstallment(100, 1, -0.01)).toThrow();
  });

  it('1x sem juros retorna amount total correto', () => {
    const result = calculateInstallment(500, 1, 0);
    expect(result.installmentAmount).toBe(500);
    expect(result.totalAmount).toBe(500);
  });
});
