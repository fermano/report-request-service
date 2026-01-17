import { Request, Response, NextFunction } from "express";
import { logger } from "../lib/logger";

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  res.on("finish", () => {
    const durationMs = Date.now() - start;
    logger.info({
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durationMs,
      requestId: req.requestId
    });
  });
  next();
};
