import "dotenv/config";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";

import { prisma } from "../src/lib/prisma";

const TENANT_ID = "urbanovo-tenant";
const ADMIN_EMAIL = "admin@urbanovo.com.ar";

// Arranque limpio: sin propiedades, fotos ni textos de ejemplo. Solo la
// identidad mínima y los catálogos genéricos, para empezar a cargar todo
// desde el admin (las fotos se suben al bucket R2 "urbanovo").
const SETTINGS: Record<string, string> = {
  store_name: "Urbanovo Inmobiliaria",
  seo_title: "Urbanovo Inmobiliaria · Propiedades",
  store_show_name_in_header: "true",
  store_template: "clasico",
  store_header_bg_color: "#ffffff",
  store_menu_bg_color: "#1c3054",
  store_footer_bg_color: "#1c3054",
  store_button_color: "#51c2ec",
  store_badge_color: "#51c2ec",
  store_logo_height: "100",
  store_footer_logo_height: "100",
  catalog_filters: "city,operation,propertyType,bedrooms",
};

const PROPERTY_TYPES = ["Casa", "Departamento", "Terreno", "Local", "Oficina", "Galpón", "Campo", "Cochera"];
const CONTRACT_TYPES = ["Residencial", "Comercial"];
const PROPERTY_DESTINATIONS = ["Vivienda", "Comercio", "Depósito"];

const withOrder = (names: string[]) =>
  names.map((name, order) => ({ tenantId: TENANT_ID, name, order }));

async function main() {
  const existing = await prisma.tenant.findFirst();
  if (existing) {
    console.log(`Ya existe un Tenant (${existing.id}) — no se vuelve a sembrar.`);
    return;
  }

  await prisma.tenant.create({ data: { id: TENANT_ID } });

  await prisma.settings.createMany({
    data: Object.entries(SETTINGS).map(([key, value]) => ({ tenantId: TENANT_ID, key, value })),
  });

  await prisma.estatePropertyType.createMany({ data: withOrder(PROPERTY_TYPES) });
  await prisma.estateContractType.createMany({ data: withOrder(CONTRACT_TYPES) });
  await prisma.estatePropertyDestination.createMany({ data: withOrder(PROPERTY_DESTINATIONS) });

  const password = randomBytes(9).toString("base64").replace(/[+/=]/g, "").slice(0, 12);
  await prisma.user.create({
    data: {
      tenantId: TENANT_ID,
      name: "Admin",
      email: ADMIN_EMAIL,
      role: "ADMIN",
      passwordHash: await bcrypt.hash(password, 10),
    },
  });

  console.log("Seed completo.");
  console.log(`Tenant: ${TENANT_ID}`);
  console.log(`Admin:  ${ADMIN_EMAIL} / ${password}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
