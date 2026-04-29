"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnalyticsCharts } from "@/components/dashboard/analytics-charts";

type Trade = {
  id: number;
  date: string;
  pair: string;
  strategy: string;
  timeframe: string;
  status: string;
  pnlDollar: number;
  balance: number;
  drawdownPct: number;
};

function makeBreakdown(trades: Trade[], key: "strategy" | "pair" | "timeframe") {
  const map = new Map<string, { pnl: number; trades: number }>();
  for (const t of trades) {
    const name = t[key] || "Unknown";
    const prev = map.get(name) ?? { pnl: 0, trades: 0 };
    map.set(name, { pnl: prev.pnl + t.pnlDollar, trades: prev.trades + 1 });
  }
  return [...map.entries()]
    .map(([name, value]) => ({ name, ...value }))
    .sort((a, b) => b.pnl - a.pnl)
    .slice(0, 8);
}

export function AnalyticsClient({ trades }: { trades: Trade[] }) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [strategy, setStrategy] = useState("all");
  const [pair, setPair] = useState("all");
  const [timeframe, setTimeframe] = useState("all");

  const strategyOptions = useMemo(() => [...new Set(trades.map((t) => t.strategy))], [trades]);
  const pairOptions = useMemo(() => [...new Set(trades.map((t) => t.pair))], [trades]);
  const timeframeOptions = useMemo(() => [...new Set(trades.map((t) => t.timeframe))], [trades]);

  const filtered = useMemo(() => {
    return trades.filter((t) => {
      const d = t.date.slice(0, 10);
      if (from && d < from) return false;
      if (to && d > to) return false;
      if (strategy !== "all" && t.strategy !== strategy) return false;
      if (pair !== "all" && t.pair !== pair) return false;
      if (timeframe !== "all" && t.timeframe !== timeframe) return false;
      return true;
    });
  }, [from, to, strategy, pair, timeframe, trades]);

  const totalPnl = filtered.reduce((acc, t) => acc + t.pnlDollar, 0);
  const winRate = filtered.length ? (filtered.filter((t) => t.pnlDollar > 0).length / filtered.length) * 100 : 0;

  const monthly = new Map<string, number>();
  for (const t of filtered) {
    const m = t.date.slice(0, 7);
    monthly.set(m, (monthly.get(m) ?? 0) + t.pnlDollar);
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-5">
        <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        <Select value={strategy} onValueChange={(v) => setStrategy(v ?? "all")}><SelectTrigger><SelectValue placeholder="Strategy" /></SelectTrigger><SelectContent><SelectItem value="all">All Strategy</SelectItem>{strategyOptions.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
        <Select value={pair} onValueChange={(v) => setPair(v ?? "all")}><SelectTrigger><SelectValue placeholder="Pair" /></SelectTrigger><SelectContent><SelectItem value="all">All Pair</SelectItem>{pairOptions.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
        <Select value={timeframe} onValueChange={(v) => setTimeframe(v ?? "all")}><SelectTrigger><SelectValue placeholder="Timeframe" /></SelectTrigger><SelectContent><SelectItem value="all">All Timeframe</SelectItem>{timeframeOptions.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="border-zinc-800 bg-zinc-900"><CardHeader><CardTitle className="text-sm">Filtered Trades</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{filtered.length}</p></CardContent></Card>
        <Card className="border-zinc-800 bg-zinc-900"><CardHeader><CardTitle className="text-sm">Filtered Total PnL</CardTitle></CardHeader><CardContent><p className={`text-2xl font-bold ${totalPnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{totalPnl.toFixed(2)}</p></CardContent></Card>
        <Card className="border-zinc-800 bg-zinc-900"><CardHeader><CardTitle className="text-sm">Filtered Win Rate</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{winRate.toFixed(2)}%</p></CardContent></Card>
      </div>

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
            {Object.entries(filtered.reduce<Record<string, number>>((a, t) => ({ ...a, [t.status]: (a[t.status] ?? 0) + 1 }), {})).map(([k, v]) => (
              <div key={k} className="mb-2 flex justify-between rounded bg-zinc-800 px-3 py-2 text-sm"><span>{k}</span><span>{v}</span></div>
            ))}
          </CardContent>
        </Card>
      </div>

      <AnalyticsCharts
        curve={filtered.map((t) => ({ date: t.date.slice(0, 10), balance: t.balance, drawdown: t.drawdownPct }))}
        strategy={makeBreakdown(filtered, "strategy")}
        pair={makeBreakdown(filtered, "pair")}
        timeframe={makeBreakdown(filtered, "timeframe")}
      />
    </div>
  );
}
