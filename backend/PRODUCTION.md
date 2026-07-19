# Produccion

## Backend

El backend corre como funciones serverless de Vercel en el proyecto `cp-ensalada-api`.
Angular no se deploya en Vercel: el frontend va a GitHub Pages.

Variables necesarias:

- `DATABASE_URL`: connection string Postgres con SSL.
- `CP_INITIAL_PASSWORD`: contrasena inicial para crear `app_settings.access_password`.
- `AUTH_PEPPER`: string largo aleatorio para hashear tokens/IPs.
- `FRONTEND_ORIGIN`: origenes permitidos por CORS, separados por coma.

La contrasena no queda en Angular. En el primer login, si la tabla no tiene password, el backend guarda `CP_INITIAL_PASSWORD` hasheada con bcrypt.

## Tablas

- `app_settings`: password hasheada y settings globales.
- `participants`: personajes de la CP.
- `materials`: materiales trackeados para aportes.
- `contributions`: historial de cargas individuales.
- `sessions`: sesiones con token hasheado.
- `login_attempts`: rate limiter anti fuerza bruta.

## Rate Limit

El login bloquea por IP hasheada si hay 5 intentos fallidos en 10 minutos. El bloqueo dura 15 minutos.

## Deploy

1. Crear/conectar una DB Postgres al proyecto Vercel `cp-ensalada-api`.
2. Agregar env vars de produccion: `DATABASE_URL`, `CP_INITIAL_PASSWORD`, `AUTH_PEPPER`, `FRONTEND_ORIGIN`.
3. Usar `CP_INITIAL_PASSWORD=cpensalada332211` solo como valor secreto en Vercel, no en el codigo.
4. Deployar desde `backend/` con `npx vercel deploy --prod`.
5. Publicar Angular en GitHub Pages con el workflow `.github/workflows/deploy-pages.yml`.
