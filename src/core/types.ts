export type ProviderName = "openai" | "qwen" | "google";

export type ImageOperation = "generate" | "edit";

export interface ImageSize {
  width: number;
  height: number;
}

export interface ImageRequest {
  operation: ImageOperation;
  prompt: string;
  negativePrompt?: string;
  images?: string[];
  size?: ImageSize;
  count?: number;
  seed?: number;
}

export interface GeneratedImage {
  data: Uint8Array;
  mimeType: string;
}

export interface ProviderResult {
  provider: ProviderName;
  model: string;
  images: GeneratedImage[];
}

export interface ImageProvider {
  readonly name: ProviderName;
  readonly model: string;
  generate(request: ImageRequest): Promise<ProviderResult>;
}
