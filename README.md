<div align="center">

![POS Profesional](pos_banner.png)

# 🚀 POS Profesional
### *Sistema de punto de venta con frontend React + TypeScript y backend Laravel + Sanctum.*

[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=111827)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Zustand](https://img.shields.io/badge/Zustand-State-443E38?style=for-the-badge)](https://zustand-demo.pmnd.rs)
[![React Query](https://img.shields.io/badge/React_Query-5-FF4154?style=for-the-badge&logo=reactquery&logoColor=white)](https://tanstack.com/query)
[![Laravel](https://img.shields.io/badge/Laravel-13.x-FF2D20?style=for-the-badge&logo=laravel)](https://laravel.com)
[![Sanctum](https://img.shields.io/badge/Laravel_Sanctum-Auth-FF2D20?style=for-the-badge&logo=laravel)](https://laravel.com/docs/sanctum)
[![PHP](https://img.shields.io/badge/PHP-8.4-777BB4?style=for-the-badge&logo=php)](https://php.net)
[![MySQL](https://img.shields.io/badge/MySQL-8.4-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com)
[![Nginx](https://img.shields.io/badge/Nginx-1.27-009639?style=for-the-badge&logo=nginx&logoColor=white)](https://nginx.org)
[![Docker Compose](https://img.shields.io/badge/Docker_Compose-Ready-2496ED?style=for-the-badge&logo=docker)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

[Explorar el sitio](https://shoropio.com) · [Reportar Bug](https://shoropio.com/contactenos) · [Solicitar Feature](https://shoropio.com/contactenos)

</div>

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
git clone https://github.com/Shoropio/punto-de-venta.git
```

```powershell
cd punto-de-venta
```

Backend:

```powershell
cd backend
php artisan serve --host=127.0.0.1 --port=8000
```

Frontend, en otra terminal:

```powershell
cd frontend
npm run dev -- --host 127.0.0.1 --port 5173
```

Abrir la app:

```txt
http://127.0.0.1:5173
```

## Credenciales iniciales

```txt
Correo electrónico: admin@example.com
Contraseña: password
```

## Reiniciar base de datos

Si necesitas recrear la base con datos iniciales:

```powershell
cd backend
php artisan migrate:fresh --seed
```

## Verificacion

Backend:

```powershell
cd backend
php artisan test
```

Frontend:

```powershell
cd frontend
npm run build
```

## Docker

Tambien puedes levantar la pila con Docker:

Primera vez, o cuando cambien `Dockerfile`, dependencias o configuracion de Docker:

```powershell
cd punto-de-venta
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

[Arquitectura general](./docs/ARCHITECTURE.md)

---

## Licencia

© 2026 Shoropio Corporation. Todos los derechos reservados.
