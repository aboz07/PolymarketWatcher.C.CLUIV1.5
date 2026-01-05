import WebSocket from "ws";

export type ClobState = {
  lastTradePrice?: number;
  bestBid?: number;
  bestAsk?: number;
  topBidNotional5?: number;
  topAskNotional5?: number;
};

// Public market channel docs :contentReference[oaicite:10]{index=10}
export class ClobWsClient {
  private ws?: WebSocket;
  private url: string;
  private subscribed = new Set<string>();
  private stateByAsset = new Map<string, ClobState>();

  constructor(url: string) { this.url = url; }

  start() { this.connect(); }

  get(assetId: string): ClobState | undefined {
    return this.stateByAsset.get(assetId);
  }

  subscribe(assetIds: string[]) {
    const newOnes = assetIds.filter(id => id && !this.subscribed.has(id));
    if (newOnes.length === 0) return;
    newOnes.forEach(id => this.subscribed.add(id));

    const msg = { operation: "subscribe", assets_ids: newOnes };
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  private connect() {
    this.ws = new WebSocket(this.url);

    this.ws.on("open", () => {
      const all = Array.from(this.subscribed);
      if (all.length) {
        this.ws!.send(JSON.stringify({ operation: "subscribe", assets_ids: all }));
      }
    });

    this.ws.on("message", (buf) => {
      try { this.handle(JSON.parse(buf.toString())); } catch { /* ignore */ }
    });

    this.ws.on("close", () => setTimeout(() => this.connect(), 1500));
    this.ws.on("error", () => { /* close will follow */ });
  }

  private handle(msg: any) {
    const assetId = msg.asset_id ?? msg.assetId;
    const eventType = msg.event_type ?? msg.eventType;
    if (!assetId || !eventType) return;

    const st = this.stateByAsset.get(assetId) ?? {};

    if (eventType === "last_trade_price") {
      const p = Number(msg.price);
      if (Number.isFinite(p)) st.lastTradePrice = p;
    }

    if (eventType === "best_bid_ask") {
      const bid = Number(msg.best_bid);
      const ask = Number(msg.best_ask);
      if (Number.isFinite(bid)) st.bestBid = bid;
      if (Number.isFinite(ask)) st.bestAsk = ask;
    }

    if (eventType === "book") {
      const bids = msg.bids ?? msg.buys ?? [];
      const asks = msg.asks ?? msg.sells ?? [];

      let bidSum = 0;
      for (const lvl of (Array.isArray(bids) ? bids.slice(0, 5) : [])) {
        const price = Number(lvl.price);
        const size = Number(lvl.size);
        if (Number.isFinite(price) && Number.isFinite(size)) bidSum += price * size;
      }

      let askSum = 0;
      for (const lvl of (Array.isArray(asks) ? asks.slice(0, 5) : [])) {
        const price = Number(lvl.price);
        const size = Number(lvl.size);
        if (Number.isFinite(price) && Number.isFinite(size)) askSum += price * size;
      }

      st.topBidNotional5 = bidSum;
      st.topAskNotional5 = askSum;
    }

    this.stateByAsset.set(assetId, st);
  }
}
