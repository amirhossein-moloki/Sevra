import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',

  migrations: {
    path: 'prisma/migrations',
    seed: 'node --import tsx --require dotenv/config ./prisma/seed.ts',
  },

  datasource: {
    // نکته: به جای env("DATABASE_URL") بهتره process.env بذاری تا کمتر به ارورهای env-loader بخوری
    url: process.env.DATABASE_URL!,
  },
});
