import { CONFIG } from "./config";
import { loadState, saveState, ensureWallet, pruneTrades } from "./store";
import { fetchTrades, normalizeTrade, getOrFetchMarket, fetchUserPositions, fetchClosedPositions, calcWinRateFromClosedPositions } from "./polymarket";
import { ClobWsClient } from "./clob_ws";
import { postDiscord } from "./discord";
import { abbrevWallet, nowSec, parseByDateFromTitle } from "./util";
import { evalCriterionA, evalCriterionB, shouldSendA, isUMT, isExcludedMarket, hasSufficientLiquidity } from "./rules";

const argv = new Set(process.argv.slice(2));

async function main() {
  const st = await loadState(CONFIG.statePath);

  // Public market data websocket (odds/book), NOT global user trades. :contentReference[oaicite:11]{index=11}
  const ws = new ClobWsClient(CONFIG.clobWssUrl);
  ws.start();

  if (argv.has("--test-webhook")) {
    await postDiscord(CONFIG.discordWebhookUrl, {
      criteriaLabel: "TEST WEBHOOK",
      marketTitle: "Test market title",
      decisionDisplay: "YES — by Jan 31, 2026",
      traderAlias: "acct_test",
      walletShort: "0x1234…abcd",
      side: "BUY",
      shares: 82421,
      currentPrice: 0.073,
      notional: 6000,
      uniqueMarketsUMT: 4,
      winRateDisplay: "n/a",
      iconUrl: "https://via.placeholder.com/256",
      imageUrl: "https://via.placeholder.com/1024x512",
      footerText: "Polymarket watcher • test"
    });
    console.log("✅ Test webhook sent.");
    return;
  }

  let lastSeenTs = st.trades.reduce((m, t) => Math.max(m, t.ts), 0);
  console.log("✅ Watcher running. lastSeenTs =", lastSeenTs);

  while (true) {
    try {
      // 1) Ingest trades from PUBLIC Data API /trades (global) :contentReference[oaicite:12]{index=12}
      const raw = await fetchTrades(CONFIG.dataApiBase, 200);
      console.log(`[poll] fetched ${raw.length} trades at ${new Date().toLocaleTimeString()}`);
      const trades = raw
        .map(normalizeTrade)
        .filter((t): t is NonNullable<typeof t> => !!t)
        .sort((a, b) => a.ts - b.ts);

      for (const t of trades) {
        if (t.ts <= lastSeenTs) continue;
        lastSeenTs = Math.max(lastSeenTs, t.ts);

        // de-dup by tradeId
        if (st.trades.some(x => x.tradeId === t.tradeId)) continue;

        // 2) Nominal minimum first (>= $1500)
        if (t.notional < CONFIG.minNominalUsd) continue;

        // wallet profile
        const walletProfile = ensureWallet(st, t.wallet);

        // 3) Fetch market meta (Gamma) (title/category/liquidity/tokenIds) :contentReference[oaicite:13]{index=13}
        const meta = await getOrFetchMarket(st, CONFIG.gammaApiBase, t.marketId);

        // Exclude Sports/Crypto timeframes categories (your request)
        if (isExcludedMarket(meta)) continue;

        // Subscribe to tokenIds for odds/book updates
        if (meta.clobTokenIds?.length) ws.subscribe(meta.clobTokenIds);

        // Map outcome -> tokenId for WSS state
        const tokenId = meta.clobTokenIds?.length
          ? (t.outcome.toUpperCase() === "NO" ? meta.clobTokenIds[1] : meta.clobTokenIds[0])
          : undefined;

        const wsState = tokenId ? ws.get(tokenId) : undefined;

        // 4) Liquidity gate (Gamma liquidity + WS book depth when available)
        if (!hasSufficientLiquidity(meta, wsState)) continue;

        // Store trade only after passing core market-level filters
        st.trades.push(t);

        // 5) Criterion detection (A and B)
        const A = evalCriterionA(st, t);
        const B = evalCriterionB(st, t);

        const passed = A.triggered || B.triggered;
        if (!passed) continue;

        // Smart dedupe A (only if A triggered)
        if (A.triggered) {
          const ok = shouldSendA(st, t.marketId, A.umtCount30m, t.notional);
          if (!ok && !B.triggered) continue; // if only A and it’s suppressed, skip
        }

        // 6) Enrichment (positions -> winrate -> odds)
        // Positions are optional for your display; winrate computed from closed positions
        // Data API positions & closed-positions are public. :contentReference[oaicite:14]{index=14}
        const [positions, closed] = await Promise.all([
          fetchUserPositions(CONFIG.dataApiBase, t.wallet),
          fetchClosedPositions(CONFIG.dataApiBase, t.wallet, 50)
        ]);

        const { winRate, sample } = calcWinRateFromClosedPositions(closed);
        const winRateDisplay = winRate == null ? "n/a" : `${(winRate * 100).toFixed(1)}% (n=${sample})`;

        // Unique markets UMT count for that wallet (as defined)
        const umtMarkets = new Set<string>();
        for (const x of st.trades) {
          if (x.wallet === t.wallet && isUMT(st, x)) umtMarkets.add(x.marketId);
        }

        // Market odds: prefer WSS best bid/ask mid or lastTradePrice, fallback to trade price
        const currentPrice =
          (wsState?.bestBid != null && wsState?.bestAsk != null)
            ? (wsState.bestBid + wsState.bestAsk) / 2
            : (wsState?.lastTradePrice ?? t.price);

        const byDate = parseByDateFromTitle(meta.title);
        const decisionDisplay = byDate ? `${t.outcome} — by ${byDate}` : t.outcome;

        // 7) Send Discord
        const criteriaLabel =
          A.triggered && B.triggered
            ? `A+B: Low-Vol Pressure + Fresh/Low-Activity Big Capital`
            : A.triggered
              ? `A: Low-Volume Market Pressure`
              : `B: Fresh/Low-Activity + Big Capital (Tier ${B.triggered ? B.tier : "?"})`;

        await postDiscord(CONFIG.discordWebhookUrl, {
          criteriaLabel,
          marketTitle: meta.title,
          decisionDisplay,

          traderAlias: walletProfile.alias,
          walletShort: abbrevWallet(t.wallet),

          side: t.side,
          shares: t.shares,
          currentPrice,
          notional: t.notional,

          uniqueMarketsUMT: umtMarkets.size,
          winRateDisplay,

          iconUrl: meta.iconUrl,
          imageUrl: meta.imageUrl,

          footerText: `Polymarket watcher • ${new Date(nowSec() * 1000).toLocaleString()}`
        });

        // (Optional) you can store positions snapshot if you want later analysis:
        void positions;
      }

      pruneTrades(st, 35);
      await saveState(CONFIG.statePath, st);
    } catch (e: any) {
      console.error("Loop error:", e?.message ?? e);
    }

    await sleep(CONFIG.pollIntervalMs);
  }
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }
main().catch(err => { console.error(err); process.exit(1); });
