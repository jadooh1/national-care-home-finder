const PRODUCTION_SITE_HOSTS = new Set([
  "www.nationalcarehomefinder.com",
  "nationalcarehomefinder.com",
]);

export function analyticsHost(host: string): string {
  return host.split(":")[0].trim().toLowerCase();
}

export function measurementIdReady(host: string, configured: string | undefined): string | null {
  if (PRODUCTION_SITE_HOSTS.has(analyticsHost(host))) return null;
  if (!configured || !/^G-[A-Z0-9]{6,16}$/.test(configured)) return null;
  return configured;
}
