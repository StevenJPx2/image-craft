import type { ImageRequest, ImageSize } from "./types.js";

const DEFAULT_SIZE: ImageSize = { width: 1024, height: 1024 };

export function normalizeRequest(request: ImageRequest): ImageRequest & { size: ImageSize; count: number } {
  if (!request.prompt.trim()) {
    throw new Error("prompt must not be empty");
  }

  if (request.operation === "edit" && (!request.images || request.images.length === 0)) {
    throw new Error("edit requires at least one image path");
  }

  const size = request.size ?? DEFAULT_SIZE;
  if (!Number.isInteger(size.width) || !Number.isInteger(size.height) || size.width < 1 || size.height < 1) {
    throw new Error("size must contain positive integer width and height");
  }

  const count = request.count ?? 1;
  if (!Number.isInteger(count) || count < 1 || count > 10) {
    throw new Error("count must be an integer between 1 and 10");
  }

  return { ...request, size, count };
}

export function parseSize(value: string): ImageSize {
  const match = /^(\d+)x(\d+)$/.exec(value);
  if (!match) {
    throw new Error(`invalid size '${value}', expected WIDTHxHEIGHT`);
  }

  return { width: Number(match[1]), height: Number(match[2]) };
}

export function imageSizeLabel(size: ImageSize): string {
  return `${size.width}x${size.height}`;
}
