const HEALTH_DETAIL = /\b(diagnos(?:is|ed)|dementia|alzheimer|medication|medications|hipaa|medical record|diagn[oó]stico|demencia|medicamento|historial m[eé]dico)\b/i;

export function feedbackPagePath(path: string): string | null {
  const bare = path.split("?")[0].split("#")[0];
  return /^\/washington(?:\/[0-9]{1,20})?$/.test(bare) ? bare : null;
}

export function feedbackComment(value: string): { comment: string | null; error: "health" | "length" | null } {
  const trimmed = value.replace(/\s+/g, " ").trim();
  if (!trimmed) return { comment: null, error: null };
  if (trimmed.length > 500) return { comment: null, error: "length" };
  if (HEALTH_DETAIL.test(trimmed)) return { comment: null, error: "health" };
  return { comment: trimmed, error: null };
}

export type PreparedFeedback = {
  found: boolean;
  comment: string | null;
  language: "en" | "es";
  pagePath: string;
};

export function prepareVisitorFeedback(input: {
  honeypot: string;
  elapsedMs: number;
  found: string;
  language: string;
  pagePath: string;
  comment: string;
}): { ok: true; value: PreparedFeedback } | { ok: false; error: "spam" | "found" | "language" | "path" | "health" | "length" } {
  if (input.honeypot.trim() !== "") return { ok: false, error: "spam" };
  if (!Number.isFinite(input.elapsedMs) || input.elapsedMs < 3000 || input.elapsedMs > 30 * 60 * 1000) {
    return { ok: false, error: "spam" };
  }
  if (input.found !== "yes" && input.found !== "no") return { ok: false, error: "found" };
  if (input.language !== "en" && input.language !== "es") return { ok: false, error: "language" };
  const pagePath = feedbackPagePath(input.pagePath);
  if (!pagePath) return { ok: false, error: "path" };
  const comment = feedbackComment(input.comment);
  if (comment.error) return { ok: false, error: comment.error };
  return {
    ok: true,
    value: {
      found: input.found === "yes",
      comment: comment.comment,
      language: input.language,
      pagePath,
    },
  };
}
