import type { StoreState, Trade, MarketMeta } from "./types";
import type { ClobState } from "./clob_ws";
import { CONFIG } from "./config";
import { daysToSec, minToSec, nowSec, impliedYesProb } from "./util";

export function isExcludedMarket(meta: MarketMeta): boolean {
  const cat = (meta.category ?? "").toLowerCase();
  return CONFIG.filters.excludeCategories.some(x => cat.includes(x));
}

export function hasSufficientLiquidity(meta: MarketMeta, wsState?: ClobState): boolean {
  const gammaOk =
    meta.liquidityUsd != null &&
    meta.liquidityUsd >= CONFIG.filters.minGammaLiquidityUsd;

  const depth = (wsState?.topBidNotional5 ?? 0) + (wsState?.topAskNotional5 ?? 0);
  const wsOk = depth >= CONFIG.filters.minTop5DepthUsd;

  // If ws not ready yet, rely on Gamma only.
  return wsState ? (gammaOk && wsOk) : gammaOk;
}

export function walletStats(st: StoreState, wallet: string) {
  const now = nowSec();
  const since30d = now - daysToSec(30);
  const since24h = now - daysToSec(1);

  const trades30d = st.trades.filter(t => t.wallet === wallet && t.ts >= since30d);
  const trades24h = st.trades.filter(t => t.wallet === wallet && t.ts >= since24h);

  const markets30d = new Set(trades30d.map(t => t.marketId));
  const markets24h = new Set(trades24h.map(t => t.marketId));

  const notional24h = trades24h.reduce((s, t) => s + t.notional, 0);

  const profile = st.wallets[wallet];
  const firstSeen = profile?.firstSeen ?? now;
  const ageDays = (now - firstSeen) / 86400;

  return {
    trades30dCount: trades30d.length,
    markets30dCount: markets30d.size,
    markets24hCount: markets24h.size,
    notional24h,
    ageDays
  };
}

// Low-activity wallet definition: (<=30 trades OR <=15 markets) in <=30 days
export function isLowActivityWallet(stats: ReturnType<typeof walletStats>) {
  return stats.trades30dCount <= CONFIG.B.lowActivityTrades30dMax
    || stats.markets30dCount <= CONFIG.B.lowActivityMarkets30dMax;
}

// Low-volume market heuristic based on trailing 7d history
export function isLowVolumeMarket(st: StoreState, marketId: string) {
  const now = nowSec();
  const since7d = now - daysToSec(7);
  const mTrades = st.trades.filter(t => t.marketId === marketId && t.ts >= since7d);
  const uniqWallets = new Set(mTrades.map(t => t.wallet));
  return (mTrades.length <= CONFIG.A.lowVolTrades7dMax) && (uniqWallets.size <= CONFIG.A.lowVolUniqueWallets7dMax);
}

export function marketMedianTradeSize(st: StoreState, marketId: string) {
  const now = nowSec();
  const since = now - daysToSec(CONFIG.A.medianLookbackDays);
  const arr = st.trades
    .filter(t => t.marketId === marketId && t.ts >= since)
    .map(t => t.notional)
    .sort((a, b) => a - b);

  if (arr.length === 0) return 0;
  const mid = Math.floor(arr.length / 2);
  return arr.length % 2 ? arr[mid] : (arr[mid - 1] + arr[mid]) / 2;
}

export function dynamicMarketThreshold(st: StoreState, marketId: string) {
  const med = marketMedianTradeSize(st, marketId);
  // Always at least $1500 due to pipeline min, but dynamic can be higher
  return Math.max(CONFIG.minNominalUsd, CONFIG.A.dynamicMedianMultiplier * med);
}

/**
 * Unique Market Transaction (UMT):
 * Low activity wallet transactions with <=20% implied YES probability
 * and/or low vol. market
 */
export function isUMT(st: StoreState, t: Trade) {
  const ws = walletStats(st, t.wallet);
  const lowAct = isLowActivityWallet(ws);
  const lowProb = impliedYesProb(t.outcome, t.price) <= CONFIG.A.impliedYesProbMax;
  const lowVol = isLowVolumeMarket(st, t.marketId);
  return (lowAct && lowProb) || lowVol;
}

/**
 * Criterion A: Market-Centric (Low-Volume Market Pressure)
 * - Nominal >= $1500 (pipeline already ensures)
 * - Dynamic market threshold based on median trade size
 * - Many-wallet entry burst: 5+ UMT wallets in 30 minutes
 * - Re-entry: same wallet re-enters 3+ times
 * - Smart dedupe w/ override
 */
