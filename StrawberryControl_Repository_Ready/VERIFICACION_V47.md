# Verificación V4.7

## Comprobaciones realizadas sobre el paquete

- Sintaxis JavaScript de `Automatizacion_V47_NEGOCIO_COMPLETO.gs`: OK.
- Sintaxis JavaScript de `API_V47_NEGOCIO_COMPLETO.gs`: OK.
- Sintaxis de todos los archivos `wwwroot/js/*.js`: OK.
- Fórmula original de precios: restaurada.
- Defaults históricos: 90 / 135 / 180 / 90, costo 21.24, flete Lima 12, flete Provincia 5.
- Teléfono `+51 987654321` se normaliza a `987654321`.
- Pedido nuevo construye cantidad real = cantidad Shopify.
- Pedido existente conserva manualmente cliente, teléfono, ubicación, dirección y cantidad real.
- Trigger de sincronización: función dedicada `asegurarActivadorSincronizacionV47_()`.
- Configuración: hoja primaria `CONFIGURACION` + espejo AF:AG para compatibilidad.
- API de configuración usa `guardarConfiguracionNegocioV47_()` y recalcula todo.
- Cambio de contraseña del Administrador incluido.
- Health ASP.NET actualizado a 4.7.

El SDK .NET no está instalado en este entorno; la compilación real debe validarse por Docker/Render, como en las versiones anteriores.
