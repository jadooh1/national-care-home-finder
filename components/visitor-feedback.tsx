"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useLanguage } from "./language";
import { developmentBillingAllowed } from "../lib/premium-option-a";
import { supabase } from "../lib/supabase";
import { prepareVisitorFeedback } from "../lib/visitor-feedback";

const copy = {
  en: {
    title: "Was this page useful?",
    question: "Did you find what you needed?",
    yes: "Yes",
    no: "No",
    comment: "Optional comment",
    caution: "Do not include a resident’s name, diagnosis, medications, or other health information.",
    send: "Send feedback",
    sent: "Thank you. The comment was sent for administrator review.",
    health: "Please remove health details. This form does not collect resident health information.",
    invalid: "The comment could not be sent. Check it and try again.",
    spam: "Please wait a moment and try again.",
  },
  es: {
    title: "¿Fue útil esta página?",
    question: "¿Encontró lo que necesitaba?",
    yes: "Sí",
    no: "No",
    comment: "Comentario opcional",
    caution: "No incluya el nombre, el diagnóstico, los medicamentos ni otra información de salud de un residente.",
    send: "Enviar comentario",
    sent: "Gracias. El comentario se envió para la revisión del administrador.",
    health: "Quite los datos de salud. Este formulario no recoge información de salud del residente.",
    invalid: "No se pudo enviar el comentario. Revíselo e inténtelo de nuevo.",
    spam: "Espere un momento e inténtelo de nuevo.",
  },
} as const;

export function VisitorFeedback({ pagePath }: { pagePath: string }) {
  const { locale } = useLanguage();
  const text = copy[locale];
  const opened = useRef(0);
  const [found, setFound] = useState<"yes" | "no" | "">("");
  const [comment, setComment] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const enabled = developmentBillingAllowed(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "");

  useEffect(() => {
    opened.current = Date.now();
  }, []);

  if (!enabled) return null;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setNotice("");
    setError("");
    const prepared = prepareVisitorFeedback({
      honeypot,
      elapsedMs: Date.now() - opened.current,
      found,
      language: locale,
      pagePath,
      comment,
    });
    if (!prepared.ok) {
      setError(prepared.error === "health" ? text.health : prepared.error === "spam" ? text.spam : text.invalid);
      return;
    }
    setSending(true);
    const result = await supabase.rpc("submit_visitor_feedback", {
      p_found: prepared.value.found,
      p_comment: prepared.value.comment,
      p_language: prepared.value.language,
      p_page_path: prepared.value.pagePath,
      p_company: honeypot,
      p_elapsed_ms: Math.round(Date.now() - opened.current),
    });
    setSending(false);
    if (result.error) {
      const message = result.error.message ?? "";
      setError(message.includes("health") ? text.health : message.includes("rejected") ? text.spam : text.invalid);
      return;
    }
    setFound("");
    setComment("");
    setNotice(text.sent);
  }

  return (
    <form onSubmit={submit} aria-labelledby="visitor-feedback-title" style={{ marginTop: 28, padding: 22, border: "1px solid #dbe5eb", borderRadius: 16, background: "white" }}>
      <h2 id="visitor-feedback-title" style={{ margin: "0 0 8px", fontSize: 22, color: "#123c59" }}>{text.title}</h2>
      <p style={{ margin: "0 0 12px", color: "#536b7c" }}>{text.question}</p>
      <div style={{ display: "flex", gap: 16 }}>
        <label><input type="radio" name="found" value="yes" checked={found === "yes"} onChange={() => setFound("yes")} /> {text.yes}</label>
        <label><input type="radio" name="found" value="no" checked={found === "no"} onChange={() => setFound("no")} /> {text.no}</label>
      </div>
      <label style={{ display: "block", marginTop: 14 }}>
        {text.comment}
        <textarea value={comment} onChange={(event) => setComment(event.target.value)} maxLength={500} rows={4} style={{ display: "block", width: "100%", marginTop: 6, boxSizing: "border-box", padding: 12, borderRadius: 10, border: "1px solid #dbe5eb" }} />
      </label>
      <p style={{ color: "#536b7c", fontSize: 14 }}>{text.caution}</p>
      <label style={{ position: "absolute", left: -10000, top: "auto", width: 1, height: 1, overflow: "hidden" }} aria-hidden="true">
        Company
        <input tabIndex={-1} autoComplete="off" value={honeypot} onChange={(event) => setHoneypot(event.target.value)} />
      </label>
      <button type="submit" disabled={sending || found === ""} style={{ padding: "11px 16px", color: "white", background: "#176b53", border: 0, borderRadius: 9, cursor: "pointer" }}>{text.send}</button>
      {notice && <p role="status">{notice}</p>}
      {error && <p role="alert" style={{ color: "#a32222" }}>{error}</p>}
    </form>
  );
}
