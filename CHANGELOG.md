# Changelog

Todos los cambios notables de este proyecto.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/es/1.1.0/),
y este proyecto adherirse a [Semantic Versioning](https://semver.org/lang/es/spec/v2.0.0.html).

## [Unreleased]

## [0.12.0] - 2026-08-17

### Added

- **Contabilidad**: plan de cuentas estandar de Costa Rica (50 cuentas), asientos de doble partida, balance de comprobacion, cuentas bancarias, observer automatico al registrar ventas.
- **RRHH**: modulo de empleados con registro y asistencia (clock-in/out con PIN), migracion `employees` y `attendances`.
- **WhatsApp**: envio de facturas por WhatsApp con driver dual (Meta Cloud API + Baileys Gateway), configuracion desde UI, migracion `whatsapp_settings`.
- **E-commerce**: servicio `EcommerceSyncService` con sincronizacion bidireccional para WooCommerce (REST API v3), Shopify (Admin API 2024-01) y Mercado Libre (Items API).
- **Facturito AI**: asistente de IA flotante con Google Gemini 2.0 Flash Lite para consultas del POS.
- **PDF real**: integracion de `barryvdh/laravel-dompdf` para generacion de facturas en PDF.
- **Google OAuth**: soporte para autenticacion con Google (variables de entorno `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`).
- **UI Contabilidad**: modulo contable con cuentas, asientos, balance de comprobacion y bancos en `AccountingModule.tsx`.
- **UI RRHH**: modulo de RRHH con empleados y asistencia en `HrModule.tsx`.
- **UI WhatsApp**: componente reutilizable `WhatsAppConfig.tsx` integrado en SettingsModule.
- **Catalogo contable CR**: seeder `AccountingCatalogSeeder` con 50 cuentas del plan estandar costarricense.
- **Variables de entorno**: documentacion completa en `.env.example` para todas las integraciones.

### Fixed

- Normalizacion de estados de Hacienda: `HaciendaApiClient::normalizeStatus()` mapea `'aceptado'` a `'accepted'`.
- Codigos de cuenta contable: `DoubleEntryService` actualizado de formato guion (`1-1-1-01`) a punto (`1.1.01`) para coincidir con el seeder.
- Notificacion WhatsApp: verificacion de estado de Hacienda usando valores en ingles (`accepted`/`aceptado`).
- `RecordRefund()` en `DoubleEntryService` conectado a `RefundController`.
- `RecordCreditPayment()` en `DoubleEntryService` conectado a `CreditPaymentController`.

### Changed

- `DatabaseSeeder` ahora incluye `AccountingCatalogSeeder` al ejecutar `php artisan db:seed`.
- `SaleObserver` registrado en `AppServiceProvider` para crear asientos contables automaticos al registrar ventas.
- Dependencia `barryvdh/laravel-dompdf` agregada a `composer.json`.

## [0.11.0] - 2026-08-16

### Added

- Hacienda Costa Rica v4.4: XML, firma XMLDSig, envio/recepcion, consulta de estado.
- Configuracion fiscal por sucursal en `hacienda_settings`.
- UI de configuracion de Hacienda en SettingsModule.

## [0.10.0] - 2026-08-15

### Added

- Respaldos programados y manuales con Firestore.
- Verificacion y restauracion de respaldos.

## [0.9.0] - 2026-08-14

### Added

- Modulo de configuracion e impresion.

## [0.8.0] - 2026-08-13

### Added

- Reportes: resumen de ventas, productos top, inventario.

## [0.7.0] - 2026-08-12

### Added

- Codigos de barras: generacion y asignacion a productos.

## [0.6.0] - 2026-08-11

### Added

- Facturacion fiscal vinculada a ventas.

## [0.5.0] - 2026-08-10

### Added

- Promociones y codigos de descuento.
- Formas de pago configurables.

## [0.4.0] - 2026-08-09

### Added

- Caja: sesiones, movimientos (depositos/retiros).

## [0.3.0] - 2026-08-08

### Added

- Clientes: registro, historial, credito y cuentas por cobrar.

## [0.2.0] - 2026-08-07

### Added

- Inventario: CRUD de productos, ajustes de stock, valor de inventario.
- Catalogos: categorias, marcas, proveedores, sucursales.

## [0.1.0] - 2026-08-06

### Added

- Base tecnica: scaffold Laravel/React, Docker, Sanctum, migraciones, seeders y tests.
- POS funcional: ventas, carrito persistente, pagos mixtos, caja, recibos y devoluciones.
