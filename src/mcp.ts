#!/usr/bin/env node
import "./env.js";
import { createInterface } from "node:readline";
import { createProvider, parseSize, saveResult } from "./index.js";
import type { ProviderName } from "./core/types.js";

const tools = [{
  name: "image_generate",
  description: "Generate or edit images with OpenAI, Google Nano Banana, or local Qwen.",
  inputSchema: { type: "object", required: ["provider", "prompt"], properties: {
    provider: { type: "string", enum: ["openai", "google", "qwen"] }, prompt: { type: "string" },
    operation: { type: "string", enum: ["generate", "edit"] }, images: { type: "array", items: { type: "string" } },
    negativePrompt: { type: "string" }, size: { type: "string", description: "WIDTHxHEIGHT" }, count: { type: "integer" }, seed: { type: "integer" }, outputDir: { type: "string" },
  } },
}];

const input = createInterface({ input: process.stdin });
input.on("line", (line) => { void handle(line); });

async function handle(line: string): Promise<void> {
  const request: unknown = JSON.parse(line);
  if (typeof request !== "object" || request === null || !("method" in request) || typeof request.method !== "string") return;
  const id = "id" in request ? request.id : null;

  try {
    let result: unknown;
    if (request.method === "initialize") result = { protocolVersion: "2025-06-18", capabilities: { tools: {} }, serverInfo: { name: "image-craft", version: "0.1.0" } };
    else if (request.method === "tools/list") result = { tools };
    else if (request.method === "tools/call") result = await callTool(request);
    else result = {};
    console.log(JSON.stringify({ jsonrpc: "2.0", id, result }));
  } catch (error) {
    console.log(JSON.stringify({ jsonrpc: "2.0", id, error: { code: -32000, message: error instanceof Error ? error.message : String(error) } }));
  }
}

async function callTool(request: object & Record<string, unknown>): Promise<unknown> {
  const params = request.params;
  if (typeof params !== "object" || params === null || !("arguments" in params) || typeof params.arguments !== "object" || params.arguments === null) throw new Error("tools/call arguments are required");
  const args = params.arguments as Record<string, unknown>;
  const provider = args.provider;
  const prompt = args.prompt;
  if ((provider !== "openai" && provider !== "google" && provider !== "qwen") || typeof prompt !== "string") throw new Error("provider and prompt are required");
  const result = await createProvider(provider as ProviderName).generate({ operation: args.operation === "edit" ? "edit" : "generate", prompt, ...(typeof args.negativePrompt === "string" ? { negativePrompt: args.negativePrompt } : {}), ...(Array.isArray(args.images) ? { images: args.images as string[] } : {}), ...(typeof args.size === "string" ? { size: parseSize(args.size) } : {}), ...(typeof args.count === "number" ? { count: args.count } : {}), ...(typeof args.seed === "number" ? { seed: args.seed } : {}) });
  const paths = await saveResult(result, typeof args.outputDir === "string" ? args.outputDir : "outputs");
  return { content: [{ type: "text", text: JSON.stringify({ paths, provider: result.provider, model: result.model }) }] };
}
