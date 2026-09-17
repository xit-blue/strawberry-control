# Strawberry Control V4.7.2 - Publicidad corregida

## Objetivo
Restaurar la lógica original de publicidad:
- Facebook US$ es manual.
- Facebook S/ = Facebook US$ × tipo de cambio.
- Tipo de cambio por defecto: 3.50, editable desde Configuración.
- TikTok S/ es manual.
- Total S/ = Facebook S/ + TikTok S/.
- Los registros históricos se reparan automáticamente al ejecutar `actualizarNegocioV472`.

## Pasos
1. Respaldar el Google Sheet.
2. Reemplazar `Automatizacion.gs` por `Automatizacion_V472_PUBLICIDAD.gs`.
3. Reemplazar `API.gs` por `API_V472_PUBLICIDAD.gs`.
4. Ejecutar `actualizarNegocioV472()` una sola vez.
5. Ejecutar `verificarPublicidadV472()`. Debe mostrar `TIPO_CAMBIO_PUBLICIDAD=3.5` salvo que lo cambies.
6. Implementar una nueva versión de la Web App conservando la misma URL `/exec`.
7. Verificar `?action=health` -> versión `4.7.2`.
8. Subir el contenido actualizado de `StrawberryControl_Repository_Ready` a GitHub.
9. Dejar que Render haga auto-deploy o usar Manual Deploy -> Deploy latest commit.
10. Verificar `/healthz` -> versión `4.7.2`.

## Prueba rápida
- En Publicidad escribe Facebook US$ = 27.29.
- Con TC 3.50 debe mostrar Facebook S/ = 95.52.
- Si TikTok S/ = 10, Total S/ = 105.52.
- Al guardar, la hoja `GASTOS PUBLICIDAD` debe reflejar exactamente esos valores.
