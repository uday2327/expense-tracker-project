import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const users = [
  { name: "Aisha", email: "aisha@example.com", password: "Aisha@123" },
  { name: "Rohan", email: "rohan@example.com", password: "Rohan@123" },
  { name: "Priya", email: "priya@example.com", password: "Priya@123" },
  { name: "Meera", email: "meera@example.com", password: "Meera@123" },
  { name: "Dev", email: "dev@example.com", password: "Dev@123" },
  { name: "Sam", email: "sam@example.com", password: "Sam@123" }
];

async function main() {
  for (const user of users) {
    const passwordHash = await bcrypt.hash(user.password, 10);

    await prisma.user.upsert({
      where: { email: user.email },
      update: { name: user.name, passwordHash },
      create: { name: user.name, email: user.email, passwordHash }
    });
  }

  const group = await prisma.group.upsert({
    where: { id: "shared-flat-2024" },
    update: { name: "Shared Flat 2024" },
    create: { id: "shared-flat-2024", name: "Shared Flat 2024" }
  });

  const userByName = new Map(
    (await prisma.user.findMany()).map((user) => [user.name, user])
  );

  const memberships = [
    { name: "Aisha", joinedAt: "2024-02-01" },
    { name: "Rohan", joinedAt: "2024-02-01" },
    { name: "Priya", joinedAt: "2024-02-01" },
    { name: "Meera", joinedAt: "2024-02-01", leftAt: "2024-03-31" },
    { name: "Dev", joinedAt: "2024-02-01" },
    { name: "Sam", joinedAt: "2024-04-15" }
  ];

  for (const membership of memberships) {
    const user = userByName.get(membership.name);
    if (!user) {
      throw new Error(`Seed user missing: ${membership.name}`);
    }

    await prisma.groupMember.upsert({
      where: {
        groupId_userId_joinedAt: {
          groupId: group.id,
          userId: user.id,
          joinedAt: new Date(membership.joinedAt)
        }
      },
      update: {
        leftAt: membership.leftAt ? new Date(membership.leftAt) : null
      },
      create: {
        groupId: group.id,
        userId: user.id,
        joinedAt: new Date(membership.joinedAt),
        leftAt: membership.leftAt ? new Date(membership.leftAt) : null
      }
    });
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });

