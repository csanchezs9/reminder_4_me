export function extractJsonBlock(text: string): string | null {
  const trimmed = text.trim();

  if (trimmed.startsWith("```")) {
    const withoutFences = trimmed.replace(/^```[a-zA-Z]*\n?/, "").replace(/```$/, "");
    return withoutFences.trim();
  }

  const match = trimmed.match(/\{[\s\S]*\}/);
  return match ? match[0] : null;
}

export function safeJsonParse<T>(text: string): T | null {
  const json = extractJsonBlock(text);
  if (!json) {
    return null;
  }

  try {
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
