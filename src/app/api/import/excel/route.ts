import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";
import { toNum } from "@/lib/analytics";
import { getSession } from "@/lib/auth";

const MAX_FILE_BYTES = 5 * 1024 * 1024;

export async function POST(req: Request) {
  if (!(await getSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });
  if (file.size > MAX_FILE_BYTES) return NextResponse.json({ error: "File too large (max 5 MB)" }, { status: 413 });

  const bytes = await file.arrayBuffer();
  const workbook = XLSX.read(bytes, { type: "array" });
  const firstSheet = workbook.SheetNames[0];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[firstSheet], { defval: "" });

  const payload = rows.map((r) => ({
    date: new Date(String(r["Date"])),
    pair: String(r["Pair"] ?? ""),
    position: String(r["Position"] ?? ""),
    strategy: String(r["Strategy"] ?? ""),
    timeframe: String(r["Timeframe"] ?? ""),
    leverage: toNum(r["Leverage"]),
    entry: toNum(r["Entry"]),
    sl: toNum(r["SL"]),
    tp: toNum(r["TP"]),
    exit: toNum(r["Exit"]),
    linkBefore: String(r["Link Before"] || "") || null,
    linkAfter: String(r["Link After"] || "") || null,
    notes: String(r["Notes"] || "") || null,
    riskDollar: toNum(r["Risk $"]),
    slDistPct: toNum(r["SL Dist %"]),
    posSizeDollar: toNum(r["Pos Size $"]),
    rrPlan: toNum(r["R:R Plan"]),
    marginDollar: toNum(r["Margin $"]),
    status: String(r["Status"] ?? ""),
    pnlDollar: toNum(r["PnL $"]),
    rrActual: toNum(r["R:R Actual"]),
    balance: toNum(r["Balance"]),
    drawdownPct: toNum(r["Drawdown %"]),
  }));

  await prisma.trade.createMany({ data: payload });
  return NextResponse.json({ imported: payload.length });
}
