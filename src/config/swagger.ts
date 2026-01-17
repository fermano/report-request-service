import swaggerJSDoc from "swagger-jsdoc";

export const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "ReportHub API",
      version: "1.0.0",
      description: "CRUD + workflow API for report request lifecycle management"
    },
    components: {
      schemas: {
        ReportRequest: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            title: { type: "string" },
            type: { type: "string", enum: ["SALES_SUMMARY", "USER_EXPORT", "INVENTORY_SNAPSHOT"] },
            parameters: { type: "object" },
            status: {
              type: "string",
              enum: ["DRAFT", "QUEUED", "PROCESSING", "COMPLETED", "FAILED", "CANCELLED"]
            },
            createdBy: { type: "string" },
            idempotencyKey: { type: "string", nullable: true },
            version: { type: "integer" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
            deletedAt: { type: "string", format: "date-time", nullable: true },
            completedAt: { type: "string", format: "date-time", nullable: true },
            failureReason: { type: "string", nullable: true }
          }
        },
        CreateReportRequest: {
          type: "object",
          required: ["title", "type", "parameters", "createdBy"],
          properties: {
            title: { type: "string" },
            type: { type: "string", enum: ["SALES_SUMMARY", "USER_EXPORT", "INVENTORY_SNAPSHOT"] },
            parameters: { type: "object" },
            createdBy: { type: "string" }
          }
        },
        UpdateReportRequest: {
          type: "object",
          properties: {
            title: { type: "string" },
            type: { type: "string", enum: ["SALES_SUMMARY", "USER_EXPORT", "INVENTORY_SNAPSHOT"] },
            parameters: { type: "object" },
            createdBy: { type: "string" }
          }
        },
        ReportRequestList: {
          type: "object",
          properties: {
            data: { type: "array", items: { $ref: "#/components/schemas/ReportRequest" } },
            pageInfo: {
              type: "object",
              properties: {
                page: { type: "integer" },
                pageSize: { type: "integer" },
                totalItems: { type: "integer" },
                totalPages: { type: "integer" }
              }
            }
          }
        },
        ErrorResponse: {
          type: "object",
          properties: {
            error: {
              type: "object",
              properties: {
                code: { type: "string" },
                message: { type: "string" },
                details: { type: "object" }
              }
            }
          }
        }
      }
    }
  },
  apis: ["./src/modules/reportRequests/routes.ts", "./src/app.ts"]
});
