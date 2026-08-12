# Reportes ISP

Sistema de tickets para fallas de servicio ISP. Diseñado para ser más fácil que mandar un WhatsApp.

## Cómo funciona

### Clientes (sin cuenta)
- Entran a `/` y reportan en menos de 1 minuto
- Titular del servicio, WhatsApp, problema, GPS y/o dirección, foto/video
- Reciben un número de ticket
- Consultan estado con el botón grande **¿Ya reportaste? Consulta el estado**
- Acceso del equipo queda discreto al final (`/login`)

### Admin
- Ve todos los reportes
- Asigna cada uno a un técnico (pasa solo a “En atención”)
- Deja indicaciones que el técnico asignado ve

### Técnico
- Solo ve **lo que le asignaron**
- WhatsApp + Mapa
- Un tap en **Ya lo reparé** → se marca reparado (sin WhatsApp; ya están en sitio)

Roles: `tecnico`, `admin`

## Stack

Next.js + Supabase · Deploy en Vercel

## Variables de entorno

| Variable | Descripción |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon / publishable key |
| `NEXT_PUBLIC_SITE_URL` | URL pública (Vercel) |

## Promover técnico o admin

```sql
update public.profiles p
set role = 'tecnico' -- o 'admin'
from auth.users u
where u.id = p.id and u.email = 'correo@tuisp.com';
```

## Repo

https://github.com/ton-cast5/reportes-isp
