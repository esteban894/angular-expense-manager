export const MAX_AMOUNT_CENTS = 2_000_000_000;
const fmt = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Miles con punto bien agrupados: "1.500", "1.234.567". */
const THOUSANDS = /^\d{1,3}(\.\d{3})+$/;

export function parseMoneyToCents(input: string): number | null {
  const s = input.replace(/[\s$]/g, '');
  if (!/^[\d.,]+$/.test(s)) return null;
  let int: string, dec = '';
  if (s.includes(',')) {
    // Coma decimal: la parte entera es dígitos sueltos o miles con punto.
    const parts = s.split(',');
    if (parts.length !== 2) return null;
    if (!/^\d*$/.test(parts[0]) && !THOUSANDS.test(parts[0])) return null;
    [int, dec] = [parts[0].replace(/\./g, ''), parts[1]];
  } else if (THOUSANDS.test(s)) {
    int = s.replace(/\./g, '');
  } else if (/^\d*\.\d{1,2}$/.test(s)) {
    // Un único punto seguido de 1–2 dígitos: punto decimal ("10.50").
    [int, dec] = s.split('.');
  } else if (/^\d+$/.test(s)) {
    int = s;
  } else {
    return null;
  }
  if (!/^\d+$/.test(int || '0') || !/^\d{0,2}$/.test(dec) || (!int && !dec)) return null;
  return Number(int || '0') * 100 + Number(dec.padEnd(2, '0'));
}

export function formatCents(cents: number, opts: { signed?: boolean } = {}): string {
  const text = fmt.format(Math.abs(cents) / 100).replace(/\s/g, ' ');
  if (!opts.signed) return cents < 0 ? `− ${text}` : text;
  return `${cents < 0 ? '−' : '+'} ${text}`;
}
