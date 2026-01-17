import { Queue } from "bullmq";
import { env } from "../config/env";

export const reportQueue = new Queue("report-requests", {
  connection: {
    url: env.redisUrl
  }
});
