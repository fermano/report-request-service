import { Worker } from "bullmq";
import { env } from "./config/env";
import { logger } from "./lib/logger";
import {
  getReportRequestService,
  markCompletedService,
  markFailedService,
  markProcessingService
} from "./modules/reportRequests/service";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const worker = new Worker(
  "report-requests",
  async (job) => {
    const id = job.data.id as string;
    logger.info({ jobId: job.id, reportRequestId: id }, "Report job started");
    await markProcessingService(id);
    const reportRequest = await getReportRequestService(id, false);
    const params = reportRequest.parameters as Record<string, unknown>;

    await sleep(500 + Math.floor(Math.random() * 1000));

    if (params.fail === true) {
      await markFailedService(id, "Simulated processing failure");
      logger.warn({ jobId: job.id, reportRequestId: id }, "Report job failed");
      return;
    }

    await markCompletedService(id, `https://example.com/reports/${id}.json`);
    logger.info({ jobId: job.id, reportRequestId: id }, "Report job completed");
  },
  {
    connection: { url: env.redisUrl }
  }
);

worker.on("active", (job) => {
  logger.info({ jobId: job.id }, "Report job active");
});

worker.on("failed", (job, err) => {
  logger.error({ err, jobId: job?.id }, "Report job failed");
});

logger.info("Report worker started");
