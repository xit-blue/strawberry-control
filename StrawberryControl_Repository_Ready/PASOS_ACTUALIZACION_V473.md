# Strawberry Control V4.7.3 - Publicidad: fechas correctas + gráfico de línea

Esta versión NO cambia la lógica de pedidos, precios, fletes ni proyecciones. Corrige exclusivamente la visualización de fechas y agrega el gráfico solicitado de gasto Facebook US$ por día.

## Qué corrige
- Una fecha `2026-08-23` ya no se interpreta como UTC ni aparece como `22/08/2026`.
- La tabla de Publicidad muestra la fecha exacta guardada en Google Sheets.
- El formulario de edición conserva el día exacto.
- Nuevo gráfico lineal: eje X = días, eje Y = gasto Facebook US$.
- Si existen varios registros el mismo día, el gráfico suma los US$ de ese día.
- Resumen del gráfico: total del periodo, promedio diario y mayor gasto diario.

## Actualización Apps Script
1. Haz una copia de seguridad del archivo Google Sheets.
2. Reemplaza `Automatizacion.gs` por `Automatizacion_V473_PUBLICIDAD_GRAFICO.gs`.
3. Reemplaza `API.gs` por `API_V473_PUBLICIDAD_GRAFICO.gs`.
4. Guarda. No necesitas ejecutar una migración nueva para el gráfico.
5. Implementar -> Administrar implementaciones -> Editar -> Nueva versión -> Implementar.
6. Verifica `TU_URL/exec?action=health`; debe mostrar `4.7.3`.

## Actualización GitHub / Render
1. Descomprime `StrawberryControl_V473_PUBLICIDAD_GRAFICO_Render.zip`.
2. Reemplaza el contenido de `StrawberryControl_Repository_Ready` en GitHub.
3. Commit sugerido: `V4.7.3 fechas publicidad y grafico de flujo USD`.
4. Render hará auto-deploy. Si no, usa `Manual Deploy -> Deploy latest commit`.
5. Verifica `/healthz`; debe mostrar `4.7.3`.

## Verificación visual
En Publicidad debes ver:
- `23/08/2026` como `23/08/2026`, no como 22/08.
- Un gráfico de línea debajo del historial.
- Eje X con los días (`15/08`, `16/08`, ...).
- Eje Y con valores en US$.
- Los puntos del gráfico muestran el monto exacto al pasar el cursor.
