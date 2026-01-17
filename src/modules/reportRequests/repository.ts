import { Prisma, ReportRequest, ReportStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma";

export type ListFilters = {
  status?: ReportStatus;
  type?: Prisma.ReportRequestWhereInput["type"];
  createdBy?: string;
  createdAtFrom?: Date;
  createdAtTo?: Date;
  includeDeleted?: boolean;
};

export type ListOptions = {
  page: number;
  pageSize: number;
  sort: "createdAt" | "updatedAt";
  order: "asc" | "desc";
};

export const createReportRequest = async (
  data: Prisma.ReportRequestCreateInput
): Promise<ReportRequest> => {
  return prisma.reportRequest.create({ data });
};

export const findReportRequestById = async (
  id: string,
  includeDeleted: boolean
): Promise<ReportRequest | null> => {
  return prisma.reportRequest.findFirst({
    where: {
      id,
      deletedAt: includeDeleted ? undefined : null
    }
  });
};

export const listReportRequests = async (
  filters: ListFilters,
  options: ListOptions
): Promise<{ data: ReportRequest[]; totalItems: number }> => {
  const where: Prisma.ReportRequestWhereInput = {
    status: filters.status,
    type: filters.type,
    createdBy: filters.createdBy,
    createdAt: {
      gte: filters.createdAtFrom,
      lte: filters.createdAtTo
    },
    deletedAt: filters.includeDeleted ? undefined : null
  };

  const [totalItems, data] = await prisma.$transaction([
    prisma.reportRequest.count({ where }),
    prisma.reportRequest.findMany({
      where,
      orderBy: { [options.sort]: options.order },
      skip: (options.page - 1) * options.pageSize,
      take: options.pageSize
    })
  ]);

  return { data, totalItems };
};

export const updateReportRequestWithVersion = async (
  id: string,
  version: number,
  data: Prisma.ReportRequestUpdateInput
): Promise<ReportRequest | null> => {
  const updated = await prisma.reportRequest.updateMany({
    where: { id, version, deletedAt: null },
    data: { ...data, version: { increment: 1 } }
  });

  if (updated.count === 0) {
    return null;
  }

  return prisma.reportRequest.findUnique({ where: { id } });
};

export const updateReportRequestStatus = async (
  id: string,
  currentStatus: ReportStatus,
  data: Prisma.ReportRequestUpdateInput
): Promise<ReportRequest | null> => {
  const updated = await prisma.reportRequest.updateMany({
    where: { id, status: currentStatus, deletedAt: null },
    data: { ...data, version: { increment: 1 } }
  });

  if (updated.count === 0) {
    return null;
  }

  return prisma.reportRequest.findUnique({ where: { id } });
};

export const softDeleteReportRequest = async (id: string): Promise<ReportRequest | null> => {
  const updated = await prisma.reportRequest.updateMany({
    where: { id, deletedAt: null },
    data: { deletedAt: new Date(), version: { increment: 1 } }
  });

  if (updated.count === 0) {
    return null;
  }

  return prisma.reportRequest.findUnique({ where: { id } });
};

export const findIdempotencyKey = async (key: string, route: string) => {
  return prisma.idempotencyKey.findUnique({
    where: {
      key_route: {
        key,
        route
      }
    }
  });
};

export const createIdempotencyKey = async (
  data: Prisma.IdempotencyKeyCreateInput
) => {
  return prisma.idempotencyKey.create({ data });
};

export const createReportRequestWithIdempotency = async (
  reportData: Prisma.ReportRequestCreateInput,
  idempotencyData: Prisma.IdempotencyKeyCreateInput
): Promise<ReportRequest> => {
  return prisma.$transaction(async (tx) => {
    const reportRequest = await tx.reportRequest.create({ data: reportData });
    await tx.idempotencyKey.create({
      data: {
        ...idempotencyData,
        responseBody: JSON.parse(JSON.stringify(reportRequest))
      }
    });
    return reportRequest;
  });
};
