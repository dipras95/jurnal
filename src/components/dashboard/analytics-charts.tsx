"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Legend,
} from "recharts";

type CurvePoint = {
  date: string;
  balance: number;
  drawdown: number;
};

type Breakdown = {
  name: string;
  pnl: number;
  trades: number;
};

export function AnalyticsCharts({
  curve,
  strategy,
  pair,
  timeframe,
}: {
  curve: CurvePoint[];
  strategy: Breakdown[];
  pair: Breakdown[];
  timeframe: Breakdown[];
}) {
  return (
    <div className="space-y-6">
      <div className="h-80 rounded-lg border border-zinc-800 bg-zinc-900 p-4">
        <p className="mb-3 text-sm font-medium text-zinc-200">Equity & Drawdown Curve</p>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={curve}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis dataKey="date" tick={{ fill: "#a1a1aa", fontSize: 12 }} />
            <YAxis yAxisId="left" tick={{ fill: "#a1a1aa", fontSize: 12 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fill: "#a1a1aa", fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="balance" stroke="#34d399" dot={false} strokeWidth={2} name="Balance" />
            <Line yAxisId="right" type="monotone" dataKey="drawdown" stroke="#f87171" dot={false} strokeWidth={2} name="Drawdown %" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {[
          { title: "By Strategy", data: strategy },
          { title: "By Pair", data: pair },
          { title: "By Timeframe", data: timeframe },
        ].map((item) => (
          <div key={item.title} className="h-72 rounded-lg border border-zinc-800 bg-zinc-900 p-4">
            <p className="mb-3 text-sm font-medium text-zinc-200">{item.title}</p>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={item.data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="name" tick={{ fill: "#a1a1aa", fontSize: 11 }} />
                <YAxis tick={{ fill: "#a1a1aa", fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="pnl" fill="#60a5fa" name="Total PnL" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ))}
      </div>
    </div>
  );
}
