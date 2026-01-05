import "dotenv/config";

function must(k: string): string {
  const v = process.env[k];
  if (!v) throw new Error(`Missing env var: ${k}`);
  return v;
}
function str(k: string, d: string): string { return process.env[k] ?? d; }
function num(k: string, d: number): number {
  const v = process.env[k];
  const n = v ? Number(v) : d;
  return Number.isFinite(n) ? n : d;
}

const excludeCategories = (process.env.EXCLUDE_CATEGORIES ?? "sports,crypto")
  .split(",").map(s => s.trim().toLowerCase()).filter(Boolean);

export const CONFIG = {
  discordWebhookUrl: must("DISCORD_WEBHOOK_URL"),
  pollIntervalMs: num("POLL_INTERVAL_MS", 12000),
  statePath: str("STATE_PATH", "./state.json"),

  dataApiBase: str("PM_DATA_API", "https://data-api.polymarket.com"),
  gammaApiBase: str("PM_GAMMA_API", "https://gamma-api.polymarket.com"),
  clobWssUrl: str("PM_CLOB_WSS", "wss://ws-subscriptions-clob.polymarket.com/ws/"),

  filters: {
    excludeCategories,
    minGammaLiquidityUsd: num("MIN_GAMMA_LIQUIDITY_USD", 25000),
    minTop5DepthUsd: num("MIN_TOP5_BOOK_DEPTH_USD", 8000)
  },

  // Pipeline minimum
  minNominalUsd: 1500,

  // ===== Criterion A =====
  A: {
    impliedYesProbMax: 0.20,
    burstWindowMin: 30,
    burstMinUMTWallets: 5,
    reEntryMinCount: 3,
    medianLookbackDays: 7,
    dynamicMedianMultiplier: 2.5,
    // "low volume market" heuristic (you can tune)
    lowVolTrades7dMax: 200,
    lowVolUniqueWallets7dMax: 80,

    // Smart dedup
    dedupeCooldownMin: 30,
    overrideEntryIncreasePct: 0.50,
    overrideNotionalMultiplier: 2.0
  },

  // ===== Criterion B =====
  B: {
    freshWalletDaysMax: 30,
    lowActivityTrades30dMax: 30,
    lowActivityMarkets30dMax: 15,
    singleTradeMinNotionalUsd: 2500,
    convictionMaxMarkets24h: 3,
    tiersUsd: [2500, 5000, 7500, 10000],
    dedupeCooldownMin: 60
  }
};
