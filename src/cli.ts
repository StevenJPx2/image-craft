#!/usr/bin/env node
import "./env.js";
import { createProvider, parseSize, saveResult } from "./index.js";
import type { ImageOperation, ProviderName } from "./core/types.js";

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const operation = args[0] as ImageOperation | undefined;
  const provider = args[1] as ProviderName | undefined;
  const prompt = value(args, "--prompt");
  if ((operation !== "generate" && operation !== "edit") || !provider || !prompt) {
    throw new Error("usage: image-craft <generate|edit> <openai|google|qwen> --prompt TEXT [options]");
  }

  const images = values(args, "--image");
  const negativePrompt = value(args, "--negative-prompt");
  const sizeValue = value(args, "--size");
  const countValue = value(args, "--count");
  const seedValue = value(args, "--seed");
  const request = {
    operation,
    prompt,
    ...(images.length > 0 ? { images } : {}),
    ...(negativePrompt ? { negativePrompt } : {}),
    ...(sizeValue ? { size: parseSize(sizeValue) } : {}),
    ...(countValue ? { count: Number(countValue) } : {}),
    ...(seedValue ? { seed: Number(seedValue) } : {}),
  };
  const result = await createProvider(provider).generate(request);
  const paths = await saveResult(result, value(args, "--output-dir") ?? "outputs");

  for (const path of paths) console.log(path);
}

function value(args: string[], flag: string): string | undefined {
  const index = args.indexOf(flag);
  const result = index >= 0 ? args[index + 1] : undefined;
  return result;
}

function values(args: string[], flag: string): string[] {
  const result: string[] = [];
  for (let index = 0; index < args.length; index += 1) {
    const next = args[index + 1];
    if (args[index] === flag && next) result.push(next);
  }
  return result;
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
