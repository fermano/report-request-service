import crypto from "crypto";
import { Request, Response, NextFunction } from "express";

export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const incoming = req.header("x-request-id");
  const requestId = incoming && incoming.trim().length > 0 ? incoming : crypto.randomUUID();
  req.requestId = requestId;
  res.setHeader("x-request-id", requestId);
  next();
};
