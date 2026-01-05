export type Trade = {
  tradeId: string;
  ts: number;
  wallet: string;       // proxyWallet/trader address from Data API
  marketId: string;     // conditionId / market id
  outcome: string;      // YES/NO
  side: "BUY" | "SELL";
  shares: number;
  price: number;        // trade price (prob in 0..1)
  notional: number;     // shares * price (USD nominal if collateral = $1)
};

export type MarketMeta = {
  marketId: string;
  title: string;
  category?: string;
  iconUrl?: string;
  imageUrl?: string;
  clobTokenIds?: string[];   // used to subscribe to CLOB WSS market channel
  liquidityUsd?: number;     // Gamma liquidity (parsed)
};

export type WalletProfile = {
  firstSeen: number;
  alias: string;
};

export type AlertState = {
  lastSent: number;
  lastTier: number;
  metricA: number; // used for A dedupe (UMT count)
  metricB: number; // used for A dedupe (notional)
};

export type StoreState = {
  wallets: Record<string, WalletProfile>;
  markets: Record<string, MarketMeta>;
  alertState: Record<string, AlertState>;
  trades: Trade[];
};
