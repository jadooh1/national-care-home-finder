import { cookies } from "next/headers";
import { LanguageProvider } from "../components/language";
import { SiteAnalytics } from "../components/site-analytics";
import { LANGUAGE_COOKIE, parseLocale } from "../lib/locale";
import { publicPageMetadataFor } from "../lib/public-metadata";

export function generateMetadata() {
  return publicPageMetadataFor("/");
}

export default async function RootLayout({

  children,

}: Readonly<{

  children: React.ReactNode;

}>) {

  const jar = await cookies();
  const locale = parseLocale(jar.get(LANGUAGE_COOKIE)?.value);

  return (

    <html lang={locale}>

      <body style={{ margin: 0 }}>

        <LanguageProvider initialLocale={locale}>{children}</LanguageProvider>
        <SiteAnalytics />

      </body>

    </html>

  );

}
