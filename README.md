# Reportes ISP

Sistema web de tickets para reportes de servicio de un ISP.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Supabase (Auth, Postgres, Storage, RLS)
- Deploy recomendado: Vercel

## Funcionalidades

- Registro / inicio de sesión
- Crear reportes con categoría, prioridad, contacto y dirección
- Adjuntar imágenes y videos (hasta 50 MB)
- Listado y detalle de tickets
- Comentarios e historial de estados
- Roles: `client`, `staff`, `admin` (staff puede cambiar estados)

## Variables de entorno

Copia `.env.example` a `.env.local` (local) o configúralas en Vercel:

| Variable | Descripción |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon / publishable key |
| `NEXT_PUBLIC_SITE_URL` | URL pública (ej. `https://tu-app.vercel.app`) |

## Deploy en Vercel (producción)

1. Sube este repo a GitHub (ya conectado: `ton-cast5/reportes-isp`).
2. En [Vercel](https://vercel.com) → **Add New Project** → importa el repo.
3. Framework: **Next.js** (autodetectado).
4. Agrega las 3 variables de entorno de arriba.
5. Deploy.
6. En Supabase → **Authentication → URL Configuration**:
   - **Site URL**: `https://tu-dominio.vercel.app`
   - **Redirect URLs**:
     - `https://tu-dominio.vercel.app/auth/callback`
     - `http://localhost:3000/auth/callback` (desarrollo)
7. Vuelve a redeploy en Vercel si cambiaste `NEXT_PUBLIC_SITE_URL`.

## Desarrollo local

```bash
npm install
npm run dev
```

## Proyecto Supabase

- URL: `https://cdruyiobkmxaknvcqjfq.supabase.co`
- Bucket: `ticket-evidence`
- Tablas: `profiles`, `ticket_categories`, `tickets`, `ticket_attachments`, `ticket_comments`, `ticket_status_history`

Promover usuario a staff/admin:

```sql
update public.profiles
set role = 'staff' -- o 'admin'
where id = '<user-uuid>';
```

## Repo

https://github.com/ton-cast5/reportes-isp
