import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { tradeSchema } from "@/types/trade";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.toLowerCase() ?? "";
  const status = searchParams.get("status") ?? "";
  const strategy = searchParams.get("strategy") ?? "";
  const sortBy = searchParams.get("sortBy") ?? "date";
  const sortDir = searchParams.get("sortDir") === "asc" ? "asc" : "desc";
  const page = Number(searchParams.get("page") ?? "1");
  const pageSize = Number(searchParams.get("pageSize") ?? "10");

  const where = {
    AND: [
      q
        ? {
            OR: [
              { pair: { contains: q } },
              { strategy: { contains: q } },
              { notes: { contains: q } },
            ],
          }
        : {},
      status ? { status } : {},
      strategy ? { strategy } : {},
    ],
  };

  const total = await prisma.trade.count({ where });
  const data = await prisma.trade.findMany({
    where,
    orderBy: { [sortBy]: sortDir },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  return NextResponse.json({ data, total, page, pageSize });
}

export async function POST(req: Request) {
  const parsed = tradeSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const data = parsed.data;
  const created = await prisma.trade.create({
    data: {
      ...data,
      date: new Date(data.date),
      linkBefore: data.linkBefore ?? null,
      linkAfter: data.linkAfter ?? null,
      notes: data.notes ?? null,
    },
  });

  return NextResponse.json(created);
}
