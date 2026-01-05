import { createServer, IncomingMessage, ServerResponse } from "http";
import { readFileSync } from "fs";
import { join } from "path";
import type { StoreState } from "../src/types";
import { loadState } from "../src/store";
import { CONFIG } from "../src/config";
import { getLogs } from "./logger";
import { startWatcher, stopWatcher, getWatcherStatus } from "./watcher-manager";

let currentState: StoreState | null = null;

export function setState(state: StoreState) {
  currentState = state;
}

export function startWebServer(port: number = 3000) {
  const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    const url = new URL(req.url || "/", `http://${req.headers.host}`);

    // CORS headers
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      res.writeHead(200);
      res.end();
      return;
    }

    // API endpoints
    if (url.pathname === "/api/state") {
      try {
        const state = currentState || await loadState(CONFIG.statePath);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(state));
      } catch (error: any) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: error.message }));
      }
      return;
    }

    if (url.pathname === "/api/config") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({
        pollIntervalMs: CONFIG.pollIntervalMs,
        minNominalUsd: CONFIG.minNominalUsd,
        filters: CONFIG.filters,
        criteriaA: CONFIG.A,
        criteriaB: CONFIG.B
      }));
      return;
    }

    if (url.pathname === "/api/stats") {
      try {
        const state = currentState || await loadState(CONFIG.statePath);
        const stats = {
          totalTrades: state.trades.length,
          totalWallets: Object.keys(state.wallets).length,
          totalMarkets: Object.keys(state.markets).length,
          totalAlerts: Object.keys(state.alertState).length,
          recentTrades: state.trades.slice(-10).reverse(),
          lastUpdate: state.trades.length > 0 
            ? Math.max(...state.trades.map(t => t.ts)) 
            : null
        };
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(stats));
      } catch (error: any) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: error.message }));
      }
      return;
    }

    if (url.pathname === "/api/logs") {
      try {
        const sinceParam = url.searchParams.get("since");
        const sinceId = sinceParam ? parseInt(sinceParam, 10) : 0;
        
        // Get logs since the specified ID
        const logData = getLogs(sinceId);
        
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(logData));
      } catch (error: any) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: error.message }));
      }
      return;
    }

    if (url.pathname === "/api/watcher/start") {
      try {
        const result = startWatcher();
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(result));
      } catch (error: any) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: false, message: error.message }));
      }
      return;
    }

    if (url.pathname === "/api/watcher/stop") {
      try {
        const result = stopWatcher();
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(result));
      } catch (error: any) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: false, message: error.message }));
      }
      return;
    }

    if (url.pathname === "/api/watcher/status") {
      try {
        const status = getWatcherStatus();
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(status));
      } catch (error: any) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: error.message }));
      }
      return;
    }

    // Serve static files
    // __dirname will be the compiled output directory, so we need to account for that
    // In Electron with tsx, __dirname points to the source directory
    const publicDir = join(__dirname, "public");
    
    if (url.pathname === "/" || url.pathname === "/index.html") {
      try {
        const html = readFileSync(join(publicDir, "index.html"), "utf8");
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(html);
      } catch (error: any) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("UI not found");
      }
      return;
    }

    if (url.pathname === "/style.css") {
      try {
        const css = readFileSync(join(publicDir, "style.css"), "utf8");
        res.writeHead(200, { "Content-Type": "text/css" });
        res.end(css);
      } catch (error: any) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("");
      }
      return;
    }

    if (url.pathname === "/app.js") {
      try {
        const js = readFileSync(join(publicDir, "app.js"), "utf8");
        res.writeHead(200, { "Content-Type": "application/javascript" });
        res.end(js);
      } catch (error: any) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("");
      }
      return;
    }

    // 404
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not found");
  });

  server.listen(port, () => {
    console.log(`✅ Desktop UI server running on port ${port}`);
  });

  return server;
}
