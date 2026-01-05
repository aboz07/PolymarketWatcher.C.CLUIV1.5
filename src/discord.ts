import axios from "axios";
import { fmtCents, fmtUsd } from "./util";

export type DiscordAlert = {
  criteriaLabel: string;
  marketTitle: string;
  decisionDisplay: string;

  traderAlias: string;
  walletShort: string;

  side: "BUY" | "SELL";
  shares: number;
  currentPrice: number;
  notional: number;

  uniqueMarketsUMT: number;
  winRateDisplay: string;

  iconUrl?: string;
  imageUrl?: string;

  footerText: string;
};

export async function postDiscord(webhookUrl: string, a: DiscordAlert) {
  const payload = {
    username: "Polymarket Watch",
    embeds: [{
      title: `🍃 ${a.criteriaLabel}`,
      description: `**${a.marketTitle}**\nOutcome: **${a.decisionDisplay}**`,
      thumbnail: a.iconUrl ? { url: a.iconUrl } : undefined,
      fields: [
        { name: "Trader", value: `${a.traderAlias} (${a.walletShort})`, inline: true },
        { name: "Side", value: `**${a.side}**`, inline: true },
        { name: "Trade", value: `${Math.round(a.shares).toLocaleString()} shares @ **${fmtCents(a.currentPrice)}**`, inline: true },

        { name: "Notional", value: fmtUsd(a.notional), inline: true },
        { name: "Unique markets (UMT)", value: String(a.uniqueMarketsUMT), inline: true },
        { name: "Win Rate (closed)", value: a.winRateDisplay, inline: true }
      ],
      image: a.imageUrl ? { url: a.imageUrl } : undefined,
      footer: { text: a.footerText }
    }]
  };

  await axios.post(webhookUrl, payload, { timeout: 15000 });
}
	