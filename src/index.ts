import type { ImageProvider, ProviderName } from "./core/types.js";
import { GoogleNanoBananaProvider } from "./providers/google.js";
import { OpenAIImageProvider } from "./providers/openai.js";
import { QwenImageProvider } from "./providers/qwen.js";

export function createProvider(name: ProviderName): ImageProvider {
  switch (name) {
    case "openai": return new OpenAIImageProvider();
    case "google": return new GoogleNanoBananaProvider();
    case "qwen": return new QwenImageProvider();
  }
}

export { saveResult } from "./core/output.js";
export { normalizeRequest, parseSize } from "./core/validation.js";
export type * from "./core/types.js";
