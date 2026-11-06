export const PASSWORD_RECOVERY_FLAG = "nchf.password-recovery";

const OTP_TYPES = ["signup", "email", "magiclink", "recovery", "invite"] as const;
export type RecoveryOtpType = (typeof OTP_TYPES)[number];

export type CapturedAuthCallback = {
  hadAuthParams: boolean;
  recovery: boolean;
  code: string | null;
  tokenHash: string | null;
  otpType: RecoveryOtpType | null;
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

export function recoveryRedirectUrl(): string | null {
  const url = new URL(window.location.origin);
  const local = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  if (url.protocol !== "https:" && !(url.protocol === "http:" && local)) return null;
  return `${url.origin}/auth/callback`;
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
  if (hasCredential || type) {
    try {
      window.history.replaceState(window.history.state, "", url.pathname);
    } catch {
      window.location.hash = "";
    }
  }
  if (recovery) markRecoveryPending();
  return {
    hadAuthParams: hasCredential || type !== null,
    recovery,
    code,
    tokenHash,
    otpType: isOtpType(type) ? type : null,
  };
}
