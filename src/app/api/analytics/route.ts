import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeKpis } from "@/lib/analytics";

export async function GET() {
  const trades = await prisma.trade.findMany();
  return NextResponse.json(computeKpis(trades));
}
