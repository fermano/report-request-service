import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { ApiError } from "../lib/errors";
import { logger } from "../lib/logger";

export const errorHandler = (err: unknown, req: Request, res: Response, _next: NextFunction): void => {
  if (err instanceof ZodError) {
    const details = err.flatten();
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        details
      }
    });
    return;
  }

  if (err instanceof ApiError) {
    res.status(err.status).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details
      }
    });
    return;
  }

  logger.error({ err, requestId: req.requestId }, "Unhandled error");
  res.status(500).json({
    error: {
      code: "INTERNAL",
      message: "Unexpected error"
    }
  });
};
