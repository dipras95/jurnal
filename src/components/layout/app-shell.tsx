"use client";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const menus = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/journal", label: "Journal" },
  { href: "/analytics", label: "Analytics" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800 px-8 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <h1 className="text-lg font-semibold">Jurnal Trading Pribadi</h1>
          <div className="flex items-center gap-2">
            {menus.map((m) => (
              <Link key={m.href} href={m.href} className={`rounded-md px-3 py-2 text-sm ${pathname.startsWith(m.href) ? "bg-zinc-800" : "text-zinc-400 hover:text-zinc-100"}`}>
                {m.label}
              </Link>
            ))}
            <Button variant="secondary" onClick={logout}>Logout</Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-8 py-6">{children}</main>
    </div>
  );
}
