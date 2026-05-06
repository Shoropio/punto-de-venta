# POS Profesional

Sistema POS original con frontend React + Vite + TypeScript y backend Laravel + Sanctum.

## Requisitos

- PHP 8.4+
- Composer
- Node.js 24+
- npm
- MySQL, PostgreSQL o SQLite para desarrollo local

## Levantar en desarrollo

Desde PowerShell:

```powershell
cd C:\Users\Shoropio\Desktop\punto-de-venta
```

Backend:

```powershell
cd backend
php artisan serve --host=127.0.0.1 --port=8000
```

Frontend, en otra terminal:

```powershell
cd C:\Users\Shoropio\Desktop\punto-de-venta\frontend
npm run dev -- --host 127.0.0.1 --port 5173
```

Abrir la app:

```txt
http://127.0.0.1:5173
```

## Credenciales iniciales

```txt
Email: admin@example.com
Password: password
```

## Reiniciar base de datos

Si necesitas recrear la base con datos iniciales:

```powershell
cd C:\Users\Shoropio\Desktop\punto-de-venta\backend
php artisan migrate:fresh --seed
```

## Verificacion

Backend:

```powershell
cd C:\Users\Shoropio\Desktop\punto-de-venta\backend
php artisan test
```

Frontend:

```powershell
cd C:\Users\Shoropio\Desktop\punto-de-venta\frontend
npm run build
```

## Docker

Tambien puedes levantar la pila con Docker:

```powershell
cd C:\Users\Shoropio\Desktop\punto-de-venta
docker compose up --build
```

Servicios:

- Frontend: `http://localhost:8080`
- Backend API: `http://localhost:8000/api`
- MySQL: `localhost:3306`

## Documentacion tecnica

La arquitectura general esta en:

```txt
docs/ARCHITECTURE.md
```
