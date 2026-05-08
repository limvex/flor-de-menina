interface Props {
  stock: number;
  isOutOfStock: boolean;
}

export function StockIndicator({ stock, isOutOfStock }: Props) {
  if (isOutOfStock || stock === 0 || stock > 2) return null;

  return (
    <p className="text-sm font-medium text-amber-600">
      ⚡ Restam apenas {stock} {stock === 1 ? 'peça' : 'peças'}!
    </p>
  );
}
