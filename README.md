# Reportes ISP

Sistema de tickets para fallas de servicio ISP.

## Cómo funciona

### Clientes (sin cuenta)
- Entran a `/` y reportan en menos de 1 minuto
- Datos: titular del servicio, WhatsApp, tipo de problema, descripción, GPS y/o dirección, foto/video
- Reciben un número de ticket
- Consultan estado en `/consultar` con ticket + teléfono

### Técnicos / Admin (con login)
- Entran en `/login`
- Bandeja compartida para todo el equipo
- Botones **WhatsApp**, **Mapa**, **Tomar**
- Asignación entre técnicos y cambio de estado

Roles: `client` (legacy), `tecnico`, `admin`

## Stack

Next.js + Supabase (Auth, Postgres, Storage, RLS) · Deploy en Vercel

## Variables de entorno

| Variable | Descripción |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon / publishable key |
| `NEXT_PUBLIC_SITE_URL` | URL pública (Vercel) |

## Promover técnico

```sql
update public.profiles p
set role = 'tecnico'
from auth.users u
where u.id = p.id and u.email = 'tecnico@tuisp.com';
```

## Repo

https://github.com/ton-cast5/reportes-isp
