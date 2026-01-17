"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = require("../src/app");
const prisma_1 = require("../src/lib/prisma");
const basePayload = {
    title: "Monthly sales",
    type: "SALES_SUMMARY",
    parameters: { month: "2025-12" },
    createdBy: "test-user"
};
describe("Report Requests API", () => {
    it("creates a report request", async () => {
        const res = await (0, supertest_1.default)(app_1.app).post("/report-requests").send(basePayload);
        expect(res.status).toBe(201);
        expect(res.body.id).toBeDefined();
        expect(res.body.status).toBe("DRAFT");
    });
    it("supports idempotency with same key and body", async () => {
        const key = "idem-123";
        const first = await (0, supertest_1.default)(app_1.app)
            .post("/report-requests")
            .set("Idempotency-Key", key)
            .send(basePayload);
        const second = await (0, supertest_1.default)(app_1.app)
            .post("/report-requests")
            .set("Idempotency-Key", key)
            .send(basePayload);
        expect(first.status).toBe(201);
        expect(second.status).toBe(201);
        expect(second.body.id).toBe(first.body.id);
    });
    it("rejects idempotency key reuse with different body", async () => {
        const key = "idem-456";
        await (0, supertest_1.default)(app_1.app).post("/report-requests").set("Idempotency-Key", key).send(basePayload);
        const conflict = await (0, supertest_1.default)(app_1.app)
            .post("/report-requests")
            .set("Idempotency-Key", key)
            .send({ ...basePayload, title: "Different" });
        expect(conflict.status).toBe(409);
    });
    it("rejects invalid status transition", async () => {
        const res = await (0, supertest_1.default)(app_1.app).post("/report-requests").send(basePayload);
        await prisma_1.prisma.reportRequest.update({
            where: { id: res.body.id },
            data: { status: "COMPLETED" }
        });
        const conflict = await (0, supertest_1.default)(app_1.app).post(`/report-requests/${res.body.id}/queue`).send();
        expect(conflict.status).toBe(409);
    });
    it("enforces optimistic locking on patch", async () => {
        const res = await (0, supertest_1.default)(app_1.app).post("/report-requests").send(basePayload);
        const conflict = await (0, supertest_1.default)(app_1.app)
            .patch(`/report-requests/${res.body.id}`)
            .set("If-Match", "999")
            .send({ title: "Updated" });
        expect(conflict.status).toBe(409);
    });
    it("paginates list results", async () => {
        await (0, supertest_1.default)(app_1.app).post("/report-requests").send(basePayload);
        await (0, supertest_1.default)(app_1.app).post("/report-requests").send({ ...basePayload, title: "Second" });
        await (0, supertest_1.default)(app_1.app).post("/report-requests").send({ ...basePayload, title: "Third" });
        const res = await (0, supertest_1.default)(app_1.app).get("/report-requests?page=2&pageSize=2");
        expect(res.status).toBe(200);
        expect(res.body.data.length).toBe(1);
        expect(res.body.pageInfo.totalItems).toBe(3);
        expect(res.body.pageInfo.totalPages).toBe(2);
    });
});
