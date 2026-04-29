import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const username = process.env.APP_USERNAME ?? "admin";
  const password = process.env.APP_PASSWORD ?? "admin123";
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.upsert({
    where: { username },
    update: { passwordHash },
    create: { id: 1, username, passwordHash },
  });

  console.log(`Seeded user: ${username}`);
}

main().finally(async () => {
  await prisma.$disconnect();
});
