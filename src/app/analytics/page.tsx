import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/app-shell";
import { Trade } from "@prisma/client";
import { AnalyticsClient } from "@/components/dashboard/analytics-client";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  let trades: Trade[] = [];
  try {
    trades = await prisma.trade.findMany({ orderBy: { date: "asc" } });
  } catch {
    trades = [];
  }

  return (
    <AppShell>
      <AnalyticsClient
        trades={trades.map((t) => ({
          id: t.id,
          date: t.date.toISOString(),
          pair: t.pair,
          strategy: t.strategy,
          timeframe: t.timeframe,
          status: t.status,
          pnlDollar: t.pnlDollar,
          balance: t.balance,
          drawdownPct: t.drawdownPct,
        }))}
      />
    </AppShell>
  );
}
