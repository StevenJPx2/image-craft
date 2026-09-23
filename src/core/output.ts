import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { ProviderResult } from "./types.js";

export async function saveResult(result: ProviderResult, outputDir: string): Promise<string[]> {
  await mkdir(outputDir, { recursive: true });
  const paths: string[] = [];

  for (const [index, image] of result.images.entries()) {
    const extension = image.mimeType === "image/jpeg" ? "jpg" : "png";
    const path = join(outputDir, `${result.provider}-${Date.now()}-${index + 1}.${extension}`);

    await writeFile(path, image.data);
    paths.push(path);
  }

  return paths;
}
