import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { authCookieName, getUserFromToken } from "@/lib/auth";
import { assertGroupAccess } from "@/lib/services/authorization.service";
import { getBalanceSummary } from "@/lib/services/balance.service";

export const dynamic = "force-dynamic";

export default async function BalancePage({ params }) {
  const cookieStore = await cookies();
  const user = getUserFromToken(cookieStore.get(authCookieName)?.value);
  if (!user) {
    redirect("/login");
  }

  const groupId = (await params).groupId;
  await assertGroupAccess(user.id, groupId);
  const balances = await getBalanceSummary(groupId);

  return (
    <AppShell>
      <h1 className="mb-6 text-2xl font-semibold">Balances</h1>
      <div className="grid gap-4 md:grid-cols-2">
        {balances.summary.map((item) => (
          <Card key={item.user.id}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{item.user.name}</h2>
              <Badge>{item.netBalance >= 0 ? "gets back" : "owes"} INR {Math.abs(item.netBalance)}</Badge>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-muted-foreground">Paid</dt><dd>INR {item.paid}</dd></div>
              <div><dt className="text-muted-foreground">Owed</dt><dd>INR {item.owed}</dd></div>
            </dl>
            <details className="mt-4 text-sm">
              <summary className="cursor-pointer font-medium text-primary">Drill down</summary>
              <ul className="mt-2 space-y-1 text-muted-foreground">
                {item.drilldown.map((expense) => (
                  <li key={`${item.user.id}-${expense.id}`}>{expense.description} - INR {String(expense.amountInInr)}</li>
                ))}
              </ul>
            </details>
          </Card>
        ))}
      </div>
      <Card className="mt-4">
        <h2 className="mb-3 text-lg font-semibold">Simplified Debts</h2>
        <div className="space-y-2 text-sm">
          {balances.simplifiedDebts.map((debt) => (
            <p key={`${debt.from.id}-${debt.to.id}-${debt.amount}`}>
              {debt.from.name} pays {debt.to.name}: INR {debt.amount}
            </p>
          ))}
          {!balances.simplifiedDebts.length ? <p className="text-muted-foreground">Everyone is settled.</p> : null}
        </div>
      </Card>
    </AppShell>
  );
}
