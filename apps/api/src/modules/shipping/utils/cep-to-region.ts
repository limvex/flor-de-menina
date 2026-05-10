import type { BrazilRegion } from '@flor/types';

// Mapeamento baseado nas faixas oficiais dos Correios (prefixo dos 5 primeiros dígitos).
export function getRegionFromCep(cep: string): BrazilRegion {
  const cleaned = cep.replace(/\D/g, '');
  const prefix = parseInt(cleaned.substring(0, 5), 10);

  // Sudeste: SP (01000-19999), RJ (20000-28999), ES (29000-29999), MG (30000-39999)
  if (prefix >= 1000 && prefix <= 39999) return 'SE';

  // Nordeste: BA, SE, PE, AL, PB, RN, CE, PI, MA
  if (prefix >= 40000 && prefix <= 65999) return 'NE';

  // Norte: PA (66000-68899), AP (68900-68999), AM/RR/AC (69000-69999)
  if (prefix >= 66000 && prefix <= 69999) return 'N';

  // Centro-Oeste: DF (70000-73699), GO (73700-76799)
  if (prefix >= 70000 && prefix <= 76799) return 'CO';

  // Norte: RO parcial (76800-76999)
  if (prefix >= 76800 && prefix <= 76999) return 'N';

  // Norte: TO (77000-77999)
  if (prefix >= 77000 && prefix <= 77999) return 'N';

  // Centro-Oeste: MT (78000-78899)
  if (prefix >= 78000 && prefix <= 78899) return 'CO';

  // Norte: RO parcial (78900-78999)
  if (prefix >= 78900 && prefix <= 78999) return 'N';

  // Centro-Oeste: MS (79000-79999)
  if (prefix >= 79000 && prefix <= 79999) return 'CO';

  // Sul: PR (80000-87999), SC (88000-89999), RS (90000-99999)
  if (prefix >= 80000 && prefix <= 99999) return 'S';

  return 'SE';
}
