import { formatCents, parseMoneyToCents } from './money';

describe('parseMoneyToCents', () => {
  const ok: [string, number][] = [
    ['10,50', 1050], ['10.50', 1050], ['10,5', 1050], ['10', 1000],
    ['1.500', 150000], ['1.500,25', 150025], ['1.234.567', 123456700],
    ['$ 2.000,99', 200099], [' 0,01 ', 1], ['0.1', 10],
  ];
  ok.forEach(([i, o]) => it(`"${i}" → ${o}`, () => expect(parseMoneyToCents(i)).toBe(o)));
  ['', 'abc', '10,555', '-5', '1,2,3', '.', ',', '1.500.5', '1.5000', '12.34.567', '1.50,25'].forEach((i) =>
    it(`"${i}" → null`, () => expect(parseMoneyToCents(i)).toBeNull()));
});

describe('formatCents', () => {
  it('formatea pesos con centavos', () => expect(formatCents(150025)).toBe('$ 1.500,25'));
  it('cero', () => expect(formatCents(0)).toBe('$ 0,00'));
  it('signed muestra + y −', () => {
    expect(formatCents(1050, { signed: true })).toBe('+ $ 10,50');
    expect(formatCents(-1050, { signed: true })).toBe('− $ 10,50');
  });
});
