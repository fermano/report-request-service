import { ReportStatus } from "@prisma/client";
import { ApiError } from "../../lib/errors";

const transitionMap: Record<ReportStatus, ReportStatus[]> = {
  DRAFT: ["QUEUED", "CANCELLED"],
  QUEUED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["COMPLETED", "FAILED", "CANCELLED"],
  COMPLETED: [],
  FAILED: [],
  CANCELLED: []
};

export const assertValidTransition = (from: ReportStatus, to: ReportStatus): void => {
  const allowed = transitionMap[from] ?? [];
  if (!allowed.includes(to)) {
    throw new ApiError(409, "CONFLICT", `Invalid status transition from ${from} to ${to}`);
  }
};

export const assertRetryAllowed = (from: ReportStatus): void => {
  if (from !== "FAILED") {
    throw new ApiError(409, "CONFLICT", `Retry is only allowed from FAILED`);
  }
};
