# POS Profesional

Sistema de punto de venta con frontend React + TypeScript y backend Laravel + Sanctum.

## Modulos

| Modulo | Descripcion |
|---|---|
| **Venta** | Punto de venta con busqueda de productos, carrito, pagos mixtos y recibos |
| **Inventario** | CRUD de productos, ajustes de stock, valor de inventario |
| **Clientes** | Registro, historial de compras, creditos y cuentas por cobrar |
| **Caja** | Sesiones de caja, depositos y retiros |
| **Creditos** | Seguimiento de creditos y abonos de clientes |
| **Promociones** | Codigos de descuento y promociones activas |
| **Formas de pago** | Configuracion de medios de pago (efectivo, tarjeta, transferencia, credito) |
| **Facturacion** | Generacion de facturas fiscales vinculadas a ventas |
| **Codigos de barras** | Generacion y asignacion de codigos a productos |
| **Impresora** | Configuracion de impresion de tickets |
| **Reportes** | Resumen de ventas, productos mas vendidos, historial e inventario |
| **Configuracion** | Datos del negocio, moneda, impuestos y catalogos (categorias, marcas, proveedores, sucursales) |

## Stack

- **Frontend:** React 19, Vite, TypeScript, Tailwind CSS v4, Zustand, React Query
- **Backend:** Laravel 13, Sanctum
- **Base de datos:** MySQL 8.4 (soporta PostgreSQL)
- **Docker:** Docker Compose con MySQL, backend y frontend

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

Primera vez, o cuando cambien `Dockerfile`, dependencias o configuracion de Docker:

```powershell
cd C:\Users\Shoropio\Desktop\punto-de-venta
docker compose up --build
```

Despues, para levantar los servicios normalmente:

```powershell
docker compose up
```

Si solo cambiaste el frontend y quieres reconstruir ese contenedor en segundo plano:

```powershell
docker compose up -d --build frontend
```

Ejecutar migraciones y seeders solo la primera vez que creas la base de datos:

```powershell
docker compose exec backend php artisan migrate --seed
```

Luego no hace falta repetirlo en cada arranque. Solo vuelve a ejecutar migraciones si agregaste cambios a la base de datos o si hay migraciones pendientes:

```powershell
docker compose exec backend php artisan migrate
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
