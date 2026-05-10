import { getRegionFromCep } from '../utils/cep-to-region';

describe('getRegionFromCep', () => {
  // Sudeste
  it.each([
    ['01310-100', 'SE', 'São Paulo - SP'],
    ['20040-020', 'SE', 'Rio de Janeiro - RJ'],
    ['30112-000', 'SE', 'Belo Horizonte - MG'],
    ['29100-910', 'SE', 'Vila Velha - ES'],
  ])('CEP %s (%s) → %s', (cep, expected) => {
    expect(getRegionFromCep(cep)).toBe(expected);
  });

  // Nordeste
  it.each([
    ['40010-000', 'NE', 'Salvador - BA'],
    ['49010-000', 'NE', 'Aracaju - SE'],
    ['50010-000', 'NE', 'Recife - PE'],
    ['57010-000', 'NE', 'Maceió - AL'],
    ['58010-000', 'NE', 'João Pessoa - PB'],
    ['59010-000', 'NE', 'Natal - RN'],
    ['60010-000', 'NE', 'Fortaleza - CE'],
    ['64010-000', 'NE', 'Teresina - PI'],
    ['65010-000', 'NE', 'São Luís - MA'],
  ])('CEP %s (%s) → %s', (cep, expected) => {
    expect(getRegionFromCep(cep)).toBe(expected);
  });

  // Norte
  it.each([
    ['66010-000', 'N', 'Belém - PA'],
    ['69010-000', 'N', 'Manaus - AM'],
    ['69300-000', 'N', 'Boa Vista - RR'],
    ['68900-000', 'N', 'Macapá - AP'],
    ['77010-000', 'N', 'Palmas - TO'],
    ['78900-000', 'N', 'Porto Velho - RO'],
    ['69900-000', 'N', 'Rio Branco - AC'],
  ])('CEP %s (%s) → %s', (cep, expected) => {
    expect(getRegionFromCep(cep)).toBe(expected);
  });

  // Centro-Oeste
  it.each([
    ['70010-000', 'CO', 'Brasília - DF'],
    ['74010-000', 'CO', 'Goiânia - GO'],
    ['78005-000', 'CO', 'Cuiabá - MT'],
    ['79010-000', 'CO', 'Campo Grande - MS'],
  ])('CEP %s (%s) → %s', (cep, expected) => {
    expect(getRegionFromCep(cep)).toBe(expected);
  });

  // Sul
  it.each([
    ['80010-000', 'S', 'Curitiba - PR'],
    ['88010-000', 'S', 'Florianópolis - SC'],
    ['90010-000', 'S', 'Porto Alegre - RS'],
    ['97010-000', 'S', 'Santa Maria - RS'],
  ])('CEP %s (%s) → %s', (cep, expected) => {
    expect(getRegionFromCep(cep)).toBe(expected);
  });

  it('aceita CEP sem traço', () => {
    expect(getRegionFromCep('01310100')).toBe('SE');
  });

  it('retorna SE como fallback para CEP inválido', () => {
    expect(getRegionFromCep('00000000')).toBe('SE');
  });
});
