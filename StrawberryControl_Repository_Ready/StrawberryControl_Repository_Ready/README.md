# Strawberry Control V4.6 Performance

Sistema web ASP.NET Core para operar pedidos de Shopify almacenados en Google Sheets mediante Google Apps Script.

## Arquitectura

Shopify -> Google Sheets -> Apps Script V4.6 -> ASP.NET Core 10 MVC -> Render

No requiere PostgreSQL.

## Mejoras V4.6

- Cache de Dashboard y listados en ASP.NET Core.
- Cache corto en Apps Script.
- Menos lecturas/escrituras de sesiones.
- Dashboard con snapshot local inmediato.
- Pedidos y estados cargan en paralelo.
- Detalle de pedido elimina una consulta pesada adicional.
- Vencimientos pasan a trigger de 15 minutos.
- Brotli/Gzip.
- Assets con cache HTTP.
- Imágenes WebP optimizadas (~280 KB total en vez de ~12 MB).

## Despliegue

Lee primero:

`PASOS_ACTUALIZACION_V46.md`

## Render

- Docker
- Root Directory: `StrawberryControl_Repository_Ready` si este proyecto está dentro de esa carpeta en GitHub.
- Health Check: `/healthz`
- Variable `AppsScript__BaseUrl`: URL Web App `/exec`

## Seguridad

No almacenes contraseñas en GitHub. Los usuarios y sesiones se mantienen en la base auxiliar de Google Sheets.
