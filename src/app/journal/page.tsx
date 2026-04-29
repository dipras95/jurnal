"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

type Trade = { id: number; date: string; pair: string; strategy: string; status: string; pnlDollar: number; rrActual: number; balance: number; position: string; timeframe: string; leverage: number; entry: number; sl: number; tp: number; exit: number; linkBefore?: string | null; linkAfter?: string | null; notes?: string | null; riskDollar: number; slDistPct: number; posSizeDollar: number; rrPlan: number; marginDollar: number; drawdownPct: number; };

const empty = { date: "", pair: "", position: "Long", strategy: "", timeframe: "", leverage: 1, entry: 0, sl: 0, tp: 0, exit: 0, linkBefore: "", linkAfter: "", notes: "", riskDollar: 0, slDistPct: 0, posSizeDollar: 0, rrPlan: 0, marginDollar: 0, status: "Win", pnlDollar: 0, rrActual: 0, balance: 0, drawdownPct: 0 };

export default function JournalPage() {
  const [rows, setRows] = useState<Trade[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [strategy, setStrategy] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [form, setForm] = useState<Record<string, string | number | null>>(empty);
  const [editId, setEditId] = useState<number | null>(null);
  const pageSize = 10;

  const fetchData = useCallback(async () => {
    const res = await fetch(`/api/trades?q=${q}&status=${status}&strategy=${strategy}&sortBy=${sortBy}&sortDir=${sortDir}&page=${page}&pageSize=${pageSize}`);
    const json = await res.json();
    setRows(json.data);
    setTotal(json.total);
  }, [page, q, sortBy, sortDir, status, strategy]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchData(); }, [fetchData]);

  const save = async () => {
    const method = editId ? "PUT" : "POST";
    const url = editId ? `/api/trades/${editId}` : "/api/trades";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (!res.ok) return toast.error("Gagal simpan trade");
    toast.success("Trade tersimpan");
    setForm(empty);
    setEditId(null);
    fetchData();
  };

  const del = async (id: number) => {
    await fetch(`/api/trades/${id}`, { method: "DELETE" });
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

  return <AppShell>
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Input placeholder="Search pair/strategy/notes" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm" />
        <Select value={status || "all"} onValueChange={(v) => setStatus((v ?? "") === "all" ? "" : (v ?? ""))}><SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="Win">Win</SelectItem><SelectItem value="Loss">Loss</SelectItem><SelectItem value="BE">BE</SelectItem></SelectContent></Select>
        <Input placeholder="Strategy" value={strategy} onChange={(e) => setStrategy(e.target.value)} className="w-40" />
        <Select value={sortBy} onValueChange={(v) => setSortBy(v ?? "date")}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="date">Date</SelectItem><SelectItem value="pnlDollar">PnL</SelectItem><SelectItem value="balance">Balance</SelectItem></SelectContent></Select>
        <Select value={sortDir} onValueChange={(v) => setSortDir(v ?? "desc")}><SelectTrigger className="w-32"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="desc">Desc</SelectItem><SelectItem value="asc">Asc</SelectItem></SelectContent></Select>
        <Input type="file" accept=".xlsx,.xls" onChange={(e) => e.target.files?.[0] && importExcel(e.target.files[0])} className="max-w-xs" />
        <Dialog><DialogTrigger><Button>Tambah Trade</Button></DialogTrigger><DialogContent className="max-w-3xl"><DialogHeader><DialogTitle>{editId ? "Edit" : "Tambah"} Trade</DialogTitle></DialogHeader><div className="grid grid-cols-3 gap-2">{Object.keys(empty).map((k) => <Input key={k} placeholder={k} value={String(form[k] ?? "")} onChange={(e) => setForm((s) => ({ ...s, [k]: e.target.value }))} />)}</div><Button onClick={save}>Simpan</Button></DialogContent></Dialog>
      </div>

      <Table>
        <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Pair</TableHead><TableHead>Status</TableHead><TableHead>PnL $</TableHead><TableHead>R:R</TableHead><TableHead>Balance</TableHead><TableHead /></TableRow></TableHeader>
        <TableBody>{rows.map((r) => <TableRow key={r.id}><TableCell>{new Date(r.date).toLocaleDateString()}</TableCell><TableCell>{r.pair}</TableCell><TableCell>{r.status}</TableCell><TableCell className={r.pnlDollar >= 0 ? "text-emerald-400" : "text-rose-400"}>{r.pnlDollar}</TableCell><TableCell>{r.rrActual}</TableCell><TableCell>{r.balance}</TableCell><TableCell className="space-x-2"><Button variant="secondary" size="sm" onClick={() => { setEditId(r.id); setForm({ ...r, date: r.date.slice(0, 10) }); }}>Edit</Button><Dialog><DialogTrigger><Button size="sm" variant="outline">Detail</Button></DialogTrigger><DialogContent className="max-w-2xl"><pre className="text-xs whitespace-pre-wrap">{JSON.stringify(r, null, 2)}</pre></DialogContent></Dialog><Button size="sm" variant="destructive" onClick={() => del(r.id)}>Delete</Button></TableCell></TableRow>)}</TableBody>
      </Table>

      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-400">Page {page} / {totalPages}</p>
        <div className="space-x-2"><Button variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</Button><Button variant="secondary" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button></div>
      </div>
    </div>
  </AppShell>;
}
