"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

type Trade = {
  id: number;
  date: string;
  pair: string;
  strategy: string;
  status: string;
  pnlDollar: number;
  rrActual: number;
  balance: number;
  position: string;
  timeframe: string;
  leverage: number;
  entry: number;
  sl: number;
  tp: number;
  exit: number;
  linkBefore?: string | null;
  linkAfter?: string | null;
  notes?: string | null;
  riskDollar: number;
  slDistPct: number;
  posSizeDollar: number;
  rrPlan: number;
  marginDollar: number;
  drawdownPct: number;
};

const empty = {
  date: "",
  pair: "",
  position: "Long",
  strategy: "",
  timeframe: "",
  leverage: 1,
  entry: 0,
  sl: 0,
  tp: 0,
  exit: 0,
  linkBefore: "",
  linkAfter: "",
  notes: "",
  riskDollar: 0,
  slDistPct: 0,
  posSizeDollar: 0,
  rrPlan: 0,
  marginDollar: 0,
  status: "Win",
  pnlDollar: 0,
  rrActual: 0,
  balance: 0,
  drawdownPct: 0,
};

type FormState = Record<string, string | number | null>;
type ErrorState = Partial<Record<keyof typeof empty, string>>;

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-zinc-400">{label}</Label>
      {children}
      {error && <p className="text-xs text-rose-400">{error}</p>}
    </div>
  );
}

const numKeys = new Set(["leverage", "entry", "sl", "tp", "exit", "riskDollar", "slDistPct", "posSizeDollar", "rrPlan", "marginDollar", "pnlDollar", "rrActual", "balance", "drawdownPct"]);

