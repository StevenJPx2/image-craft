import { readFile } from "node:fs/promises";
import type { ImageProvider, ImageRequest, ProviderResult } from "../core/types.js";
import { normalizeRequest } from "../core/validation.js";
import { expectJson } from "./http.js";

export interface GoogleOptions {
  apiKey?: string;
  model?: string;
  baseUrl?: string;
}

export class GoogleNanoBananaProvider implements ImageProvider {
  readonly name = "google" as const;
  readonly model: string;
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(options: GoogleOptions = {}) {
    this.apiKey = options.apiKey ?? process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY ?? "";
    this.model = options.model ?? process.env.GEMINI_IMAGE_MODEL ?? "gemini-3.1-flash-image";
    this.baseUrl = options.baseUrl ?? "https://generativelanguage.googleapis.com/v1beta";
  }

  async generate(input: ImageRequest): Promise<ProviderResult> {
    const request = normalizeRequest(input);
    if (!this.apiKey) {
      throw new Error("GEMINI_API_KEY is required");
    }

    const prompt = request.negativePrompt
      ? `${request.prompt}\n\nAvoid: ${request.negativePrompt}`
      : request.prompt;
    const inputs: Array<Record<string, string>> = [{ type: "text", text: prompt }];
    for (const path of request.images ?? []) {
      inputs.push({ type: "image", mime_type: "image/png", data: (await readFile(path)).toString("base64") });
    }

    const body = {
      model: this.model,
      input: inputs,
      response_format: { type: "image", aspect_ratio: aspectRatio(request.size), image_size: imageSize(request.size) },
    };
    const images: ProviderResult["images"] = [];

    for (let index = 0; index < request.count; index += 1) {
      const response = await fetch(`${this.baseUrl}/interactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": this.apiKey },
        body: JSON.stringify(body),
      });
      const result = await expectJson(response);
      const output = result.output_image;
      if (typeof output !== "object" || output === null || !("data" in output) || typeof output.data !== "string") {
        throw new Error("Gemini response is missing output_image.data");
      }
      images.push({ data: Buffer.from(output.data, "base64"), mimeType: "image/png" });
    }

    return { provider: this.name, model: this.model, images };
  }
}

function aspectRatio(size: { width: number; height: number }): string {
  const ratio = size.width / size.height;
  if (Math.abs(ratio - 1) < 0.05) return "1:1";
  return ratio > 1 ? "16:9" : "9:16";
}

function imageSize(size: { width: number; height: number }): string {
  return Math.max(size.width, size.height) >= 2048 ? "2K" : "1K";
}
