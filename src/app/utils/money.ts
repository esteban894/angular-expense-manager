export const MAX_AMOUNT_CENTS = 2_000_000_000;
const fmt = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function parseMoneyToCents(input: string): number | null {
  const s = input.replace(/[\s$]/g, '');
  if (!/^[\d.,]+$/.test(s)) return null;
  let int: string, dec = '';
  if (s.includes(',')) {
    const parts = s.split(',');
    if (parts.length !== 2) return null;
    [int, dec] = [parts[0].replace(/\./g, ''), parts[1]];
  } else {
    const dots = s.split('.');
    if (dots.length === 2 && /^\d{1,2}$/.test(dots[1])) [int, dec] = dots;
    else int = s.replace(/\./g, '');
  }
  if (!/^\d+$/.test(int || '0') || !/^\d{0,2}$/.test(dec) || (!int && !dec)) return null;
  return Number(int || '0') * 100 + Number(dec.padEnd(2, '0'));
}

export function formatCents(cents: number, opts: { signed?: boolean } = {}): string {
  const text = fmt.format(Math.abs(cents) / 100).replace(/\s/g, ' ');
  if (!opts.signed) return cents < 0 ? `− ${text}` : text;
  return `${cents < 0 ? '−' : '+'} ${text}`;
}