export function evalCriterionA(st: StoreState, t: Trade) {
  const lowVol = isLowVolumeMarket(st, t.marketId);
  if (!lowVol) return { triggered: false as const, reason: "A_not_low_vol" };

  const threshold = dynamicMarketThreshold(st, t.marketId);
  if (t.notional < threshold) return { triggered: false as const, reason: "A_below_dynamic_threshold" };

  const now = nowSec();
  const since30m = now - minToSec(CONFIG.A.burstWindowMin);

  const recent = st.trades.filter(x =>
    x.marketId === t.marketId &&
    x.ts >= since30m &&
    x.notional >= threshold
  );

  const umtWallets = new Set<string>();
  for (const x of recent) if (isUMT(st, x)) umtWallets.add(x.wallet);

  const umtCount30m = umtWallets.size;

  const since12h = now - 12 * 3600;
  const walletMarketTrades = st.trades.filter(x =>
    x.wallet === t.wallet &&
    x.marketId === t.marketId &&
    x.ts >= since12h &&
    x.notional >= threshold
  );

  const reEntryCount = walletMarketTrades.length;

  const burstTriggered = umtCount30m >= CONFIG.A.burstMinUMTWallets;
  const reEntryTriggered = reEntryCount >= CONFIG.A.reEntryMinCount;

  return {
    triggered: (burstTriggered || reEntryTriggered) as const,
    reason: burstTriggered ? "A_burst_UMT_wallets" : "A_reentry",
    umtCount30m,
    reEntryCount,
    threshold
  };
}

export function shouldSendA(st: StoreState, marketId: string, umtCount30m: number, notionalNow: number) {
  const key = `A:${marketId}`;
  const now = nowSec();
  const cooldown = minToSec(CONFIG.A.dedupeCooldownMin);

  const prev = st.alertState[key];
  if (!prev) {
    st.alertState[key] = { lastSent: now, lastTier: 0, metricA: umtCount30m, metricB: notionalNow };
    return true;
  }

  const elapsed = now - prev.lastSent;
  const entryIncrease = prev.metricA > 0 ? (umtCount30m - prev.metricA) / prev.metricA : 1;

  const override =
    entryIncrease >= CONFIG.A.overrideEntryIncreasePct ||
    notionalNow >= prev.metricB * CONFIG.A.overrideNotionalMultiplier;

  if (elapsed >= cooldown || override) {
    st.alertState[key] = { ...prev, lastSent: now, metricA: umtCount30m, metricB: notionalNow };
    return true;
  }
  return false;
}

/**
 * Criterion B: Wallet-Centric (Fresh/Low-Activity + Big Capital)
 * - Fresh <= 30 days
 * - Low-activity <=30 trades OR <=15 markets in 30d
 * - Single-trade >= $2500
 * - High conviction <=3 markets in 24h
 * - Tier-based dedupe based on 24h notional: 2.5k → 5k → 7.5k → 10k
 */
export function evalCriterionB(st: StoreState, t: Trade) {
  const ws = walletStats(st, t.wallet);
  const fresh = ws.ageDays <= CONFIG.B.freshWalletDaysMax;
  const lowAct = isLowActivityWallet(ws);

  if (!(fresh || lowAct)) return { triggered: false as const, reason: "B_not_fresh_or_low_activity" };
  if (t.notional < CONFIG.B.singleTradeMinNotionalUsd) return { triggered: false as const, reason: "B_below_2500" };

  const conviction = ws.markets24hCount <= CONFIG.B.convictionMaxMarkets24h;

  let tier = 1;
  for (let i = 0; i < CONFIG.B.tiersUsd.length; i++) {
    if (ws.notional24h >= CONFIG.B.tiersUsd[i]) tier = i + 1;
  }

  const key = `B:${t.wallet}`;
  const now = nowSec();
  const prev = st.alertState[key];
  const cooldown = minToSec(CONFIG.B.dedupeCooldownMin);

  if (!prev) {
    st.alertState[key] = { lastSent: now, lastTier: tier, metricA: ws.notional24h, metricB: 0 };
    return { triggered: true as const, reason: "B_fresh_or_low_activity_big_capital", tier, fresh, lowAct, conviction };
  }

  const elapsed = now - prev.lastSent;
  const tierUp = tier > prev.lastTier;

  if (tierUp || elapsed >= cooldown) {
    st.alertState[key] = { lastSent: now, lastTier: Math.max(prev.lastTier, tier), metricA: ws.notional24h, metricB: 0 };
    return { triggered: true as const, reason: "B_fresh_or_low_activity_big_capital", tier, fresh, lowAct, conviction };
  }

  return { triggered: false as const, reason: "B_dedup_suppressed", tier, fresh, lowAct, conviction };
}
