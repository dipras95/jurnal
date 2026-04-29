import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trade } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  let trades: Trade[] = [];
  try {
    trades = await prisma.trade.findMany({ orderBy: { date: "asc" } });
  } catch {
    trades = [];
  }
  const monthly = new Map<string, number>();
  for (const t of trades) {
    const m = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, "0")}`;
    monthly.set(m, (monthly.get(m) ?? 0) + t.pnlDollar);
  }

  return (
    <AppShell>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader><CardTitle>PnL by Month</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              {[...monthly.entries()].map(([m, v]) => (
                <div key={m} className="flex justify-between rounded bg-zinc-800 px-3 py-2">
                  <span>{m}</span><span className={v >= 0 ? "text-emerald-400" : "text-rose-400"}>{v.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader><CardTitle>Status Breakdown</CardTitle></CardHeader>
          <CardContent>
            {Object.entries(trades.reduce<Record<string, number>>((a, t) => ({ ...a, [t.status]: (a[t.status] ?? 0) + 1 }), {})).map(([k, v]) => (
              <div key={k} className="mb-2 flex justify-between rounded bg-zinc-800 px-3 py-2 text-sm"><span>{k}</span><span>{v}</span></div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
