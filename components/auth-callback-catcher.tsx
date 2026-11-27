"use client";

import { useEffect } from "react";
import { authCallbackHandoffHref } from "../lib/password-recovery";

/**
 * Catches Supabase Auth redirects that land on Site URL (`/`) or any route
 * other than `/auth/callback`, and hands the intact query/hash to the
 * dedicated callback page for code exchange / recovery routing.
 */
export function AuthCallbackCatcher() {
  useEffect(() => {
    const handoff = authCallbackHandoffHref(window.location.href);
    if (!handoff) return;
    window.location.replace(handoff);
  }, []);
  return null;
}
