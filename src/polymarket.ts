import axios from "axios";
import type { Trade, MarketMeta, StoreState } from "./types";

// Global public trades: Data API /trades :contentReference[oaicite:5]{index=5}
export async function fetchTrades(dataApiBase: string, limit = 150): Promise<any[]> {
  const url = `${dataApiBase}/trades`;
  const res = await axios.get(url, { params: { limit }, timeout: 15000, validateStatus: () => true });
  if (res.status < 200 || res.status >= 300) throw new Error(`Data API /trades HTTP ${res.status}`);
  return Array.isArray(res.data) ? res.data : (res.data?.data ?? res.data?.trades ?? []);
}

export function normalizeTrade(rt: any): Trade | null {
  const tradeId = String(rt.id ?? rt.trade_id ?? rt.hash ?? rt.txHash ?? "").trim();
  if (!tradeId) return null;

  const tsRaw = rt.timestamp ?? rt.ts ?? rt.created_at ?? rt.time;
  const ts = typeof tsRaw === "number"
    ? (tsRaw > 1e12 ? Math.floor(tsRaw / 1000) : tsRaw)
    : Math.floor(new Date(tsRaw).getTime() / 1000);

  const wallet = String(rt.proxyWallet ?? rt.trader ?? rt.user ?? rt.address ?? "").toLowerCase();
  if (!wallet) return null;

  const marketId = String(rt.conditionId ?? rt.condition_id ?? rt.marketId ?? rt.market_id ?? rt.market ?? "").trim();
  if (!marketId) return null;

  const outcome = String(rt.outcome ?? rt.asset ?? rt.token_side ?? rt.selection ?? "YES").toUpperCase();
  const sideRaw = String(rt.side ?? rt.action ?? rt.direction ?? "BUY").toUpperCase();
  const side: "BUY" | "SELL" = sideRaw.includes("SELL") ? "SELL" : "BUY";

  const shares = Number(rt.size ?? rt.shares ?? rt.amount ?? rt.quantity ?? 0);
  const price = Number(rt.price ?? rt.trade_price ?? rt.rate ?? 0);

  if (!Number.isFinite(shares) || !Number.isFinite(price) || shares <= 0 || price <= 0) return null;

  const notional = shares * price;
  return { tradeId, ts, wallet, marketId, outcome, side, shares, price, notional };
}

// Gamma markets metadata is public :contentReference[oaicite:6]{index=6}
export async function fetchMarketMeta(gammaApiBase: string, marketId: string): Promise<MarketMeta | null> {
  const url = `${gammaApiBase}/markets`;
  const res = await axios.get(url, { params: { id: marketId }, timeout: 15000, validateStatus: () => true });
  if (res.status < 200 || res.status >= 300) return null;
  const m = Array.isArray(res.data) ? res.data[0] : res.data;
  if (!m) return null;

  const title = String(m.question ?? m.title ?? m.name ?? "").trim() || `Market ${marketId}`;
  const category = m.category ? String(m.category) : undefined;

  const iconUrl = m.icon ?? m.iconUrl ?? m.icon_url;
  const imageUrl = m.image ?? m.imageUrl ?? m.image_url ?? m.twitterCardImage;

  const clobTokenIds: string[] | undefined = Array.isArray(m.clobTokenIds)
    ? m.clobTokenIds.map(String)
    : undefined;

  // Gamma includes liquidity (commonly as string) :contentReference[oaicite:7]{index=7}
  const liqRaw = m.liquidity;
  const liquidityUsd = liqRaw == null ? undefined : Number(String(liqRaw));
  const liq = Number.isFinite(liquidityUsd) ? liquidityUsd : undefined;

  return { marketId, title, category, iconUrl, imageUrl, clobTokenIds, liquidityUsd: liq };
}

export async function getOrFetchMarket(st: StoreState, gammaApiBase: string, marketId: string): Promise<MarketMeta> {
  const cached = st.markets[marketId];
  if (cached?.title) return cached;
  const meta = await fetchMarketMeta(gammaApiBase, marketId);
  st.markets[marketId] = meta ?? { marketId, title: `Market ${marketId}` };
  return st.markets[marketId];
}

// Enrichment: current positions :contentReference[oaicite:8]{index=8}
export async function fetchUserPositions(dataApiBase: string, wallet: string): Promise<any[]> {
  const url = `${dataApiBase}/positions`;
  const res = await axios.get(url, { params: { user: wallet, limit: 200 }, timeout: 15000, validateStatus: () => true });
  if (res.status < 200 || res.status >= 300) return [];
  return Array.isArray(res.data) ? res.data : (res.data?.data ?? res.data?.positions ?? []);
}

// Enrichment: closed positions (for winrate) :contentReference[oaicite:9]{index=9}
export async function fetchClosedPositions(dataApiBase: string, wallet: string, limit = 50): Promise<any[]> {
  const url = `${dataApiBase}/closed-positions`;
  const res = await axios.get(url, { params: { user: wallet, limit }, timeout: 15000, validateStatus: () => true });
  if (res.status < 200 || res.status >= 300) return [];
  return Array.isArray(res.data) ? res.data : (res.data?.data ?? res.data?.positions ?? []);
}

export function calcWinRateFromClosedPositions(rows: any[]): { winRate: number | null; sample: number } {
  if (!rows?.length) return { winRate: null, sample: 0 };

  // Realized PnL naming varies; handle common keys.
  const pnlVals = rows.map(r => Number(r.realizedPnl ?? r.realized_pnl ?? r.pnl ?? r.profit ?? NaN))
    .filter(n => Number.isFinite(n));

  if (pnlVals.length === 0) return { winRate: null, sample: rows.length };

  const wins = pnlVals.filter(x => x > 0).length;
  return { winRate: wins / pnlVals.length, sample: pnlVals.length };
}
