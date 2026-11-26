import type { Prisma } from "@/generated/prisma/client";

// Siguiente código interno de propiedad cuando no se carga uno: sigue el
// prefijo más usado de la cartera (UN-088 → UN-089) y respeta los ceros.
// Sin propiedades con código numérico, arranca en P-001.
export async function nextPropertyCode(tx: Prisma.TransactionClient, tenantId: string): Promise<string> {
  const rows = await tx.estateProperty.findMany({ where: { tenantId }, select: { code: true } });
  const taken = new Set(rows.map((r) => r.code.toUpperCase()));
  const byPrefix = new Map<string, { count: number; max: number; width: number }>();
  for (const { code } of rows) {
    const match = /^(.*?)(\d+)$/.exec(code.trim());
    if (!match) continue;
    const [, prefix, digits] = match;
    const entry = byPrefix.get(prefix) ?? { count: 0, max: 0, width: 0 };
    entry.count += 1;
    entry.max = Math.max(entry.max, Number(digits));
    entry.width = Math.max(entry.width, digits.length);
    byPrefix.set(prefix, entry);
  }
  let prefix = "P-";
  let best = { count: 0, max: 0, width: 3 };
  for (const [p, entry] of byPrefix) {
    if (entry.count > best.count) {
      prefix = p;
      best = entry;
    }
  }
  let n = best.max + 1;
  let code = `${prefix}${String(n).padStart(best.width, "0")}`;
  while (taken.has(code.toUpperCase())) code = `${prefix}${String(++n).padStart(best.width, "0")}`;
  return code;
}
