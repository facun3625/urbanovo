export function toWhatsAppLink(value: string) {
  if (/^https?:\/\//i.test(value)) return value;
  return `https://wa.me/${toArgentineWhatsAppDigits(value)}`;
}

// A diferencia de toWhatsAppLink (abre el chat vacío), esta arma el link
// con el mensaje ya cargado — el admin solo tiene que apretar enviar en
// WhatsApp Web.
export function toWhatsAppMessageLink(phone: string, text: string) {
  return `https://wa.me/${toArgentineWhatsAppDigits(phone)}?text=${encodeURIComponent(text)}`;
}

// Teléfonos cargados "a la argentina" (342 4123456, 0342-15-4123456) al
// formato internacional que pide wa.me: 54 9 + característica + número.
export function toArgentineWhatsAppDigits(phone: string) {
  let digits = phone.replace(/[^\d]/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("54")) {
    digits = digits.slice(2);
    if (digits.startsWith("9")) digits = digits.slice(1);
  }
  if (digits.startsWith("0")) digits = digits.slice(1);
  // El "15" del celular va después de la característica (2 a 4 dígitos).
  if (digits.length === 12) digits = digits.replace(/^(\d{2,4}?)15(\d{6,8})$/, "$1$2");
  return digits.length === 10 ? `549${digits}` : phone.replace(/[^\d]/g, "");
}

// Abre WhatsApp Web con el mensaje listo (panel, para escribirle a un cliente).
export function toWhatsAppWebLink(phone: string, text: string) {
  return `https://web.whatsapp.com/send?phone=${toArgentineWhatsAppDigits(phone)}&text=${encodeURIComponent(text)}`;
}

// Usuario cargado como "@usuario", "/usuario" o "instagram.com/usuario".
function cleanHandle(value: string, domain: RegExp) {
  return value.trim().replace(domain, "").replace(/^[/@]+/, "").replace(/\/+$/, "");
}

export function toInstagramLink(value: string) {
  if (/^https?:\/\//i.test(value)) return value;
  return `https://instagram.com/${cleanHandle(value, /^(www\.)?instagram\.com/i)}`;
}

export function toFacebookLink(value: string) {
  if (/^https?:\/\//i.test(value)) return value;
  return `https://facebook.com/${cleanHandle(value, /^(www\.)?facebook\.com/i)}`;
}

export function toYoutubeLink(value: string) {
  if (/^https?:\/\//i.test(value)) return value;
  return `https://youtube.com/@${cleanHandle(value, /^(www\.)?youtube\.com/i)}`;
}
