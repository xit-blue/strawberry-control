# Apps Script usado por Strawberry Control V4.6

Archivos activos:

- `Automatizacion_V4_5_BASE_ESTABLE.gs`: motor actual de la hoja principal. No necesita cambiarse para V4.6.
- `API_V4_6_RENDIMIENTO.gs`: reemplaza el contenido actual de `API.gs`.

Después de pegar `API_V4_6_RENDIMIENTO.gs`, ejecutar UNA VEZ:

`instalarRendimientoV46()`

Luego crear una nueva versión de la implementación Web App para que `/exec` use V4.6.

