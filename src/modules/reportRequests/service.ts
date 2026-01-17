import { Prisma, ReportRequest } from "@prisma/client";
import { ApiError } from "../../lib/errors";
import { sha256, stableStringify } from "../../lib/hash";
import { reportQueue } from "../../lib/queue";
import { assertRetryAllowed, assertValidTransition } from "./domain";
import {
  createReportRequest,
  createReportRequestWithIdempotency,
  findIdempotencyKey,
  findReportRequestById,
  listReportRequests,
  softDeleteReportRequest,
  updateReportRequestStatus,
  updateReportRequestWithVersion
} from "./repository";

const IDEMPOTENCY_ROUTE = "/report-requests";

type CreateReportRequestInput = {
  title: string;
  type: ReportRequest["type"];
  parameters: Prisma.InputJsonValue;
  createdBy: string;
};

type CreateResult =
  | { isReplay: true; responseCode: number; responseBody: unknown }
  | { isReplay: false; responseCode: number; responseBody: ReportRequest };

export const createReportRequestService = async (
  data: CreateReportRequestInput,
  idempotencyKey?: string
): Promise<CreateResult> => {
  if (idempotencyKey) {
    const requestHash = sha256(stableStringify(data));
    const existing = await findIdempotencyKey(idempotencyKey, IDEMPOTENCY_ROUTE);
    if (existing) {
      if (existing.requestHash !== requestHash) {
        throw new ApiError(409, "CONFLICT", "Idempotency key reuse with different payload");
      }
      return {
        isReplay: true,
        responseCode: existing.responseCode,
        responseBody: existing.responseBody
      };
    }

    const reportRequest = await createReportRequestWithIdempotency(
      {
        ...data,
        status: "DRAFT",
        idempotencyKey
      },
      {
        key: idempotencyKey,
        route: IDEMPOTENCY_ROUTE,
        requestHash,
        responseCode: 201,
        responseBody: {}
      }
    );

    return { isReplay: false, responseCode: 201, responseBody: reportRequest };
  }

  const reportRequest = await createReportRequest({
    ...data,
    parameters: data.parameters as Prisma.InputJsonValue,
    status: "DRAFT"
  });
  return { isReplay: false, responseCode: 201, responseBody: reportRequest };
};

export const listReportRequestsService = async (
  filters: Parameters<typeof listReportRequests>[0],
  options: Parameters<typeof listReportRequests>[1]
) => {
  return listReportRequests(filters, options);
};

export const getReportRequestService = async (id: string, includeDeleted: boolean) => {
  const reportRequest = await findReportRequestById(id, includeDeleted);
  if (!reportRequest) {
    throw new ApiError(404, "NOT_FOUND", "Report request not found");
  }
  return reportRequest;
};

export const updateReportRequestService = async (
  id: string,
  version: number,
  data: Prisma.ReportRequestUpdateInput
) => {
  const updated = await updateReportRequestWithVersion(id, version, data);
  if (!updated) {
    const existing = await findReportRequestById(id, false);
    if (!existing) {
      throw new ApiError(404, "NOT_FOUND", "Report request not found");
    }
    throw new ApiError(409, "CONFLICT", "Version mismatch");
  }
  return updated;
};

export const deleteReportRequestService = async (id: string) => {
  const deleted = await softDeleteReportRequest(id);
  if (!deleted) {
    throw new ApiError(404, "NOT_FOUND", "Report request not found");
  }
  return deleted;
};

export const queueReportRequestService = async (id: string) => {
  const existing = await findReportRequestById(id, false);
  if (!existing) {
    throw new ApiError(404, "NOT_FOUND", "Report request not found");
  }
  assertValidTransition(existing.status, "QUEUED");
  const updated = await updateReportRequestStatus(id, existing.status, { status: "QUEUED" });
  if (!updated) {
    throw new ApiError(409, "CONFLICT", "Status transition conflict");
  }
  await reportQueue.add("process-report", { id: updated.id });
  return updated;
};

export const cancelReportRequestService = async (id: string) => {
  const existing = await findReportRequestById(id, false);
  if (!existing) {
    throw new ApiError(404, "NOT_FOUND", "Report request not found");
  }
  assertValidTransition(existing.status, "CANCELLED");
  const updated = await updateReportRequestStatus(id, existing.status, { status: "CANCELLED" });
  if (!updated) {
    throw new ApiError(409, "CONFLICT", "Status transition conflict");
  }
  return updated;
};

export const retryReportRequestService = async (id: string) => {
  const existing = await findReportRequestById(id, false);
  if (!existing) {
    throw new ApiError(404, "NOT_FOUND", "Report request not found");
  }
  assertRetryAllowed(existing.status);
  const updated = await updateReportRequestStatus(id, "FAILED", { status: "QUEUED", failureReason: null });
  if (!updated) {
    throw new ApiError(409, "CONFLICT", "Status transition conflict");
  }
  await reportQueue.add("process-report", { id: updated.id });
  return updated;
};

export const markProcessingService = async (id: string) => {
  const existing = await findReportRequestById(id, false);
  if (!existing) {
    throw new ApiError(404, "NOT_FOUND", "Report request not found");
  }
  assertValidTransition(existing.status, "PROCESSING");
  const updated = await updateReportRequestStatus(id, "QUEUED", { status: "PROCESSING" });
  if (!updated) {
    throw new ApiError(409, "CONFLICT", "Status transition conflict");
  }
  return updated;
};

export const markCompletedService = async (id: string, resultUrl: string) => {
  const existing = await findReportRequestById(id, false);
  if (!existing) {
    throw new ApiError(404, "NOT_FOUND", "Report request not found");
  }
  assertValidTransition(existing.status, "COMPLETED");
  const updated = await updateReportRequestStatus(id, "PROCESSING", {
    status: "COMPLETED",
    completedAt: new Date(),
    parameters: {
      ...(existing.parameters as Record<string, unknown>),
      resultUrl
    }
  });
  if (!updated) {
    throw new ApiError(409, "CONFLICT", "Status transition conflict");
  }
  return updated;
};

export const markFailedService = async (id: string, failureReason: string) => {
  const existing = await findReportRequestById(id, false);
  if (!existing) {
    throw new ApiError(404, "NOT_FOUND", "Report request not found");
  }
  assertValidTransition(existing.status, "FAILED");
  const updated = await updateReportRequestStatus(id, "PROCESSING", {
    status: "FAILED",
    failureReason
  });
  if (!updated) {
    throw new ApiError(409, "CONFLICT", "Status transition conflict");
  }
  return updated;
};
