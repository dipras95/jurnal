import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { tradeSchema } from "@/types/trade";

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const trade = await prisma.trade.findUnique({ where: { id: Number(id) } });
  if (!trade) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(trade);
}

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const parsed = tradeSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const data = parsed.data;
  const updated = await prisma.trade.update({
    where: { id: Number(id) },
    data: {
      ...data,
      date: new Date(data.date),
      linkBefore: data.linkBefore ?? null,
      linkAfter: data.linkAfter ?? null,
      notes: data.notes ?? null,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  await prisma.trade.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
