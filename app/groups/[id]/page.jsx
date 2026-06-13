import Link from "next/link";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ExpenseQuickForm } from "@/components/ExpenseQuickForm";

export const dynamic = "force-dynamic";

export default async function GroupDetailPage({ params }) {
  const groupId = (await params).id;
  const group = await prisma.group.findUnique({
    where: { id: groupId },
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
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{group.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{group.id}</p>
        </div>
        <Link className="text-sm font-medium text-primary" href={`/balances/${group.id}`}>View balances</Link>
      </div>

      <div className="space-y-4">
        <ExpenseQuickForm groupId={group.id} members={group.members} />
        <Card>
          <h2 className="mb-3 text-lg font-semibold">Members</h2>
          <div className="flex flex-wrap gap-2">
            {group.members.map((member) => (
              <Badge key={member.id}>
                {member.user.name} from {member.joinedAt.toISOString().slice(0, 10)}
                {member.leftAt ? ` to ${member.leftAt.toISOString().slice(0, 10)}` : ""}
              </Badge>
            ))}
          </div>
        </Card>
        <Card>
          <h2 className="mb-3 text-lg font-semibold">Expenses</h2>
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
        </Card>
      </div>
    </AppShell>
  );
}
