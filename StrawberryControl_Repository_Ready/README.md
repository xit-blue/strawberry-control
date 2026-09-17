# Strawberry Control V4.7

Sistema ASP.NET Core + Google Apps Script + Google Sheets para gestión de pedidos Shopify.

## Flujo principal

`Shopify -> Hoja 1 -> sincronizarPedidos -> GESTION PEDIDOS -> API Apps Script -> ASP.NET Core -> Render`

## Regla fundamental

`Hoja 1` es fuente de entrada. `GESTION PEDIDOS` es la hoja operativa donde se conserva y manipula la información de atención, cantidad real, monto, zona, fletes, adelantos, estados y teléfono.

## Configuración comercial

`CONFIGURACION` contiene precios, costo unitario, fletes, producto y UM. La web del Administrador puede modificar estos valores y el sistema recalcula pedidos, resumen y proyecciones.

## Archivos Apps Script

- `Automatizacion_V47_NEGOCIO_COMPLETO.gs`
- `API_V47_NEGOCIO_COMPLETO.gs`

Consulta `PASOS_ACTUALIZACION_V47.md` antes de actualizar producción.
