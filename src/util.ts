export const nowSec = () => Math.floor(Date.now() / 1000);
export const daysToSec = (d: number) => d * 86400;
export const minToSec = (m: number) => m * 60;

export function abbrevWallet(w: string): string {
  if (!w) return "n/a";
  return w.length <= 12 ? w : `${w.slice(0, 4)}…${w.slice(-4)}`;
}

export function fmtUsd(n: number): string {
  return `$${Math.round(n).toLocaleString()}`;
}

export function fmtCents(p: number): string {
  return `${(p * 100).toFixed(1)}¢`;
}

export function impliedYesProb(outcome: string, price: number): number {
  return outcome.toUpperCase() === "NO" ? (1 - price) : price;
}

// naive "by date" parsing (optional)
export function parseByDateFromTitle(title: string): string | null {
  const m = title.match(/\bby\s+([A-Za-z]{3,9}\s+\d{1,2},\s+\d{4})\b/i);
  return m ? m[1] : null;
}
