// src/app/api/openapi.json/route.ts
//
// Public OpenAPI 3.1 spec for the YCWorthy API. Lets developers:
//   • Generate typed clients via `openapi-typescript-codegen` / `openapi-fetch`
//   • Drop the URL into Postman / Insomnia / Bruno for one-click import
//   • Wire the API into Custom GPTs / OpenAI Actions
//   • Power the MCP server's tool-schema declaration
//
// The spec is hand-maintained alongside the route logic — keep it in sync
// when adding or changing endpoints. Bump `info.version` (and API_VERSION
// in `src/lib/version.ts`) on breaking changes.

import { NextRequest } from "next/server";
import {
  buildMeta,
  jsonResponse,
  newRequestId,
  preflight,
} from "@/lib/http";
import { API_DESCRIPTION, API_TITLE, API_VERSION } from "@/lib/version";

export async function OPTIONS() {
  return preflight();
}

export async function GET(req: NextRequest) {
  const start = Date.now();
  const requestId = req.headers.get("x-request-id") ?? newRequestId();

  const origin = new URL(req.url).origin;

  const spec = {
    openapi: "3.1.0",
    info: {
      title: API_TITLE,
      description: API_DESCRIPTION,
      version: API_VERSION,
      contact: {
        name: "IntelliForge AI",
        url: "https://www.intelliforge.tech/",
      },
      license: {
        name: "MIT",
      },
    },
    servers: [
      { url: origin, description: "current" },
      { url: "https://ycworthy.intelliforge.tech", description: "production" },
    ],
    tags: [
      { name: "analyze", description: "Run a YC-style analysis on a startup URL." },
      { name: "system", description: "Health, status, and OpenAPI metadata." },
    ],
    paths: {
      "/api/analyze": {
        get: {
          tags: ["analyze"],
          operationId: "analyzeStartupGet",
          summary: "Analyze a startup URL (query string).",
          description:
            "Convenience endpoint for curl, browsers, and MCP clients. Identical pipeline to POST.",
          parameters: [
            {
              name: "url",
              in: "query",
              required: true,
              description: "Public URL of the startup or product to evaluate.",
              schema: { type: "string", format: "uri" },
              example: "https://stripe.com",
            },
            {
              name: "provider",
              in: "query",
              required: false,
              description:
                "Preferred AI provider. Defaults to `gemini`. The API automatically falls back to the other provider on failure.",
              schema: {
                type: "string",
                enum: ["gemini", "nvidia"],
                default: "gemini",
              },
            },
          ],
          responses: {
            "200": { $ref: "#/components/responses/AnalyzeOk" },
            "422": { $ref: "#/components/responses/ValidationError" },
            "500": { $ref: "#/components/responses/ServerError" },
            "502": { $ref: "#/components/responses/UpstreamError" },
          },
        },
        post: {
          tags: ["analyze"],
          operationId: "analyzeStartupPost",
          summary: "Analyze a startup URL (JSON body).",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AnalyzeRequest" },
              },
            },
          },
          responses: {
            "200": { $ref: "#/components/responses/AnalyzeOk" },
            "400": { $ref: "#/components/responses/ValidationError" },
            "422": { $ref: "#/components/responses/ValidationError" },
            "500": { $ref: "#/components/responses/ServerError" },
            "502": { $ref: "#/components/responses/UpstreamError" },
          },
        },
        options: {
          tags: ["system"],
          summary: "CORS preflight.",
          responses: { "204": { description: "Preflight OK" } },
        },
      },
      "/api/health": {
        get: {
          tags: ["system"],
          operationId: "getHealth",
          summary: "Service + provider health.",
          responses: {
            "200": {
              description: "All systems normal — at least one provider configured.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/HealthResponse" },
                },
              },
            },
            "503": {
              description: "Degraded — no providers are configured.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/HealthResponse" },
                },
              },
            },
          },
        },
        options: {
          tags: ["system"],
          summary: "CORS preflight.",
          responses: { "204": { description: "Preflight OK" } },
        },
      },
      "/api/openapi.json": {
        get: {
          tags: ["system"],
          operationId: "getOpenApiSpec",
          summary: "Return this OpenAPI 3.1 spec.",
          responses: {
            "200": {
              description: "OpenAPI 3.1 spec",
              content: { "application/json": {} },
            },
          },
        },
      },
    },
    components: {
      schemas: {
        Grade: {
          type: "string",
          enum: ["S", "A", "B", "C", "D", "F"],
          description: "S = exceptional, F = failing.",
        },
        YCLikelihood: {
          type: "string",
          enum: ["Unlikely", "Possible", "Probable", "Strong"],
        },
        AIProvider: {
          type: "string",
          enum: ["gemini", "nvidia"],
        },
        CriterionResult: {
          type: "object",
          required: ["grade", "score", "summary"],
          properties: {
            grade: { $ref: "#/components/schemas/Grade" },
            score: { type: "integer", minimum: 0, maximum: 100 },
            summary: { type: "string" },
          },
        },
        AnalysisResult: {
          type: "object",
          required: [
            "company",
            "tagline",
            "overall_grade",
            "overall_score",
            "verdict",
            "yc_likelihood",
            "criteria",
            "red_flags",
            "green_flags",
            "yc_interview_question",
          ],
          properties: {
            company: { type: "string" },
            tagline: { type: "string" },
            overall_grade: { $ref: "#/components/schemas/Grade" },
            overall_score: { type: "integer", minimum: 0, maximum: 100 },
            verdict: { type: "string" },
            yc_likelihood: { $ref: "#/components/schemas/YCLikelihood" },
            criteria: {
              type: "object",
              required: [
                "problem",
                "market",
                "solution",
                "traction",
                "founder",
                "timing",
              ],
              properties: {
                problem: { $ref: "#/components/schemas/CriterionResult" },
                market: { $ref: "#/components/schemas/CriterionResult" },
                solution: { $ref: "#/components/schemas/CriterionResult" },
                traction: { $ref: "#/components/schemas/CriterionResult" },
                founder: { $ref: "#/components/schemas/CriterionResult" },
                timing: { $ref: "#/components/schemas/CriterionResult" },
              },
            },
            red_flags: { type: "array", items: { type: "string" } },
            green_flags: { type: "array", items: { type: "string" } },
            yc_interview_question: { type: "string" },
          },
        },
        AnalyzeRequest: {
          type: "object",
          required: ["url"],
          properties: {
            url: {
              type: "string",
              format: "uri",
              example: "https://stripe.com",
            },
            provider: {
              $ref: "#/components/schemas/AIProvider",
              default: "gemini",
            },
          },
        },
        Meta: {
          type: "object",
          required: ["api_version", "request_id", "timestamp", "duration_ms"],
          properties: {
            api_version: { type: "string", example: API_VERSION },
            request_id: { type: "string", format: "uuid" },
            timestamp: { type: "string", format: "date-time" },
            duration_ms: { type: "integer", minimum: 0 },
          },
        },
        AnalyzeResponse: {
          type: "object",
          required: ["data", "provider", "duration_ms", "fallback_used", "meta"],
          properties: {
            data: { $ref: "#/components/schemas/AnalysisResult" },
            provider: { $ref: "#/components/schemas/AIProvider" },
            requested_provider: { $ref: "#/components/schemas/AIProvider" },
            duration_ms: { type: "integer", minimum: 0 },
            fallback_used: { type: "boolean" },
            primary_error: {
              type: "string",
              description:
                "Set when the requested provider failed and the fallback succeeded.",
            },
            meta: { $ref: "#/components/schemas/Meta" },
          },
        },
        ErrorResponse: {
          type: "object",
          required: ["error", "meta"],
          properties: {
            error: { type: "string" },
            error_code: {
              type: "string",
              enum: [
                "invalid_json",
                "missing_url",
                "validation_failed",
                "no_provider_configured",
                "all_providers_failed",
              ],
            },
            provider_errors: {
              type: "object",
              additionalProperties: { type: "string" },
            },
            issues: { type: "array", items: { type: "object" } },
            meta: { $ref: "#/components/schemas/Meta" },
          },
        },
        HealthResponse: {
          type: "object",
          required: ["status", "providers", "meta"],
          properties: {
            status: { type: "string", enum: ["ok", "degraded"] },
            providers: {
              type: "object",
              required: ["gemini", "nvidia"],
              properties: {
                gemini: {
                  type: "object",
                  required: ["configured", "model"],
                  properties: {
                    configured: { type: "boolean" },
                    model: { type: "string" },
                  },
                },
                nvidia: {
                  type: "object",
                  required: ["configured", "model"],
                  properties: {
                    configured: { type: "boolean" },
                    transport: {
                      type: ["string", "null"],
                      enum: ["nim", "openrouter", null],
                    },
                    model: { type: "string" },
                  },
                },
              },
            },
            meta: { $ref: "#/components/schemas/Meta" },
          },
        },
      },
      responses: {
        AnalyzeOk: {
          description: "Successful analysis.",
          headers: {
            "X-Provider": {
              schema: { type: "string", enum: ["gemini", "nvidia"] },
            },
            "X-Provider-Fallback": {
              schema: { type: "string", enum: ["true", "false"] },
            },
            "X-Duration-Ms": { schema: { type: "string" } },
            "X-Request-Id": { schema: { type: "string" } },
            "X-Api-Version": { schema: { type: "string" } },
          },
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AnalyzeResponse" },
            },
          },
        },
        ValidationError: {
          description: "Invalid request body or query string.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        ServerError: {
          description: "Server-side configuration error (e.g. no providers configured).",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        UpstreamError: {
          description: "All upstream AI providers failed.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
  };

  return jsonResponse(spec, {
    status: 200,
    meta: buildMeta(requestId, start),
    headers: {
      "X-Request-Id": requestId,
      "Cache-Control": "public, max-age=300",
    },
  });
}
