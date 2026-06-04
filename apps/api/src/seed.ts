import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // The catalog (spreads, topup packages, decks) is static data from @taro/shared
  // and served from the API without DB storage. No seed needed for them.

  // Create a demo user for development/testing
  if (process.env.NODE_ENV !== 'production') {
    await prisma.user.upsert({
      where: { tgId: '000000001' },
      update: {},
      create: {
        tgId: '000000001',
        firstName: 'Dev User',
        username: 'devuser',
        balance: 500,
        deck: 'mansion',
      },
    });
    console.log('Created dev user');
  }

  console.log('Seed complete');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
