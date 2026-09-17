# Strawberry Control V4.7 - actualización correcta

## Objetivo
Restaurar la lógica central del negocio sin cambiar la estructura A:AA de `GESTION PEDIDOS`:

- `Hoja 1` sigue siendo la fuente Shopify y NO se modifica.
- `GESTION PEDIDOS` vuelve a sincronizar pedidos nuevos automáticamente.
- Los cambios operativos se hacen en `GESTION PEDIDOS` y sobreviven a futuras sincronizaciones.
- Precios, costo unitario y fletes vuelven a ser configurables.
- Los montos, fletes, saldos, resumen y proyecciones se recalculan con esa configuración.
- Teléfono se guarda sin `+51` y queda visible en la columna AA.
- Se conservan usuarios, auditoría, llamadas, 5 intentos, espera de adelanto y la web ASP.NET Core.

## 1. Apps Script - Automatizacion.gs
Reemplaza TODO `Automatizacion.gs` por:

`apps-script-reference/Automatizacion_V47_NEGOCIO_COMPLETO.gs`

Guarda.

## 2. Apps Script - API.gs
Reemplaza TODO `API.gs` por:

`apps-script-reference/API_V47_NEGOCIO_COMPLETO.gs`

Guarda.

## 3. Ejecutar la reparación V4.7
En `Automatizacion.gs`, selecciona y ejecuta UNA VEZ:

`actualizarNegocioV47`

Esta función NO reconstruye `GESTION PEDIDOS`. Hace lo siguiente:

1. recupera/crea `CONFIGURACION`;
2. repara precios/costos/fletes que hayan quedado en 0 por versiones intermedias;
3. vuelve visible `TELÉFONO` en AA;
4. crea un solo trigger `sincronizarPedidos` cada minuto;
5. ejecuta inmediatamente `Hoja 1 -> GESTION PEDIDOS`;
6. recalcula montos, fletes, saldos y resumen.

## 4. Verificar la sincronización
Ejecuta:

`verificarSincronizacionV47`

En el registro debe aparecer aproximadamente:

- `faltantes=0`
- `Trigger sincronizarPedidos=1`
- precios/costo/fletes con valores distintos de cero según tu configuración.

Si quieres forzar una sincronización inmediata, ejecuta:

`sincronizarAhoraV47`

## 5. Activar rendimiento y vencimientos
En `API.gs`, ejecuta UNA VEZ:

`instalarRendimientoV47`

Conserva caché/rendimiento y crea el trigger de vencimientos cada 15 minutos. También confirma el trigger de sincronización cada minuto.

## 6. Publicar Apps Script
`Implementar -> Administrar implementaciones -> Editar -> Nueva versión -> Implementar`

Conserva la misma URL `/exec` configurada en Render.

Prueba:

`.../exec?action=health`

Debe devolver versión `4.7.0`.

## 7. GitHub
En el repositorio `strawberry-control`, reemplaza el contenido de la carpeta:

`StrawberryControl_Repository_Ready`

por el contenido de esta versión V4.7 y haz commit, por ejemplo:

`V4.7 restaurar sincronizacion y logica comercial`

## 8. Render
No crees un nuevo servicio.

Si Auto Deploy está activo, Render desplegará el commit. Si no:

`Manual Deploy -> Deploy latest commit`

El `Root Directory` sigue siendo:

`StrawberryControl_Repository_Ready`

## 9. Verificaciones finales

### Pedidos
- Los pedidos nuevos de `Hoja 1` aparecen en `GESTION PEDIDOS`.
- `CANT REAL` inicia igual a `CANT SHOPIFY`.
- `MONTO` ya no queda en S/ 0 si la cantidad real es mayor a 0 y los precios están configurados.
- `TELÉFONO` aparece sin `+51`.
- Una corrección manual de cliente, teléfono, ubicación o dirección en Gestión no es sobreescrita por la siguiente sincronización.

### Configuración
Desde la web `Administración -> Configuración` puedes cambiar:
- precio 1 unidad;
- precio 2 unidades;
- precio 3 unidades;
- precio unidad extra;
- costo unitario de producción;
- flete Lima;
- flete Provincia;
- producto y UM;
- reglas operativas de llamadas/sesión.

Al guardar se recalculan todos los pedidos y el resumen.

### Fórmula de precio conservada
- 1 unidad -> `precio1`
- 2 unidades -> `precio2`
- 3 unidades -> `precio3`
- 4 o más -> `precio3 + (cantidad - 3) * precioExtra`

### Resumen financiero conservado
- REAL: Entregado + Enviado. En Enviado, ingreso real considera adelanto.
- PROYECCIÓN: Entregado + Programado + Enviado.
- Costo producción = unidades * costo unitario.
- Ganancia = ingresos - publicidad - costo producción - flete courier - flete Shalom.
