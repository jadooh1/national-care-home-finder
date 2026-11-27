export const PASSWORD_RECOVERY_FLAG = "nchf.password-recovery";
export const AUTH_CALLBACK_PATH = "/auth/callback";

/** Matches PUBLIC_CANONICAL_ORIGIN — kept local so Node proposal tests need no ESM path. */
const PRODUCTION_WWW_ORIGIN = "https://www.nationalcarehomefinder.com";
const PRODUCTION_APEX_HOST = "nationalcarehomefinder.com";

const OTP_TYPES = ["signup", "email", "magiclink", "recovery", "invite"] as const;
export type RecoveryOtpType = (typeof OTP_TYPES)[number];

export type CapturedAuthCallback = {
  hadAuthParams: boolean;
  recovery: boolean;
  code: string | null;
  tokenHash: string | null;
  otpType: RecoveryOtpType | null;
  handedOff: boolean;
};

const FLOW_ID = /^[a-zA-Z0-9_-]{8,64}$/;

function isOtpType(value: string | null): value is RecoveryOtpType {
  return value !== null && (OTP_TYPES as readonly string[]).includes(value);
}

function verifierMarksRecovery(flowId: string | null): boolean {
  if (!flowId || !FLOW_ID.test(flowId)) return false;
  try {
    const suffix = `-flow-${flowId}-code-verifier`;
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (!key || !key.endsWith(suffix)) continue;
      const stored = localStorage.getItem(key) ?? "";
      return stored.slice(stored.lastIndexOf("/") + 1) === "recovery";
    }
  } catch {
    return false;
  }
  return false;
}

export function passwordProblem(password: string, confirmation: string): string | null {
  if (password.length < 12 || password.length > 72) return "Use 12 to 72 characters.";
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) return "Use at least one letter and one number.";
  if (password !== confirmation) return "Those passwords do not match.";
  return null;
}

/** Prefer www canonical origin when recovery starts from the apex host. */
export function recoveryRedirectOrigin(origin: string): string {
  try {
    const url = new URL(origin);
    if (url.hostname === PRODUCTION_APEX_HOST) return PRODUCTION_WWW_ORIGIN;
    return url.origin;
  } catch {
    return origin;
  }
}

export function recoveryRedirectUrl(): string | null {
  const url = new URL(window.location.origin);
  const local = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  if (url.protocol !== "https:" && !(url.protocol === "http:" && local)) return null;
  return `${recoveryRedirectOrigin(url.origin)}${AUTH_CALLBACK_PATH}`;
}

/**
 * True when the URL carries Supabase Auth callback credentials or errors
 * (query or hash). Used to hand off Site-URL fallbacks (often `/`) to
 * `/auth/callback` before any page strips the params.
 */
export function authCallbackParamsPresent(href: string): boolean {
  const url = new URL(href);
  const hash = new URLSearchParams(url.hash.startsWith("#") ? url.hash.slice(1) : "");
  const type = url.searchParams.get("type") || hash.get("type");
  return Boolean(
    type ||
    url.searchParams.get("code") ||
    url.searchParams.get("token_hash") ||
    hash.get("access_token") ||
    hash.get("refresh_token") ||
    url.searchParams.get("error") ||
    url.searchParams.get("error_description") ||
    hash.get("error") ||
    hash.get("error_description") ||
    url.searchParams.get("sb_flow_id")
  );
}

/**
 * When Auth lands on Site URL (`/`) or another non-callback path with tokens,
 * return the `/auth/callback` URL that preserves search + hash. Null when
 * already on the callback path or no auth params are present.
 */
export function authCallbackHandoffHref(href: string): string | null {
  const url = new URL(href);
  if (url.pathname === AUTH_CALLBACK_PATH) return null;
  if (!authCallbackParamsPresent(href)) return null;
  return `${url.origin}${AUTH_CALLBACK_PATH}${url.search}${url.hash}`;
}

let recoveryInThisTab = false;

export function recoveryPending(): boolean {
  if (recoveryInThisTab) return true;
  try {
    return localStorage.getItem(PASSWORD_RECOVERY_FLAG) === "1";
  } catch {
    return false;
  }
}

export function markRecoveryPending(): void {
  recoveryInThisTab = true;
  try {
    localStorage.setItem(PASSWORD_RECOVERY_FLAG, "1");
  } catch {
    // The in-memory flag still keeps this tab on the reset page.
  }
}

export function clearRecoveryPending(): void {
  recoveryInThisTab = false;
  try {
    localStorage.removeItem(PASSWORD_RECOVERY_FLAG);
  } catch {
    // The in-memory flag is already clear.
  }
}

export function captureAndStripAuthCallback(): CapturedAuthCallback {
  const empty: CapturedAuthCallback = {
    hadAuthParams: false,
    recovery: false,
    code: null,
    tokenHash: null,
    otpType: null,
    handedOff: false,
  };
  if (typeof window === "undefined") return empty;
  const url = new URL(window.location.href);
  const hash = new URLSearchParams(url.hash.startsWith("#") ? url.hash.slice(1) : "");
  const type = url.searchParams.get("type") || hash.get("type");
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const hasCredential = Boolean(
    code ||
    tokenHash ||
    hash.get("access_token") ||
    hash.get("refresh_token") ||
    url.searchParams.get("error") ||
    url.searchParams.get("error_description") ||
    hash.get("error") ||
    hash.get("error_description")
  );
  const recovery = type === "recovery" || verifierMarksRecovery(url.searchParams.get("sb_flow_id"));
  if (recovery) markRecoveryPending();

  // Site URL / allowlist fallback often opens `/` (or another app route) with
  // the Auth params. Never strip those here — hand off to `/auth/callback`
  // so exchangeCodeForSession / verifyOtp still receive them.
  const handoff = authCallbackHandoffHref(window.location.href);
  if (handoff) {
    window.location.replace(handoff);
    return {
      hadAuthParams: true,
      recovery,
      code: null,
      tokenHash: null,
      otpType: isOtpType(type) ? type : null,
      handedOff: true,
    };
  }

  if (hasCredential || type) {
    try {
      window.history.replaceState(window.history.state, "", url.pathname);
    } catch {
      window.location.hash = "";
    }
  }
  return {
    hadAuthParams: hasCredential || type !== null,
    recovery,
    code,
    tokenHash,
    otpType: isOtpType(type) ? type : null,
    handedOff: false,
  };
}
