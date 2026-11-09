"use client";

import { useEffect } from "react";
import { measurementIdReady } from "../lib/analytics";

export function SiteAnalytics() {
  useEffect(() => {
    const measurementId = measurementIdReady(
      window.location.host,
      process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
    );
    if (!measurementId || document.getElementById("nchf-ga4")) return;
    const script = document.createElement("script");
    script.id = "nchf-ga4";
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script);
    const inline = document.createElement("script");
    inline.id = "nchf-ga4-config";
    inline.text = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${measurementId}',{anonymize_ip:true});`;
    document.head.appendChild(inline);
  }, []);
  return null;
}
