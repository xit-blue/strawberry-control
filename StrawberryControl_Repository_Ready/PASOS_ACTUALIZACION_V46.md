# Strawberry Control V4.6 - Actualización de rendimiento

Esta versión mantiene la arquitectura actual:

Shopify -> Google Sheets -> Apps Script -> ASP.NET Core -> Render

No usa PostgreSQL y no migra `GESTION PEDIDOS`.

## Qué mejora V4.6

1. El Dashboard ya no hace un `ping/me` adicional al abrirse.
2. ASP.NET conserva por unos segundos respuestas de Dashboard, Pedidos, Configuración y otros listados.
3. Apps Script usa `CacheService` para Dashboard y páginas de Pedidos.
4. La validación de sesión deja de leer/escribir `SESIONES` en cada clic.
5. `ULTIMA_ACTIVIDAD` se escribe como máximo cada 5 minutos.
6. Los vencimientos automáticos se procesan mediante un trigger de 15 minutos, no dentro de la carga del Dashboard.
7. El Dashboard guarda el último snapshot en `sessionStorage`: al volver a la pantalla muestra datos inmediatamente mientras actualiza en segundo plano.
8. El detalle de pedido ya no carga un Dashboard completo solo para obtener el máximo de intentos.
9. Pedidos carga estados y pedidos en paralelo.
10. Las imágenes pasan de ~12 MB en PNG a ~280 KB en WebP.
11. ASP.NET habilita Brotli/Gzip y cache agresivo de assets versionados.
12. El cliente HTTP reutiliza conexiones hacia Apps Script.

## IMPORTANTE sobre Render Free

La versión Free de Render puede apagar el Web Service cuando queda inactivo. La primera visita después de un periodo sin uso puede seguir demorando por el arranque del contenedor. V4.6 acelera la aplicación una vez despierta, pero no puede eliminar el cold start del plan gratuito.

## A. Actualizar Apps Script

1. Abre el mismo proyecto Apps Script que ya funciona.
2. NO cambies `Automatizacion.gs`.
3. Abre `API.gs`.
4. Copia todo el contenido de `apps-script-reference/API_V4_6_RENDIMIENTO.gs`.
5. Reemplaza todo el contenido de `API.gs` y guarda.
6. En el selector de funciones ejecuta UNA VEZ:

   `instalarRendimientoV46`

7. Debe mostrar en el registro:

   `RENDIMIENTO V4.6 ACTIVADO: cache + vencimientos cada 15 minutos.`

8. Opcional: ejecuta `pruebaRendimientoV46` para confirmar versión/cache.
9. Ve a `Implementar -> Administrar implementaciones -> Editar`.
10. Selecciona `Nueva versión` y pulsa `Implementar`.
11. Conserva la misma URL `/exec`.
12. Prueba:

   `.../exec?action=health`

   Debe indicar versión `4.6.0`.

## B. Actualizar GitHub

Tu Render actual usa como Root Directory:

`StrawberryControl_Repository_Ready`

Para no tener que cambiar Render, el ZIP V4.6 incluye una carpeta con ESE MISMO NOMBRE.

### Desde la web de GitHub

1. Descomprime el ZIP.
2. En GitHub entra a `strawberry-control`.
3. Entra a la carpeta `StrawberryControl_Repository_Ready`.
4. `Add file -> Upload files`.
5. Arrastra el contenido de la carpeta V4.6 `StrawberryControl_Repository_Ready`.
6. GitHub mostrará archivos existentes como reemplazados y nuevos como agregados.
7. Commit message sugerido:

   `V4.6 rendimiento y cache`

8. Pulsa `Commit changes`.

Render detectará el commit y desplegará automáticamente si Auto-Deploy está activo.

## C. Si Render NO despliega automáticamente

1. Render -> `strawberry-control`.
2. `Manual Deploy`.
3. `Deploy latest commit`.
4. Espera a que finalice el build.
5. Abre `https://strawberry-control.onrender.com`.

## D. Verificación rápida

1. Inicia sesión.
2. Abre Dashboard.
3. La primera carga sin caché puede tomar algunos segundos por Google Sheets.
4. Vuelve a Dashboard: debe mostrar el último snapshot casi de inmediato.
5. Pulsa `Actualizar`: fuerza una lectura nueva.
6. Abre Pedidos: estados y tabla ahora cargan en paralelo.
7. Abre un pedido: ya no se ejecuta un Dashboard completo adicional.

## E. Credenciales

No se incluyen contraseñas en el repositorio. El usuario `admin` sigue almacenado en la base auxiliar de Google Sheets.

## F. Render

No cambies estas opciones si ya funciona:

- Language: Docker
- Branch: main
- Root Directory: `StrawberryControl_Repository_Ready`
- Dockerfile Path: `./Dockerfile`
- Health Check: `/healthz`
- `AppsScript__BaseUrl`: tu URL `/exec`
- `ASPNETCORE_ENVIRONMENT`: `Production`
