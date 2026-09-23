# image-craft

`image-craft` is a small TypeScript image-generation harness with one provider interface, a CLI, and an MCP server. It supports generation and editing through:

- **OpenAI GPT Image** (`OPENAI_API_KEY`, default model `gpt-image-2.5-sunburst`; set `OPENAI_IMAGE_MODEL` for another available model)
- **Google Nano Banana / Gemini image** (`GEMINI_API_KEY`, default model `gemini-3.1-flash-image`)
- **Local Qwen Image** through Diffusers on Apple Silicon MPS (`QWEN_IMAGE_MODEL`, default `Qwen/Qwen-Image`)

## Install

```sh
npm install
npm run build
```

Node 20+ is required for native `fetch`, `FormData`, and `Blob`.

## CLI

```sh
export OPENAI_API_KEY=...
node dist/src/cli.js generate openai --prompt "a glass frog in a mossy forest" --size 1024x1024 --count 2 --output-dir outputs
node dist/src/cli.js edit google --prompt "turn the sky pink" --image input.png --output-dir outputs
node dist/src/cli.js generate qwen --prompt "a red paper kite" --negative-prompt "blurry" --seed 42
```

The CLI and MCP server also load a local `.env` file automatically. It is ignored by Git; never commit it.

Options: `--prompt`, repeatable `--image`, `--negative-prompt`, `--size WIDTHxHEIGHT`, `--count`, `--seed`, and `--output-dir`.

Provider environment variables:

| Provider | Variables |
| --- | --- |
| OpenAI | `OPENAI_API_KEY`, optional `OPENAI_IMAGE_MODEL`, `OPENAI_BASE_URL` |
| Google | `GEMINI_API_KEY` or `GOOGLE_API_KEY`, optional `GEMINI_IMAGE_MODEL` |
| Qwen | `QWEN_IMAGE_MODEL`, `QWEN_IMAGE_COMMAND`, `QWEN_IMAGE_SCRIPT` |

Keys are read only from the environment; do not commit them. Provider capabilities differ: OpenAI receives negative prompts as prompt guidance, Google maps size to aspect ratio/1K-or-2K and generates counts sequentially, and local Qwen owns the actual seed.

## MCP server

The server speaks newline-delimited JSON-RPC over stdio and exposes `image_generate`:

```sh
node dist/src/mcp.js
```

It implements `initialize`, `tools/list`, and `tools/call`, so it can be launched by MCP clients as a stdio server.

## Local Qwen setup

The bridge requires Python packages compatible with the current Diffusers Qwen Image pipelines:

```sh
python3 -m pip install torch diffusers transformers accelerate pillow
```

On Apple Silicon it selects `mps` when available. Override the model or bridge command when using a local Qwen checkpoint:

```sh
export QWEN_IMAGE_MODEL=Qwen/Qwen-Image
export QWEN_IMAGE_COMMAND=python3
```

## Verification

```sh
npm test
```

The tests cover the provider-neutral request contract. Live provider calls are intentionally opt-in because they require credentials and, for Qwen, model downloads.

## Official contracts consulted

- [OpenAI image generation](https://developers.openai.com/api/docs/guides/image-generation) and [Create image API reference](https://developers.openai.com/api/reference/resources/images/methods/generate/)
- [Google Nano Banana image generation](https://ai.google.dev/gemini-api/docs/image-generation)
- [Diffusers QwenImage pipelines](https://huggingface.co/docs/diffusers/api/pipelines/qwenimage)
