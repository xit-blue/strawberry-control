# STRAWBERRY CONTROL V4.7.1 - ACTUALIZACION RAPIDA Y SEGURA

Esta version corrige el cuello de botella de Pedidos sin cambiar la logica comercial V4.7.

## Que cambia

- `Hoja 1` sigue siendo el origen Shopify y NO se modifica.
- `GESTION PEDIDOS` sigue siendo la hoja operativa.
- La sincronizacion ahora es INCREMENTAL: solo agrega pedidos cuyo N. de pedido todavia no existe en Gestion.
- Un pedido existente NUNCA se reescribe desde `Hoja 1`.
- Se mantienen precios configurables, costo unitario, flete Lima, flete Provincia, cantidad real, telefono sin +51, estados, adelantos, saldo, publicidad, resumen y proyeccion.
- La API evita leer CONFIGURACION WEB una vez por cada pedido al listar.
- Cache de lista de pedidos: 30 segundos en Apps Script y 30 segundos en ASP.NET Core. Las mutaciones invalidan cache.

## Paso 0 - Respaldo

Haz una copia del Google Sheet antes de actualizar.

## Paso 1 - Apps Script

1. Abre Apps Script.
2. Reemplaza TODO `Automatizacion.gs` por `Automatizacion_V471_INCREMENTAL.gs`.
3. Reemplaza TODO `API.gs` por `API_V471_RAPIDA.gs`.
4. Guarda ambos.
5. Ejecuta UNA VEZ `actualizarNegocioV471`.
6. Ejecuta `verificarSincronizacionV471`. Debe mostrar `Faltantes=0` y `Trigger sincronizarPedidos=1`.
7. Ejecuta UNA VEZ `instalarRendimientoV47` (el nombre se conserva por compatibilidad).

## Paso 2 - Publicar Apps Script

`Implementar` -> `Administrar implementaciones` -> editar la implementacion actual -> `Nueva version` -> `Implementar`.

Prueba:

`TU_URL_EXEC?action=health`

Debe responder con `version: 4.7.1`.

## Paso 3 - GitHub

En tu repositorio `strawberry-control`, entra a `StrawberryControl_Repository_Ready` y reemplaza el contenido por el de esta carpeta V4.7.1.

Commit sugerido: `V4.7.1 sincronizacion incremental y pedidos rapidos`.

## Paso 4 - Render

Si Auto Deploy esta activo, espera el nuevo deployment. Si no:

`Render` -> `strawberry-control` -> `Manual Deploy` -> `Deploy latest commit`.

Prueba `/healthz`; debe mostrar `4.7.1`.

## Paso 5 - Comprobacion funcional

1. Crea o espera un pedido nuevo en `Hoja 1`.
2. Ejecuta manualmente `sincronizarPedidos` o espera el trigger de 1 minuto.
3. Verifica que se agregue SOLO ese pedido a `GESTION PEDIDOS`.
4. Modifica nombre/cantidad real/telefono/estado en Gestion o desde la web.
5. Ejecuta de nuevo `sincronizarPedidos`.
6. Confirma que el pedido existente NO fue sobrescrito.
7. Abre `Pedidos` en la web y verifica que la lista cargue.

## Nota sobre el boton Actualizar lista

El boton fuerza una lectura fresca. No lo pulses repetidamente mientras una consulta esta en curso. La carga normal usa cache corto para responder mas rapido.
