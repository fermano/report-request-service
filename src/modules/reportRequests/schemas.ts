import { z } from "zod";

export const reportTypeEnum = z.enum(["SALES_SUMMARY", "USER_EXPORT", "INVENTORY_SNAPSHOT"]);
export const reportStatusEnum = z.enum([
  "DRAFT",
  "QUEUED",
  "PROCESSING",
  "COMPLETED",
  "FAILED",
  "CANCELLED"
]);

export const createReportRequestSchema = z.object({
  title: z.string().min(1),
  type: reportTypeEnum,
  parameters: z.record(z.unknown()).default({}),
  createdBy: z.string().min(1)
});

export const updateReportRequestSchema = z.object({
  title: z.string().min(1).optional(),
  type: reportTypeEnum.optional(),
  parameters: z.record(z.unknown()).optional(),
  createdBy: z.string().min(1).optional()
});

export const listReportRequestsSchema = z.object({
  status: reportStatusEnum.optional(),
  type: reportTypeEnum.optional(),
  createdBy: z.string().optional(),
  createdAtFrom: z.string().datetime().optional(),
  createdAtTo: z.string().datetime().optional(),
  page: z.string().optional(),
  pageSize: z.string().optional(),
  sort: z.enum(["createdAt", "updatedAt"]).optional(),
  order: z.enum(["asc", "desc"]).optional(),
  includeDeleted: z.string().optional()
});
