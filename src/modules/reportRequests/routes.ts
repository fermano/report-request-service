import { RequestHandler, Router } from "express";
import {
  cancelReportRequest,
  createReportRequest,
  deleteReportRequest,
  getReportRequest,
  listReportRequests,
  queueReportRequest,
  retryReportRequest,
  updateReportRequest
} from "./controller";

export const reportRequestsRouter = Router();

const wrapAsync =
  (handler: RequestHandler): RequestHandler =>
  (req, res, next) =>
    Promise.resolve(handler(req, res, next)).catch(next);

/**
 * @openapi
 * /report-requests:
 *   post:
 *     summary: Create a report request
 *     parameters:
 *       - in: header
 *         name: Idempotency-Key
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateReportRequest'
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ReportRequest'
 */
reportRequestsRouter.post("/", wrapAsync(createReportRequest));

/**
 * @openapi
 * /report-requests:
 *   get:
 *     summary: List report requests
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *       - in: query
 *         name: createdBy
 *         schema:
 *           type: string
 *       - in: query
 *         name: createdAtFrom
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: createdAtTo
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: includeDeleted
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Paged report requests
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ReportRequestList'
 */
reportRequestsRouter.get("/", wrapAsync(listReportRequests));

/**
 * @openapi
 * /report-requests/{id}:
 *   get:
 *     summary: Get a report request by id
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: includeDeleted
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Report request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ReportRequest'
 */
reportRequestsRouter.get("/:id", wrapAsync(getReportRequest));

/**
 * @openapi
 * /report-requests/{id}:
 *   patch:
 *     summary: Update a report request
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: header
 *         name: If-Match
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateReportRequest'
 *     responses:
 *       200:
 *         description: Updated report request
 */
reportRequestsRouter.patch("/:id", wrapAsync(updateReportRequest));

/**
 * @openapi
 * /report-requests/{id}:
 *   delete:
 *     summary: Soft delete a report request
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Deleted report request
 */
reportRequestsRouter.delete("/:id", wrapAsync(deleteReportRequest));

/**
 * @openapi
 * /report-requests/{id}/queue:
 *   post:
 *     summary: Queue a report request
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Updated report request
 */
reportRequestsRouter.post("/:id/queue", wrapAsync(queueReportRequest));

/**
 * @openapi
 * /report-requests/{id}/cancel:
 *   post:
 *     summary: Cancel a report request
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Updated report request
 */
reportRequestsRouter.post("/:id/cancel", wrapAsync(cancelReportRequest));

/**
 * @openapi
 * /report-requests/{id}/retry:
 *   post:
 *     summary: Retry a failed report request
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Updated report request
 */
reportRequestsRouter.post("/:id/retry", wrapAsync(retryReportRequest));
