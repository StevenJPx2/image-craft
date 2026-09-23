import { readFile } from "node:fs/promises";
import type { ImageProvider, ImageRequest, ProviderResult } from "../core/types.js";
import { normalizeRequest, imageSizeLabel } from "../core/validation.js";
import { expectJson } from "./http.js";

export interface OpenAIOptions {
  apiKey?: string;
  model?: string;
  baseUrl?: string;
}

export class OpenAIImageProvider implements ImageProvider {
  readonly name = "openai" as const;
  readonly model: string;
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(options: OpenAIOptions = {}) {
    this.apiKey = options.apiKey ?? process.env.OPENAI_API_KEY ?? "";
    this.model = options.model ?? process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-2.5-sunburst";
    this.baseUrl = options.baseUrl ?? process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";
  }

  async generate(input: ImageRequest): Promise<ProviderResult> {
    const request = normalizeRequest(input);
    if (!this.apiKey) {
      throw new Error("OPENAI_API_KEY is required");
    }

    const prompt = request.negativePrompt
      ? `${request.prompt}\n\nAvoid: ${request.negativePrompt}`
      : request.prompt;
    const endpoint = request.operation === "edit" ? "images/edits" : "images/generations";
    let payload: FormData | string;
    let headers: Record<string, string>;

    if (request.operation === "edit") {
      const form = new FormData();
      form.set("model", this.model);
      form.set("prompt", prompt);
      form.set("size", imageSizeLabel(request.size));
      form.set("n", String(request.count));

      for (const imagePath of request.images ?? []) {
        const data = await readFile(imagePath);
        form.append("image[]", new Blob([data], { type: "image/png" }), imagePath);
      }

      payload = form;
      headers = { Authorization: `Bearer ${this.apiKey}` };
    } else {
      payload = JSON.stringify({ model: this.model, prompt, size: imageSizeLabel(request.size), n: request.count });
      headers = { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" };
    }

    const response = await fetch(`${this.baseUrl}/${endpoint}`, {
      method: "POST",
      headers,
      body: payload,
    });
    const result = await expectJson(response);
    const data = result.data;
    if (!Array.isArray(data)) {
      throw new Error("OpenAI response is missing data");
    }

    return {
      provider: this.name,
      model: this.model,
      images: data.map((item) => {
        if (typeof item !== "object" || item === null || !("b64_json" in item) || typeof item.b64_json !== "string") {
          throw new Error("OpenAI response image is missing b64_json");
        }
        return { data: Buffer.from(item.b64_json, "base64"), mimeType: "image/png" };
      }),
    };
  }
}
