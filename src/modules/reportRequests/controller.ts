import { Prisma } from "@prisma/client";
import { Request, Response } from "express";
import { ApiError } from "../../lib/errors";
import {
  createReportRequestSchema,
  listReportRequestsSchema,
  updateReportRequestSchema
} from "./schemas";
import {
  cancelReportRequestService,
  createReportRequestService,
  deleteReportRequestService,
  getReportRequestService,
  listReportRequestsService,
  queueReportRequestService,
  retryReportRequestService,
  updateReportRequestService
} from "./service";

export const createReportRequest = async (req: Request, res: Response): Promise<void> => {
  const body = createReportRequestSchema.parse(req.body);
  const rawIdempotencyKey = req.header("idempotency-key");
  const idempotencyKey =
    rawIdempotencyKey && rawIdempotencyKey.trim().length > 0 ? rawIdempotencyKey : undefined;
  const createData = {
    ...body,
    parameters: body.parameters as Prisma.InputJsonValue
  };
  const result = await createReportRequestService(createData, idempotencyKey);
  res.status(result.responseCode).json(result.responseBody);
};

export const listReportRequests = async (req: Request, res: Response): Promise<void> => {
  const query = listReportRequestsSchema.parse(req.query);
  const page = Math.max(parseInt(query.page ?? "1", 10), 1);
  const pageSize = Math.min(Math.max(parseInt(query.pageSize ?? "20", 10), 1), 100);
  const sort = query.sort ?? "createdAt";
  const order = query.order ?? "desc";
  const includeDeleted = query.includeDeleted === "true";

  const { data, totalItems } = await listReportRequestsService(
    {
      status: query.status,
      type: query.type,
      createdBy: query.createdBy,
      createdAtFrom: query.createdAtFrom ? new Date(query.createdAtFrom) : undefined,
      createdAtTo: query.createdAtTo ? new Date(query.createdAtTo) : undefined,
      includeDeleted
    },
    { page, pageSize, sort, order }
  );

  res.json({
    data,
    pageInfo: {
      page,
      pageSize,
      totalItems,
      totalPages: Math.ceil(totalItems / pageSize)
    }
  });
};

export const getReportRequest = async (req: Request, res: Response): Promise<void> => {
  const includeDeleted = req.query.includeDeleted === "true";
  const reportRequest = await getReportRequestService(req.params.id, includeDeleted);
  res.json(reportRequest);
};

export const updateReportRequest = async (req: Request, res: Response): Promise<void> => {
  const body = updateReportRequestSchema.parse(req.body);
  const ifMatch = req.header("if-match");
  const version = ifMatch ? parseInt(ifMatch, 10) : NaN;
  if (!Number.isInteger(version)) {
    throw new ApiError(400, "VALIDATION_ERROR", "If-Match header with integer version is required");
  }
  const updateData: Prisma.ReportRequestUpdateInput = {};
  if (body.title !== undefined) {
    updateData.title = body.title;
  }
  if (body.type !== undefined) {
    updateData.type = body.type;
  }
  if (body.createdBy !== undefined) {
    updateData.createdBy = body.createdBy;
  }
  if (body.parameters !== undefined) {
    updateData.parameters = body.parameters as Prisma.InputJsonValue;
  }
  const updated = await updateReportRequestService(req.params.id, version, updateData);
  res.json(updated);
};

export const deleteReportRequest = async (req: Request, res: Response): Promise<void> => {
  const deleted = await deleteReportRequestService(req.params.id);
  res.json(deleted);
};

export const queueReportRequest = async (req: Request, res: Response): Promise<void> => {
  const updated = await queueReportRequestService(req.params.id);
  res.json(updated);
};

export const cancelReportRequest = async (req: Request, res: Response): Promise<void> => {
  const updated = await cancelReportRequestService(req.params.id);
  res.json(updated);
};

export const retryReportRequest = async (req: Request, res: Response): Promise<void> => {
  const updated = await retryReportRequestService(req.params.id);
  res.json(updated);
};
