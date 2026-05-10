export function calculateInstallment(
  amount: number,
  installments: number,
  monthlyInterestRate: number,
): { installmentAmount: number; totalAmount: number } {
  if (installments < 1) throw new Error('installments deve ser >= 1');
  if (monthlyInterestRate < 0) throw new Error('monthlyInterestRate >= 0');

  if (monthlyInterestRate === 0) {
    return {
      installmentAmount: Number((amount / installments).toFixed(2)),
      totalAmount: Number(amount.toFixed(2)),
    };
  }

  const i = monthlyInterestRate;
  const n = installments;
  const installmentAmount =
    (amount * i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1);

  return {
    installmentAmount: Number(installmentAmount.toFixed(2)),
    totalAmount: Number((installmentAmount * n).toFixed(2)),
  };
}
