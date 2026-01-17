import { prisma } from "../src/lib/prisma";
import { reportQueue } from "../src/lib/queue";

beforeAll(async () => {
  await prisma.$connect();
});

beforeEach(async () => {
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "ReportRequest", "IdempotencyKey" RESTART IDENTITY CASCADE;');
});

afterAll(async () => {
  await reportQueue.close();
  await prisma.$disconnect();
});
