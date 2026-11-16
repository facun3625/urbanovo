# Urbanovo Inmobiliaria

Sitio web y panel de gestión de Urbanovo Inmobiliaria. Next.js (App Router)
+ Prisma + PostgreSQL. Las fotos y videos se guardan en Cloudflare R2
(bucket `urbanovo`).

| Parte | Dónde |
|---|---|
| Sitio público | `/` (propiedades, mapa, arquitectura, sobre nosotros, contacto) |
| Panel de administración | `/admin` |

## Arrancar en local

```bash
docker compose up -d          # PostgreSQL (contenedor urbanovo-db, puerto 5464)
npm install
npx prisma migrate deploy     # crea el esquema
npx prisma db seed            # inquilino, catálogos básicos y usuario admin
npm run dev                   # http://localhost:3012
```

El seed imprime el email y la contraseña del admin. No carga contenido de
ejemplo: logo, portada, propiedades y textos se cargan desde el panel.

### Variables de entorno (`.env`)

| Variable | Para qué |
|---|---|
| `DATABASE_URL` | Conexión a PostgreSQL |
| `AUTH_SECRET` | Firma de sesiones (`npx auth secret`). También deriva la clave con la que se cifran secretos guardados en la base: si cambia, hay que volver a cargarlos. |
| `AUTH_URL` / `ROOT_DOMAIN` | URL pública del sitio (`localhost:3012` en local, el dominio en producción) |
| `QR_BASE_URL` | Dominio que va impreso en los QR de propiedades. Opcional: sin él usa `ROOT_DOMAIN` |
| `CRON_SECRET` | Token para los endpoints `/api/cron/*` |
| `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL` | Cloudflare R2, donde se suben fotos y videos |
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | Envío de emails |

`.env` está en `.gitignore` y nunca debe commitearse. Si se conecta un
dominio propio al bucket de R2, hay que agregarlo en `images.remotePatterns`
de `next.config.ts`.

### Después de tocar el esquema de Prisma

```bash
npx prisma migrate dev --name lo_que_hiciste
npx prisma generate
```

Y subí el número de `PRISMA_SCHEMA_VERSION` en `src/lib/prisma.ts`: Next
conserva `globalThis` entre hot reloads y sin ese cambio puede seguir usando
el cliente de Prisma viejo.

## Producción

Seguir `guia_nueva_app.md` para el primer despliegue en el VPS, y después
`bash deploy.sh` para cada actualización.

En Nginx, `client_max_body_size` tiene que alcanzar los 55 MB del video de
portada (ver `proxyClientMaxBodySize` en `next.config.ts`), y conviene
mandar `proxy_set_header X-Forwarded-For $remote_addr;` (no
`$proxy_add_x_forwarded_for`): el rate limiting del login lee esa IP.

### Crons

```cron
0 4 * * * curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://<dominio>/api/cron/backup
0 5 * * * curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://<dominio>/api/cron/estate-billing
```

- `backup`: `pg_dump` diario a `data/backups/` (guarda los últimos 5).
  Requiere `postgresql-client-16` en el host.
- `estate-billing` (opcional): genera cuotas y punitorios de los contratos
  activos y sugiere actualizaciones de alquiler para aprobar a mano.
