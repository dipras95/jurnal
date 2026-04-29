import { prisma } from "@/lib/prisma";
import { computeKpis } from "@/lib/analytics";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trade } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  let trades: Trade[] = [];
  try {
    trades = await prisma.trade.findMany();
  } catch {
    trades = [];
  }
  const k = computeKpis(trades);
  const items = [
    ["Current Balance", k.currentBalance],
    ["Starting Balance", k.startingBalance],
    ["Total Trades", k.totalTrades],
    ["Win Rate", `${k.winRate.toFixed(2)}%`],
    ["Total PnL", k.totalPnl],
    ["Average PnL per Trade", k.avgPnl],
    ["Profit Factor", k.profitFactor.toFixed(2)],
    ["Max Drawdown", `${k.maxDrawdown.toFixed(2)}%`],
    ["Best Trade", k.bestTrade],
    ["Worst Trade", k.worstTrade],
    ["Average R:R Actual", k.avgRrActual.toFixed(2)],
  ];

  return (
    <AppShell>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {items.map(([label, value]) => (
          <Card key={String(label)} className="border-zinc-800 bg-zinc-900">
            <CardHeader><CardTitle className="text-sm text-zinc-400">{label}</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">{typeof value === "number" ? value.toLocaleString() : value}</p></CardContent>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
