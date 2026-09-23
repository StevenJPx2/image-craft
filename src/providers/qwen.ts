import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import type { ImageProvider, ImageRequest, ProviderResult } from "../core/types.js";
import { normalizeRequest } from "../core/validation.js";

export interface QwenOptions {
  command?: string;
  model?: string;
  script?: string;
}

interface BridgeImage {
  data: string;
  mimeType: string;
}

export class QwenImageProvider implements ImageProvider {
  readonly name = "qwen" as const;
  readonly model: string;
  private readonly command: string;
  private readonly script: string;

  constructor(options: QwenOptions = {}) {
    this.command = options.command ?? process.env.QWEN_IMAGE_COMMAND ?? "python3";
    this.script = options.script ?? process.env.QWEN_IMAGE_SCRIPT ?? new URL("../../scripts/qwen_diffusers.py", import.meta.url).pathname;
    this.model = options.model ?? process.env.QWEN_IMAGE_MODEL ?? "Qwen/Qwen-Image";
  }

  async generate(input: ImageRequest): Promise<ProviderResult> {
    const request = normalizeRequest(input);
    const images = await Promise.all((request.images ?? []).map(async (path) => ({ path, data: (await readFile(path)).toString("base64") })));
    const payload = JSON.stringify({ ...request, model: this.model, images });
    const output = await runBridge(this.command, this.script, payload);
    const parsed: unknown = JSON.parse(output);
    if (!Array.isArray(parsed)) {
      throw new Error("Qwen bridge must return an image array");
    }

    return {
      provider: this.name,
      model: this.model,
      images: parsed.map((item) => {
        if (typeof item !== "object" || item === null || !("data" in item) || !("mimeType" in item) || typeof item.data !== "string" || typeof item.mimeType !== "string") {
          throw new Error("Qwen bridge returned an invalid image");
        }
        return { data: Buffer.from(item.data, "base64"), mimeType: item.mimeType };
      }),
    };
  }
}

function runBridge(command: string, script: string, payload: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, [script], { stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8").on("data", (chunk: string) => { stdout += chunk; });
    child.stderr.setEncoding("utf8").on("data", (chunk: string) => { stderr += chunk; });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) reject(new Error(`Qwen bridge failed (${code}): ${stderr.trim()}`));
      else resolve(stdout);
    });
    child.stdin.end(payload);
  });
}
