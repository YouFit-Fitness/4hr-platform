/**
 * Coach contact details for the client app. Edit here (or set the env var) to
 * change the WhatsApp number everywhere it's used.
 */
export const COACH = {
  name: "Youssef Klait",
  // Digits only, international format (no "+" or spaces) — for wa.me links.
  whatsapp: (process.env.NEXT_PUBLIC_COACH_WHATSAPP ?? "96170918198").replace(/[^\d]/g, ""),
};

/** A WhatsApp deep link, optionally with a prefilled message. */
export function whatsappLink(message?: string): string {
  const base = `https://wa.me/${COACH.whatsapp}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
