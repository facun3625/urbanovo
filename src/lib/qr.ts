import { SITE_URL } from "@/lib/site-url";

// Dirección que va impresa en el QR. Un QR impreso no se puede corregir:
// en producción QR_BASE_URL tiene que ser el dominio definitivo. Sin la
// variable se usa el del sitio (ROOT_DOMAIN).
const QR_BASE_URL = process.env.QR_BASE_URL ?? SITE_URL;

export function propertyQrUrl(propertyId: string) {
  return `${QR_BASE_URL}/qr/${propertyId}`;
}

export const QR_COOKIE = "urbanovo_qr_lead";
