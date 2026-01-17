"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = require("../src/lib/prisma");
const queue_1 = require("../src/lib/queue");
beforeAll(async () => {
    await prisma_1.prisma.$connect();
});
beforeEach(async () => {
    await prisma_1.prisma.$executeRawUnsafe('TRUNCATE TABLE "ReportRequest", "IdempotencyKey" RESTART IDENTITY CASCADE;');
});
afterAll(async () => {
    await queue_1.reportQueue.close();
    await prisma_1.prisma.$disconnect();
});
