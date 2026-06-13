import Link from "next/link";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const groups = await prisma.group.findMany({
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
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">Groups, members, expenses, and audit-ready imports.</p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {groups.map((group) => (
          <Card key={group.id}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <Link href={`/groups/${group.id}`} className="text-lg font-semibold">
                  {group.name}
                </Link>
                <p className="mt-1 text-sm text-muted-foreground">{group.id}</p>
              </div>
              <Badge>{group.expenses.length} expenses</Badge>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {group.members.map((member) => (
                <Badge key={member.id}>{member.user.name}</Badge>
              ))}
            </div>
            <div className="mt-4 flex gap-3 text-sm font-medium text-primary">
              <Link href={`/balances/${group.id}`}>Balances</Link>
              <Link href={`/import?groupId=${group.id}`}>Import CSV</Link>
            </div>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
