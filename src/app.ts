import express from "express";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger";
import { reportRequestsRouter } from "./modules/reportRequests/routes";
import { errorHandler } from "./middlewares/errorHandler";
import { notFoundHandler } from "./middlewares/notFound";
import { requestIdMiddleware } from "./middlewares/requestId";
import { requestLogger } from "./middlewares/requestLogger";

export const app = express();

app.use(express.json());
app.use(requestIdMiddleware);
app.use(requestLogger);

/**
 * @openapi
 * /health:
 *   get:
 *     summary: Health check
 *     responses:
 *       200:
 *         description: Service status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 */
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/report-requests", reportRequestsRouter);

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get("/docs.json", (_req, res) => {
  res.json(swaggerSpec);
});

app.use(notFoundHandler);
app.use(errorHandler);
