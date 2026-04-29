import { z } from "zod";

export const tradeSchema = z.object({
  date: z.string(),
  pair: z.string().min(1),
  position: z.string().min(1),
  strategy: z.string().min(1),
  timeframe: z.string().min(1),
  leverage: z.coerce.number(),
  entry: z.coerce.number(),
  sl: z.coerce.number(),
  tp: z.coerce.number(),
  exit: z.coerce.number(),
  linkBefore: z.string().optional().nullable(),
  linkAfter: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  riskDollar: z.coerce.number(),
  slDistPct: z.coerce.number(),
  posSizeDollar: z.coerce.number(),
  rrPlan: z.coerce.number(),
  marginDollar: z.coerce.number(),
  status: z.string().min(1),
  pnlDollar: z.coerce.number(),
  rrActual: z.coerce.number(),
  balance: z.coerce.number(),
  drawdownPct: z.coerce.number(),
});

export type TradeInput = z.infer<typeof tradeSchema>;
