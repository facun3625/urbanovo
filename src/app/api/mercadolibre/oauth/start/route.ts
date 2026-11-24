import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

import { requireTenantAdmin } from "@/lib/require-admin";
import { getMercadoLibreSettings } from "@/lib/mercadolibre/settings";
import { buildAuthorizationUrl, publicOrigin } from "@/lib/mercadolibre/auth";

export const dynamic = "force-dynamic";

const STATE_COOKIE = "ml_oauth_state";

// El botón "Conectar con Mercado Libre" apunta acá en vez de armar el link
// directo — necesitamos generar y guardar el `state` (protección CSRF del
// OAuth) antes de mandar al visitante a mercadolibre.com.ar.
export async function GET() {
  const { tenant } = await requireTenantAdmin();
  const settings = await getMercadoLibreSettings(tenant.id);
  if (!settings.clientId) {
    return NextResponse.redirect(new URL("/admin/configuracion?tab=mercadolibre&mlError=sin_client_id", publicOrigin()));
  }

  const state = randomUUID();
  const response = NextResponse.redirect(buildAuthorizationUrl(settings.clientId, state));
  response.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    // 30 minutos: cerrar sesión en Mercado Libre y entrar con la cuenta de
    // la inmobiliaria puede llevar más de los 10 que había.
    maxAge: 30 * 60,
    path: "/",
  });
  return response;
}
