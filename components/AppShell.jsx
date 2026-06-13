import Link from "next/link";

export function AppShell({ children }) {
  return (
    <main className="min-h-screen bg-slate-50">
      <nav className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/dashboard" className="text-base font-semibold">
            Shared Expenses
          </Link>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/import">Import</Link>
          </div>
        </div>
      </nav>
      <div className="mx-auto max-w-6xl px-4 py-6">{children}</div>
    </main>
  );
}

