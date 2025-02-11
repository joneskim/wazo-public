import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Check if local user exists
  const localUser = await prisma.user.findUnique({
    where: { email: 'local@local' },
  });

  if (!localUser) {
    // Create local user if it doesn't exist
    const hashedPassword = await bcrypt.hash('local', 10);
    await prisma.user.create({
      data: {
        email: 'local@local',
        passwordHash: hashedPassword,
        name: 'Local User',
      },
    });
    console.log('Created local user');
  } else {
    console.log('Local user already exists');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
