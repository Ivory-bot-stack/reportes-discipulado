# Reportes de Discipulado
Jesucristo Manantial de Vida - Rivas. Next.js 15 + Supabase.

## Usar en tu computadora
1. Instala Node.js (versión LTS).
2. `npm install`
3. Copia `.env.local.example` como `.env.local` y pega tu Project URL y Publishable key de Supabase.
4. `npm run dev` y abre http://localhost:3000

## Estructura
- `app/login` — inicio de sesión
- `app/(app)/reporte` — reporte semanal del mentor (formulario, autoguardado, envío)
- `app/(app)/historial` — "Mis reportes"
- `app/(app)/admin` — panel del pastor (versión inicial)
- `sql/fotos.sql` — tabla y reglas de las fotos (correr en Supabase)
- `lib/supabase` — conexión a Supabase; `middleware.js` — protege las pantallas
- La privacidad real está en la base de datos (SQL del archivo de pasos), no en la pantalla.

## Despliegue
Sube a GitHub (repositorio privado) y conéctalo a Vercel con las 2 variables de `.env.local.example`.
