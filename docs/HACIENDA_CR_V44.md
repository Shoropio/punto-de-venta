# Hacienda Costa Rica v4.4

Estado actual: base de datos y API preparadas para emitir comprobantes v4.4, pero sin generacion de XML, firma digital ni envio a Hacienda todavia.

## Fuentes oficiales

- Generalidades y version 4.4: https://www.hacienda.go.cr/docs/ComprobantesElectronicos-GeneralidadesyVersion4.4.marzo2025.pdf
- Anexos y estructuras XML v4.4: https://www.hacienda.go.cr/docs/Anexosyestructuras.pdf

## Implementado

- Configuracion fiscal por sucursal y ambiente en `hacienda_settings`.
- Campos fiscales base para productos: CABYS, unidad Hacienda, codigo de impuesto y codigo de tarifa.
- Campos fiscales base para clientes: tipo y numero de identificacion, ubicacion y senas.
- Campos fiscales en facturas: version, tipo de comprobante, clave, consecutivo, codigo de seguridad, estado Hacienda, rutas de XML y respuesta.
- Generacion de `numero_consecutivo` y `clave` para tipos:
  - `01`: Factura Electronica
  - `04`: Tiquete Electronico
- Generacion inicial de XML v4.4 no firmado y almacenamiento en `storage/app/private/hacienda/xml`.
- Endpoint para regenerar XML:
  - `POST /api/invoices/{invoice}/xml`
- Firma XMLDSig RSA-SHA256 con certificado `.p12` configurado y almacenamiento en `storage/app/private/hacienda/signed`.
- Endpoint para firmar XML:
  - `POST /api/invoices/{invoice}/sign`
- Autenticacion OAuth2/OIDC contra Hacienda con credenciales ATV.
- Envio del XML firmado a recepcion.
- Consulta de estado por clave y almacenamiento de respuesta XML cuando Hacienda la entrega.
- Endpoints:
  - `POST /api/invoices/{invoice}/submit`
  - `POST /api/invoices/{invoice}/status`

## Pendiente

- Completar todos los escenarios del XML v4.4 contra los XSD oficiales.
- Validar con certificado real si Hacienda exige extensiones XAdES adicionales sobre la firma XMLDSig.
- Probar envio completo contra sandbox con credenciales reales ATV.
- Generar representacion grafica.
- Agregar UI completa para configurar Hacienda y monitorear comprobantes.

## Configuracion minima via API

```http
POST /api/hacienda-settings
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "branch_id": 1,
  "environment": "staging",
  "legal_name": "Mi Empresa SRL",
  "commercial_name": "Mi Empresa",
  "identification_type": "02",
  "identification_number": "3101123456",
  "economic_activity_code": "521101",
  "province": "1",
  "canton": "01",
  "district": "01",
  "other_signs": "San Jose",
  "email": "facturas@example.com",
  "branch_code": "001",
  "terminal_code": "00001",
  "certificate_path": "hacienda/certs/empresa.p12",
  "certificate_pin": "1234",
  "api_username": "cpf-02-3101123456@comprobanteselectronicos.go.cr",
  "api_password": "password-atv",
  "callback_url": "https://mi-dominio.test/hacienda/callback",
  "is_active": true
}
```
