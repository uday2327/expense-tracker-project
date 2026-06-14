import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { authCookieName, getUserFromToken } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import { AddMemberForm } from "@/components/AddMemberForm";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ExpenseQuickForm } from "@/components/ExpenseQuickForm";

export const dynamic = "force-dynamic";

export default async function GroupDetailPage({ params }) {
  const cookieStore = await cookies();
  const user = getUserFromToken(cookieStore.get(authCookieName)?.value);
  if (!user) {
    redirect("/login");
  }

  const groupId = (await params).id;
  const group = await prisma.group.findFirst({
    where: { id: groupId, members: { some: { userId: user.id } } },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { joinedAt: "asc" }
      },
      expenses: {
        where: { isDeleted: false },
        include: {
          paidBy: { select: { id: true, name: true } },
          splits: { include: { user: { select: { id: true, name: true } } } }
        },
        orderBy: { expenseDate: "desc" }
      }
    }
  });

  if (!group) {
    return <AppShell><Card>Group not found.</Card></AppShell>;
  }

  return (
    <AppShell>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{group.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Add bills here. FlowLedger will split them across active members and update balances.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            className="inline-flex h-10 items-center justify-center rounded-md border bg-background px-4 text-sm font-medium transition hover:bg-muted"
            href={`/import?groupId=${group.id}`}
          >
            Import CSV
          </Link>
          <Link
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90"
            href={`/balances/${group.id}`}
          >
            View Balances
          </Link>
        </div>
      </div>

      <div className="space-y-4">
        <section id="add-expense">
          <ExpenseQuickForm groupId={group.id} members={group.members} />
        </section>
        <Card>
          <h2 className="mb-1 text-lg font-semibold">Members in this group</h2>
          <p className="mb-3 text-sm text-muted-foreground">
            Add everyone before entering expenses. Only active members on the expense date are included in splits.
          </p>
          <div className="flex flex-wrap gap-2">
            {group.members.map((member) => (
              <Badge key={member.id}>
                {member.user.name} from {member.joinedAt.toISOString().slice(0, 10)}
                {member.leftAt ? ` to ${member.leftAt.toISOString().slice(0, 10)}` : ""}
              </Badge>
            ))}
          </div>
          <AddMemberForm groupId={group.id} />
        </Card>
        <Card>
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Expenses</h2>
              <p className="text-sm text-muted-foreground">Every added or imported bill appears here.</p>
            </div>
            <Badge>{group.expenses.length} total</Badge>
          </div>
          {group.expenses.length ? (
            <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b">
                  <th className="py-2">Date</th>
                  <th>Description</th>
                  <th>Paid By</th>
                  <th>Amount</th>
                  <th>Split</th>
                </tr>
              </thead>
              <tbody>
                {group.expenses.map((expense) => (
                  <tr key={expense.id} className="border-b">
                    <td className="py-2">{expense.expenseDate.toISOString().slice(0, 10)}</td>
                    <td>{expense.description}</td>
                    <td>{expense.paidBy.name}</td>
                    <td>{expense.currency} {String(expense.totalAmount)}</td>
                    <td>{expense.splitType}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          ) : (
            <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
              No expenses yet. Use the Add expense form above or import a CSV.
            </div>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
