import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { authCookieName, getUserFromToken } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import { CreateGroupForm } from "@/components/CreateGroupForm";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const user = getUserFromToken(cookieStore.get(authCookieName)?.value);
  if (!user) {
    redirect("/login");
  }

  const groups = await prisma.group.findMany({
    where: { members: { some: { userId: user.id } } },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true } } }
      },
      expenses: { where: { isDeleted: false } }
    },
    orderBy: { createdAt: "desc" }
  });

  return (
    <AppShell>
      <div className="mb-6 grid gap-4 lg:grid-cols-[1fr_360px]">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Start here: add a shared expense, import many expenses from CSV, then open balances to see who should pay whom.
          </p>
        </div>
        <Card className="bg-white">
          <h2 className="text-sm font-semibold">What to do next</h2>
          <ol className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><span className="font-medium text-foreground">1.</span> Click Add expense for one bill.</li>
            <li><span className="font-medium text-foreground">2.</span> Use Import CSV for bulk upload.</li>
            <li><span className="font-medium text-foreground">3.</span> Check Balances after adding expenses.</li>
          </ol>
        </Card>
      </div>
      <div className="mb-4">
        <CreateGroupForm />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {groups.map((group) => (
          <Card key={group.id}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <Link href={`/groups/${group.id}`} className="text-lg font-semibold">
                  {group.name}
                </Link>
                <p className="mt-1 text-sm text-muted-foreground">
                  {group.members.length} members sharing bills in this group.
                </p>
              </div>
              <Badge>{group.expenses.length} expenses</Badge>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {group.members.map((member) => (
                <Badge key={member.id}>{member.user.name}</Badge>
              ))}
            </div>
            {group.expenses.length === 0 ? (
              <p className="mt-4 rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
                No expenses yet. Add your first expense to see balances.
              </p>
            ) : null}
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <Link
                className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90"
                href={`/groups/${group.id}#add-expense`}
              >
                Add Expense
              </Link>
              <Link
                className="inline-flex h-10 items-center justify-center rounded-md border bg-background px-4 text-sm font-medium transition hover:bg-muted"
                href={`/import?groupId=${group.id}`}
              >
                Import CSV
              </Link>
              <Link
                className="inline-flex h-10 items-center justify-center rounded-md bg-muted px-4 text-sm font-medium transition hover:bg-muted/80"
                href={`/balances/${group.id}`}
              >
                View Balances
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
