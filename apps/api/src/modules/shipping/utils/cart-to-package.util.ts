import { Logger } from '@nestjs/common';

const logger = new Logger('CartToPackage');

const DEFAULT_WEIGHT = 300; // gramas
const DEFAULT_WIDTH = 25; // cm
const DEFAULT_HEIGHT = 5; // cm
const DEFAULT_LENGTH = 30; // cm

export interface CartPackageItem {
  variantId: string;
  quantity: number;
  weight: number | null;
  width: number | null;
  height: number | null;
  length: number | null;
}

export interface PackageDimensions {
  weight: number;
  width: number;
  height: number;
  length: number;
}

export function buildPackage(items: CartPackageItem[]): PackageDimensions {
  let totalWeight = 0;
  let maxWidth = 0;
  let maxHeight = 0;
  let totalLength = 0;
  const usingDefaults: string[] = [];

  for (const item of items) {
    const usesDefault =
      item.weight == null ||
      item.width == null ||
      item.height == null ||
      item.length == null;

    if (usesDefault) {
      usingDefaults.push(item.variantId);
    }

    const w = item.weight ?? DEFAULT_WEIGHT;
    const wd = item.width ?? DEFAULT_WIDTH;
    const ht = item.height ?? DEFAULT_HEIGHT;
    const ln = item.length ?? DEFAULT_LENGTH;

    totalWeight += w * item.quantity;
    maxWidth = Math.max(maxWidth, wd);
    maxHeight = Math.max(maxHeight, ht);
    totalLength += ln * item.quantity;
  }

  if (usingDefaults.length > 0) {
    logger.warn(
      `Variantes sem peso/dimensão (usando defaults): ${usingDefaults.join(', ')}`,
    );
  }

  return {
    weight: totalWeight,
    width: maxWidth,
    height: maxHeight,
    length: totalLength,
  };
}
