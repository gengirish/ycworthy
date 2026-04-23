// src/lib/version.ts
//
// Single source of truth for the public API version. Bump on breaking changes.
// Surfaced in every JSON response (`meta.api_version`) and in the OpenAPI spec.

export const API_VERSION = "1.0.0";
export const API_TITLE = "YCWorthy API";
export const API_DESCRIPTION =
  "AI-powered Y Combinator startup evaluator. Drop a URL, get a brutal partner verdict scored across six YC criteria. Backed by Gemini 2.5 Flash (primary) with automatic fallback to NVIDIA Nemotron Ultra 253B, then xAI Grok.";
