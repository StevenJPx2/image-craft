export async function expectJson(response: Response): Promise<Record<string, unknown>> {
  const body: unknown = await response.json();

  if (!response.ok) {
    const message = typeof body === "object" && body !== null && "error" in body
      ? JSON.stringify(body.error)
      : response.statusText;
    throw new Error(`provider request failed (${response.status}): ${message}`);
  }

  if (typeof body !== "object" || body === null) {
    throw new Error("provider returned a non-object JSON response");
  }

  return body as Record<string, unknown>;
}

export function requireString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`provider response is missing ${field}`);
  }

  return value;
}
