import { promises as fs } from "fs";
import type { StoreState, WalletProfile } from "./types";
import { nowSec, daysToSec } from "./util";

export async function loadState(path: string): Promise<StoreState> {
  try {
    const raw = await fs.readFile(path, "utf8");
    const parsed = JSON.parse(raw) as StoreState;
    parsed.wallets ??= {};
    parsed.markets ??= {};
    parsed.alertState ??= {};
    parsed.trades ??= [];
    return parsed;
  } catch {
    return { wallets: {}, markets: {}, alertState: {}, trades: [] };
  }
}

export async function saveState(path: string, st: StoreState): Promise<void> {
  await fs.writeFile(path, JSON.stringify(st, null, 2), "utf8");
}

export function ensureWallet(st: StoreState, wallet: string): WalletProfile {
  const w = st.wallets[wallet];
  if (w) return w;

  const idx = Object.keys(st.wallets).length + 1;
  const alias = `acct_${String(idx).padStart(3, "0")}`;
  const firstSeen = nowSec();

  st.wallets[wallet] = { alias, firstSeen };
  return st.wallets[wallet];
}

export function pruneTrades(st: StoreState, keepDays = 35) {
  const cutoff = nowSec() - daysToSec(keepDays);
  st.trades = st.trades.filter(t => t.ts >= cutoff);
}
