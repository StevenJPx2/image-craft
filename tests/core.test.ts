import test from "node:test";
import assert from "node:assert/strict";
import { createProvider, normalizeRequest, parseSize } from "../src/index.js";

test("normalizes defaults without changing provider-specific fields", () => {
  const request = normalizeRequest({ operation: "generate", prompt: "a red fox" });
  assert.deepEqual(request.size, { width: 1024, height: 1024 });
  assert.equal(request.count, 1);
});

test("requires images for edits", () => {
  assert.throws(() => normalizeRequest({ operation: "edit", prompt: "make it blue" }), /edit requires/);
});

test("parses the shared size syntax", () => {
  assert.deepEqual(parseSize("1536x1024"), { width: 1536, height: 1024 });
  assert.throws(() => parseSize("square"), /expected WIDTHxHEIGHT/);
});

test("constructs every provider behind the common interface", () => {
  assert.equal(createProvider("openai").name, "openai");
  assert.equal(createProvider("google").name, "google");
  assert.equal(createProvider("qwen").name, "qwen");
});