function toNumber(value: string | number | null) {
  if (typeof value === "number") return value;
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function deriveMetrics(form: FormState) {
  const entry = toNumber(form.entry);
  const sl = toNumber(form.sl);
  const tp = toNumber(form.tp);
  const exit = toNumber(form.exit);
  const leverage = Math.max(1, toNumber(form.leverage));
  const riskDollar = Math.max(0, toNumber(form.riskDollar));
  const posSize = Math.max(0, toNumber(form.posSizeDollar));
  const position = String(form.position ?? "Long");

  const slDistPct = entry === 0 ? 0 : (Math.abs(entry - sl) / entry) * 100;
  const rrPlan = entry === sl ? 0 : Math.abs(tp - entry) / Math.abs(entry - sl);
  const marginDollar = leverage <= 0 ? 0 : posSize / leverage;
  const movePct = entry === 0 ? 0 : ((exit - entry) / entry) * (position === "Short" ? -1 : 1);
  const pnlDollar = movePct * posSize * leverage;
  const rrActual = riskDollar > 0 ? pnlDollar / riskDollar : 0;

  return { slDistPct, rrPlan, marginDollar, pnlDollar, rrActual };
}

function validate(form: FormState) {
  const errors: ErrorState = {};
  if (!String(form.date ?? "").trim()) errors.date = "Date wajib diisi";
  if (!String(form.pair ?? "").trim()) errors.pair = "Pair wajib diisi";
  if (!String(form.strategy ?? "").trim()) errors.strategy = "Strategy wajib diisi";
  if (!String(form.timeframe ?? "").trim()) errors.timeframe = "Timeframe wajib diisi";

  if (toNumber(form.entry) <= 0) errors.entry = "Entry harus > 0";
  if (toNumber(form.sl) <= 0) errors.sl = "SL harus > 0";
  if (toNumber(form.tp) <= 0) errors.tp = "TP harus > 0";
  if (toNumber(form.exit) <= 0) errors.exit = "Exit harus > 0";
  if (toNumber(form.leverage) <= 0) errors.leverage = "Leverage harus > 0";

  return { ok: Object.keys(errors).length === 0, errors };
}

export default function JournalPage() {
  const [rows, setRows] = useState<Trade[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [strategy, setStrategy] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [form, setForm] = useState<FormState>(empty);
  const [editId, setEditId] = useState<number | null>(null);
  const [errors, setErrors] = useState<ErrorState>({});
  const [open, setOpen] = useState(false);
  const [formMode, setFormMode] = useState<"quick" | "advanced">("quick");
  const [autoCalc, setAutoCalc] = useState(true);
  const pageSize = 10;

  const fetchData = useCallback(async () => {
    const res = await fetch(`/api/trades?q=${q}&status=${status}&strategy=${strategy}&sortBy=${sortBy}&sortDir=${sortDir}&page=${page}&pageSize=${pageSize}`);
    const json = await res.json();
    setRows(json.data);
    setTotal(json.total);
  }, [page, q, sortBy, sortDir, status, strategy]);

  const derived = useMemo(() => deriveMetrics(form), [form]);

  const applyDerived = useCallback((next: FormState) => {
    const calc = deriveMetrics(next);
    return {
      ...next,
      slDistPct: Number(calc.slDistPct.toFixed(4)),
      rrPlan: Number(calc.rrPlan.toFixed(4)),
      marginDollar: Number(calc.marginDollar.toFixed(4)),
      pnlDollar: Number(calc.pnlDollar.toFixed(4)),
      rrActual: Number(calc.rrActual.toFixed(4)),
    };
  }, []);

  const updateForm = useCallback((patch: Partial<FormState>) => {
    setForm((prev) => {
      const next = { ...prev, ...patch } as FormState;
      return autoCalc ? applyDerived(next) : next;
    });
  }, [applyDerived, autoCalc]);

  const hydrateForSubmit = useCallback(() => {
    const payload: Record<string, unknown> = { ...form };
    for (const [key, value] of Object.entries(payload)) {
      if (numKeys.has(key)) payload[key] = toNumber(value as string | number | null);
      if (typeof value === "string") payload[key] = value.trim();
    }
    return payload;
  }, [form]);

  const save = useCallback(async () => {
    const result = validate(form);
    setErrors(result.errors);
    if (!result.ok) return toast.error("Masih ada field yang belum valid");

    const method = editId ? "PUT" : "POST";
    const url = editId ? `/api/trades/${editId}` : "/api/trades";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(hydrateForSubmit()) });
    if (!res.ok) return toast.error("Gagal simpan trade");

    toast.success(editId ? "Trade berhasil diupdate" : "Trade berhasil ditambah");
    setForm(empty);
    setEditId(null);
    setErrors({});
    setOpen(false);
    fetchData();
  }, [editId, fetchData, form, hydrateForSubmit]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => { fetchData(); }, [fetchData]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void save();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, save]);

  const del = async (id: number) => {
    if (!window.confirm("Yakin ingin hapus trade ini?")) return;
    await fetch(`/api/trades/${id}`, { method: "DELETE" });
    toast.success("Trade dihapus");
    fetchData();
  };

  const importExcel = async (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/import/excel", { method: "POST", body: fd });
    const json = await res.json();
    toast.success(`Imported ${json.imported} rows`);
    fetchData();
  };

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total]);

  return (
    <AppShell>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Input placeholder="Search pair/strategy/notes" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm" />
          <Select value={status || "all"} onValueChange={(v) => setStatus((v ?? "") === "all" ? "" : (v ?? ""))}><SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="Win">Win</SelectItem><SelectItem value="Loss">Loss</SelectItem><SelectItem value="BE">BE</SelectItem></SelectContent></Select>
          <Input placeholder="Strategy" value={strategy} onChange={(e) => setStrategy(e.target.value)} className="w-44" />
          <Select value={sortBy} onValueChange={(v) => setSortBy(v ?? "date")}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="date">Sort: Date</SelectItem><SelectItem value="pnlDollar">Sort: PnL</SelectItem><SelectItem value="balance">Sort: Balance</SelectItem></SelectContent></Select>
          <Select value={sortDir} onValueChange={(v) => setSortDir(v ?? "desc")}><SelectTrigger className="w-32"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="desc">Desc</SelectItem><SelectItem value="asc">Asc</SelectItem></SelectContent></Select>
          <Input type="file" accept=".xlsx,.xls" onChange={(e) => e.target.files?.[0] && importExcel(e.target.files[0])} className="max-w-xs" />

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger>
              <Button onClick={() => { setEditId(null); setErrors({}); setForm(empty); setFormMode("quick"); setAutoCalc(true); }}>Tambah Trade</Button>
            </DialogTrigger>
            <DialogContent className="max-h-[88vh] max-w-5xl overflow-y-auto border-zinc-800 bg-zinc-900">
              <DialogHeader><DialogTitle>{editId ? "Edit Trade" : "Tambah Trade"}</DialogTitle></DialogHeader>
              <div className="flex items-center justify-between rounded-md border border-zinc-800 bg-zinc-950 p-2">
                <Tabs value={formMode} onValueChange={(v) => setFormMode((v as "quick" | "advanced") ?? "quick")}><TabsList><TabsTrigger value="quick">Quick Entry</TabsTrigger><TabsTrigger value="advanced">Advanced</TabsTrigger></TabsList></Tabs>
                <div className="flex items-center gap-2"><Button type="button" size="sm" variant={autoCalc ? "default" : "secondary"} onClick={() => setAutoCalc((v) => !v)}>{autoCalc ? "Auto Calc: ON" : "Auto Calc: OFF"}</Button><div className="flex items-center gap-2 text-xs text-zinc-400"><span>Shortcut simpan:</span><kbd className="rounded bg-zinc-800 px-2 py-1">Ctrl/Cmd + S</kbd></div></div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-3 rounded-lg border border-zinc-800 p-3">
                  <p className="text-sm font-medium text-zinc-200">Setup</p>
                  <Field label="Date" error={errors.date}><Input type="date" value={String(form.date ?? "")} onChange={(e) => updateForm({ date: e.target.value })} /></Field>
                  <Field label="Pair" error={errors.pair}><Input placeholder="BTCUSDT" value={String(form.pair ?? "")} onChange={(e) => updateForm({ pair: e.target.value })} /></Field>
                  <Field label="Position"><Select value={String(form.position ?? "Long")} onValueChange={(v) => updateForm({ position: v ?? "Long" })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Long">Long</SelectItem><SelectItem value="Short">Short</SelectItem></SelectContent></Select></Field>
                  <Field label="Strategy" error={errors.strategy}><Input value={String(form.strategy ?? "")} onChange={(e) => updateForm({ strategy: e.target.value })} /></Field>
                  <Field label="Timeframe" error={errors.timeframe}><Input placeholder="15m, 1h, 4h" value={String(form.timeframe ?? "")} onChange={(e) => updateForm({ timeframe: e.target.value })} /></Field>
                  <Field label="Leverage" error={errors.leverage}><Input type="number" step="0.01" value={String(form.leverage ?? 1)} onChange={(e) => updateForm({ leverage: e.target.value })} /></Field>
                </div>

                <div className="space-y-3 rounded-lg border border-zinc-800 p-3">
                  <p className="text-sm font-medium text-zinc-200">Price Levels</p>
                  <Field label="Entry" error={errors.entry}><Input type="number" step="0.0001" value={String(form.entry ?? 0)} onChange={(e) => updateForm({ entry: e.target.value })} /></Field>
                  <Field label="SL" error={errors.sl}><Input type="number" step="0.0001" value={String(form.sl ?? 0)} onChange={(e) => updateForm({ sl: e.target.value })} /></Field>
                  <Field label="TP" error={errors.tp}><Input type="number" step="0.0001" value={String(form.tp ?? 0)} onChange={(e) => updateForm({ tp: e.target.value })} /></Field>
                  <Field label="Exit" error={errors.exit}><Input type="number" step="0.0001" value={String(form.exit ?? 0)} onChange={(e) => updateForm({ exit: e.target.value })} /></Field>
                </div>

                <div className="space-y-3 rounded-lg border border-zinc-800 p-3">
                  <p className="text-sm font-medium text-zinc-200">Risk & Size</p>
                  <Field label="Risk $"><Input type="number" step="0.01" value={String(form.riskDollar ?? 0)} onChange={(e) => updateForm({ riskDollar: e.target.value })} /></Field>
                  <Field label="Pos Size $"><Input type="number" step="0.01" value={String(form.posSizeDollar ?? 0)} onChange={(e) => updateForm({ posSizeDollar: e.target.value })} /></Field>
                  {formMode === "advanced" && <><Field label="SL Dist %"><Input disabled={autoCalc} type="number" step="0.01" value={String(form.slDistPct ?? 0)} onChange={(e) => updateForm({ slDistPct: e.target.value })} /></Field><Field label="R:R Plan"><Input disabled={autoCalc} type="number" step="0.01" value={String(form.rrPlan ?? 0)} onChange={(e) => updateForm({ rrPlan: e.target.value })} /></Field><Field label="Margin $"><Input disabled={autoCalc} type="number" step="0.01" value={String(form.marginDollar ?? 0)} onChange={(e) => updateForm({ marginDollar: e.target.value })} /></Field></>}
                </div>

                <div className="space-y-3 rounded-lg border border-zinc-800 p-3">
                  <p className="text-sm font-medium text-zinc-200">Result</p>
                  <Field label="Status"><Select value={String(form.status ?? "Win")} onValueChange={(v) => updateForm({ status: v ?? "Win" })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Win">Win</SelectItem><SelectItem value="Loss">Loss</SelectItem><SelectItem value="BE">BE</SelectItem></SelectContent></Select></Field>
                  <Field label="Balance"><Input type="number" step="0.01" value={String(form.balance ?? 0)} onChange={(e) => updateForm({ balance: e.target.value })} /></Field>
                  {formMode === "advanced" && <><Field label="PnL $"><Input disabled={autoCalc} type="number" step="0.01" value={String(form.pnlDollar ?? 0)} onChange={(e) => updateForm({ pnlDollar: e.target.value })} /></Field><Field label="R:R Actual"><Input disabled={autoCalc} type="number" step="0.01" value={String(form.rrActual ?? 0)} onChange={(e) => updateForm({ rrActual: e.target.value })} /></Field><Field label="Drawdown %"><Input type="number" step="0.01" value={String(form.drawdownPct ?? 0)} onChange={(e) => updateForm({ drawdownPct: e.target.value })} /></Field></>}
                </div>

                {formMode === "advanced" && <div className="space-y-3 rounded-lg border border-zinc-800 p-3 md:col-span-2"><p className="text-sm font-medium text-zinc-200">Context</p><div className="grid grid-cols-1 gap-3 md:grid-cols-2"><Field label="Link Before"><Input value={String(form.linkBefore ?? "")} onChange={(e) => updateForm({ linkBefore: e.target.value })} placeholder="https://..." /></Field><Field label="Link After"><Input value={String(form.linkAfter ?? "")} onChange={(e) => updateForm({ linkAfter: e.target.value })} placeholder="https://..." /></Field></div><Field label="Notes"><Textarea value={String(form.notes ?? "")} onChange={(e) => updateForm({ notes: e.target.value })} placeholder="Catatan eksekusi, emosi, lesson learned..." /></Field></div>}
              </div>

              <div className="rounded-md border border-zinc-800 bg-zinc-950 p-3 text-sm text-zinc-300">
                <p className="mb-2 font-medium text-zinc-100">Auto-calc preview</p>
                <div className="grid grid-cols-2 gap-2 md:grid-cols-5"><div>SL Dist %: <span className="text-zinc-100">{derived.slDistPct.toFixed(2)}</span></div><div>R:R Plan: <span className="text-zinc-100">{derived.rrPlan.toFixed(2)}</span></div><div>Margin $: <span className="text-zinc-100">{derived.marginDollar.toFixed(2)}</span></div><div>PnL $: <span className={derived.pnlDollar >= 0 ? "text-emerald-400" : "text-rose-400"}>{derived.pnlDollar.toFixed(2)}</span></div><div>R:R Actual: <span className="text-zinc-100">{derived.rrActual.toFixed(2)}</span></div></div>
              </div>

              <div className="flex justify-end gap-2"><Button variant="secondary" disabled={autoCalc} onClick={() => setForm((s) => applyDerived(s))}>Apply Auto-calc</Button><Button variant="secondary" onClick={() => { setForm(empty); setEditId(null); setErrors({}); }}>Reset</Button><Button onClick={() => void save()}>Simpan Trade</Button></div>
            </DialogContent>
          </Dialog>
        </div>

        <Table>
          <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Pair</TableHead><TableHead>Status</TableHead><TableHead>PnL $</TableHead><TableHead>R:R</TableHead><TableHead>Balance</TableHead><TableHead /></TableRow></TableHeader>
          <TableBody>{rows.map((r) => <TableRow key={r.id}><TableCell>{new Date(r.date).toLocaleDateString()}</TableCell><TableCell>{r.pair}</TableCell><TableCell>{r.status}</TableCell><TableCell className={r.pnlDollar >= 0 ? "text-emerald-400" : "text-rose-400"}>{r.pnlDollar}</TableCell><TableCell>{r.rrActual}</TableCell><TableCell>{r.balance}</TableCell><TableCell className="space-x-2"><Button variant="secondary" size="sm" onClick={() => { setEditId(r.id); setErrors({}); setForm({ ...r, date: r.date.slice(0, 10) }); setFormMode("advanced"); setAutoCalc(false); setOpen(true); }}>Edit</Button><Sheet><SheetTrigger><Button size="sm" variant="outline">Detail</Button></SheetTrigger><SheetContent side="right" className="w-[560px] overflow-y-auto border-zinc-800 bg-zinc-900 sm:w-[560px]"><SheetHeader><SheetTitle>Trade Detail #{r.id}</SheetTitle></SheetHeader><div className="mt-4 grid grid-cols-2 gap-2 text-sm"><div><span className="text-zinc-400">Date:</span> {new Date(r.date).toLocaleDateString()}</div><div><span className="text-zinc-400">Pair:</span> {r.pair}</div><div><span className="text-zinc-400">Position:</span> {r.position}</div><div><span className="text-zinc-400">Strategy:</span> {r.strategy}</div><div><span className="text-zinc-400">Timeframe:</span> {r.timeframe}</div><div><span className="text-zinc-400">Leverage:</span> {r.leverage}</div><div><span className="text-zinc-400">Entry/SL/TP:</span> {r.entry} / {r.sl} / {r.tp}</div><div><span className="text-zinc-400">Exit:</span> {r.exit}</div><div><span className="text-zinc-400">Risk/PosSize:</span> ${r.riskDollar} / ${r.posSizeDollar}</div><div><span className="text-zinc-400">R:R Plan/Actual:</span> {r.rrPlan} / {r.rrActual}</div><div><span className="text-zinc-400">Status:</span> {r.status}</div><div><span className="text-zinc-400">PnL:</span> {r.pnlDollar}</div><div><span className="text-zinc-400">Balance:</span> {r.balance}</div><div><span className="text-zinc-400">Drawdown:</span> {r.drawdownPct}%</div><div className="col-span-2"><span className="text-zinc-400">Link Before:</span> {r.linkBefore || "-"}</div><div className="col-span-2"><span className="text-zinc-400">Link After:</span> {r.linkAfter || "-"}</div><div className="col-span-2"><span className="text-zinc-400">Notes:</span> {r.notes || "-"}</div></div></SheetContent></Sheet><Button size="sm" variant="destructive" onClick={() => void del(r.id)}>Delete</Button></TableCell></TableRow>)}</TableBody>
        </Table>

        <div className="flex items-center justify-between"><p className="text-sm text-zinc-400">Page {page} / {totalPages}</p><div className="space-x-2"><Button variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</Button><Button variant="secondary" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button></div></div>
      </div>
    </AppShell>
  );
}

