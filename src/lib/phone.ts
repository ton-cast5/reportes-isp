export function digitsOnly(phone: string) {
  return phone.replace(/\D/g, "");
}

/** Normaliza a formato wa.me (México: 10 dígitos → 52…) */
export function toWhatsAppNumber(phone: string) {
  let digits = digitsOnly(phone);
  if (digits.startsWith("52") && digits.length >= 12) return digits;
  if (digits.length === 10) return `52${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `52${digits.slice(1)}`;
  return digits;
}

export function whatsappUrl(phone: string, message?: string) {
  const n = toWhatsAppNumber(phone);
  if (!n) return null;
  const base = `https://wa.me/${n}`;
  if (!message) return base;
  return `${base}?text=${encodeURIComponent(message)}`;
}

export function telUrl(phone: string) {
  const n = digitsOnly(phone);
  return n ? `tel:+${toWhatsAppNumber(phone)}` : null;
}
