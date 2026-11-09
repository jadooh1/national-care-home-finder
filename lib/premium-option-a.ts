export const PRODUCTION_SUPABASE_HOST = "yiehgstweswxjakbcdzc.supabase.co";
export const DEVELOPMENT_SUPABASE_HOST = "ajjsyloyihcqdomywhik.supabase.co";

export const PREMIUM_PRICE_CENTS = 9900;
export const PREMIUM_CURRENCY = "usd";
export const PREMIUM_INTERVAL = "month";
export const PREMIUM_PROVIDER = "development-ledger";

const OPEN_STATUSES = ["active", "trialing"] as const;

export type PremiumStatus =
  | "incomplete"
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "unpaid";

export type EntitlementTier = "free" | "premium";

export type Entitlement = {
  id: string;
  tier: EntitlementTier;
  en: string;
  es: string;
};

export const ENTITLEMENTS: readonly Entitlement[] = [
  {
    id: "washington-directory",
    tier: "free",
    en: "Search the Washington adult family home directory.",
    es: "Buscar el directorio de hogares de acogida para adultos de Washington.",
  },
  {
    id: "washington-map",
    tier: "free",
    en: "Use the Washington map.",
    es: "Usar el mapa de Washington.",
  },
  {
    id: "official-listing",
    tier: "free",
    en: "Read official DSHS name, address, license, capacity, and status.",
    es: "Leer el nombre, la dirección, la licencia, la capacidad y el estado oficiales de DSHS.",
  },
  {
    id: "languages",
    tier: "free",
    en: "Use English and Spanish.",
    es: "Usar inglés y español.",
  },
  {
    id: "owner-account",
    tier: "free",
    en: "Register, sign in, and recover an owner password.",
    es: "Crear una cuenta, iniciar sesión y recuperar la contraseña de propietario.",
  },
  {
    id: "facility-claim",
    tier: "free",
    en: "Submit a facility claim and see its review status.",
    es: "Enviar un reclamo del centro y ver el estado de la revisión.",
  },
  {
    id: "administrator-review",
    tier: "free",
    en: "An administrator can approve or reject a claim or a listing proposal.",
    es: "Un administrador puede aprobar o rechazar un reclamo o una propuesta de ficha.",
  },
  {
    id: "oregon-unpublished",
    tier: "free",
    en: "Oregon listings stay unpublished.",
    es: "Los listados de Oregon permanecen sin publicar.",
  },
  {
    id: "owner-listing-text",
    tier: "premium",
    en: "Show the approved owner description, services, and amenities for one facility.",
    es: "Mostrar la descripción, los servicios y las comodidades aprobados del propietario para un centro.",
  },
];

export type DevelopmentCheckout = {
  mode: "development";
  chargesCard: false;
  amountCents: typeof PREMIUM_PRICE_CENTS;
  currency: typeof PREMIUM_CURRENCY;
  interval: typeof PREMIUM_INTERVAL;
  provider: typeof PREMIUM_PROVIDER;
};

export function premiumPeriodOpen(status: string, periodEnd: Date, now: Date): boolean {
  return (OPEN_STATUSES as readonly string[]).includes(status) && periodEnd.getTime() > now.getTime();
}

export function developmentBillingAllowed(supabaseUrl: string): boolean {
  try {
    return new URL(supabaseUrl).hostname === DEVELOPMENT_SUPABASE_HOST;
  } catch {
    return false;
  }
}

export function developmentCheckoutIntent(supabaseUrl: string): DevelopmentCheckout {
  if (!developmentBillingAllowed(supabaseUrl)) {
    throw new Error("Development billing is closed for this project.");
  }
  return {
    mode: "development",
    chargesCard: false,
    amountCents: PREMIUM_PRICE_CENTS,
    currency: PREMIUM_CURRENCY,
    interval: PREMIUM_INTERVAL,
    provider: PREMIUM_PROVIDER,
  };
}
