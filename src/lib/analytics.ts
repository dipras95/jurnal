import { Trade } from "@prisma/client";

export function toNum(v: unknown): number {
  if (typeof v === "number") return v;
  const n = Number(String(v ?? "").replace(/[$,%\s,]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

export function computeKpis(trades: Trade[]) {
  if (!trades.length) {
    return {
      currentBalance: 0,
      startingBalance: 0,
      totalTrades: 0,
      winRate: 0,
      totalPnl: 0,
      avgPnl: 0,
      profitFactor: 0,
      maxDrawdown: 0,
      bestTrade: 0,
      worstTrade: 0,
      avgRrActual: 0,
    };
  }

  const totalTrades = trades.length;
  const totalPnl = trades.reduce((a, t) => a + t.pnlDollar, 0);
  const wins = trades.filter((t) => t.pnlDollar > 0);
  const losses = trades.filter((t) => t.pnlDollar < 0);
  const grossProfit = wins.reduce((a, t) => a + t.pnlDollar, 0);
  const grossLoss = Math.abs(losses.reduce((a, t) => a + t.pnlDollar, 0));

  const sorted = [...trades].sort((a, b) => a.date.getTime() - b.date.getTime());

  return {
    currentBalance: sorted[sorted.length - 1]?.balance ?? 0,
    startingBalance: sorted[0]?.balance ?? 0,
    totalTrades,
    winRate: (wins.length / totalTrades) * 100,
    totalPnl,
    avgPnl: totalPnl / totalTrades,
    profitFactor: grossLoss === 0 ? grossProfit : grossProfit / grossLoss,
    maxDrawdown: Math.max(...trades.map((t) => t.drawdownPct)),
    bestTrade: Math.max(...trades.map((t) => t.pnlDollar)),
    worstTrade: Math.min(...trades.map((t) => t.pnlDollar)),
    avgRrActual: trades.reduce((a, t) => a + t.rrActual, 0) / totalTrades,
  };
}
