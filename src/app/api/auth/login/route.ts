import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { setSessionCookie, signSession } from "@/lib/auth";

export async function POST(req: Request) {
  const body = await req.json();
  const { username, password } = body as { username?: string; password?: string };
  if (!username || !password) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

  const token = signSession({ username: user.username });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(setSessionCookie(token));
  return res;
}
