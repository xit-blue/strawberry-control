# Strawberry Control

Sistema web de gestion de pedidos construido con **ASP.NET Core 10 MVC** sobre la operacion existente de **Shopify + Google Sheets + Google Apps Script V4.5**.

## Stack

- ASP.NET Core 10 MVC / C#
- Razor (`.cshtml`)
- HTML5 + CSS3 + JavaScript
- Cookie Authentication de ASP.NET Core
- Google Apps Script API V4.5
- Google Sheets como almacenamiento operativo
- Sin PostgreSQL

## Arquitectura

`Shopify -> Google Sheets -> Apps Script V4.5 -> ASP.NET Core -> Navegador`

La informacion web adicional (usuarios, sesiones, historial de llamadas, auditoria y metadata de pedidos) se guarda en un Google Sheet auxiliar independiente para no alterar la hoja operativa existente.

## URL de Apps Script configurada

La aplicacion usa actualmente:

`https://script.google.com/macros/s/AKfycbztid5x0pfqSuPU1skOFPVOXq3FdfBsT-yIAzA9m_JHXncbEudp92u08Orgi3SkgDzHIA/exec`

En produccion puedes sobrescribirla sin modificar archivos mediante:

`AppsScript__BaseUrl=TU_URL_EXEC`

## Requisitos para desarrollo

1. .NET 10 SDK.
2. Apps Script V4.5 desplegado como Web App.
3. Base web auxiliar creada con `configurarBaseWebV45()`.
4. Administrador creado con `crearOResetearAdministrador()`.
5. La implementacion de Apps Script debe estar actualizada despues de cualquier cambio en `API.gs` o `Automatizacion.gs`.

## Ejecutar localmente

```bash
dotnet restore StrawberryControl.sln
dotnet build StrawberryControl.sln -c Release
dotnet run --project src/StrawberryControl.Web/StrawberryControl.Web.csproj
```

Perfiles de desarrollo:

- `https://localhost:7168`
- `http://localhost:5168`

## Modulos

### Administrador y trabajador

- Inicio/cierre de sesion.
- Dashboard operativo.
- Consulta, busqueda y filtros de pedidos.
- Detalle completo del pedido.
- Tomar/liberar atencion temporal.
- Historial de llamadas.
- `NO RESPONDE` con contador automatico hasta 5.
- `Confirmado`, `En espera`, `Volver a llamar` y `Cancelado`.
- Edicion de datos de cliente y pedido.
- Flujo Lima: Confirmado -> Programado -> Entregado.
- Flujo Provincia: Confirmado -> Esperando adelanto -> Enviado -> Entregado.
- WhatsApp a partir del telefono guardado sin `+51`.

### Solo administrador

- Informacion real y proyecciones.
- Gastos de publicidad Facebook/TikTok.
- Usuarios trabajadores (maximo configurado: 10 activos).
- Configuracion comercial y reglas web.
- Auditoria.
- Sincronizacion manual.
- Reapertura de pedidos cerrados.

## Seguridad

- El navegador llama a `/api/gateway`; no llama directamente a Apps Script.
- El token de Apps Script se mantiene dentro de la cookie protegida de ASP.NET Core.
- Las operaciones POST usan antiforgery token.
- No almacenes contraseñas reales en este repositorio.
- La contraseña temporal del administrador debe cambiarse despues del primer acceso.

## Apps Script de referencia

En `apps-script-reference/` se incluyen las versiones que corresponden a esta web:

- `Automatizacion_V4_5_BASE_ESTABLE.gs`
- `API_V4_5_1_SIN_UI_ADMIN.gs`

## Docker

```bash
docker build -t strawberry-control .
docker run --rm -p 8080:8080 \
  -e AppsScript__BaseUrl="TU_URL_EXEC" \
  strawberry-control
```

En produccion usa HTTPS delante del contenedor y almacenamiento persistente para las claves de Data Protection si quieres conservar sesiones entre despliegues.

## CI

El repositorio incluye `.github/workflows/dotnet.yml`. Al subirlo a GitHub, el workflow instala .NET 10 y ejecuta `restore` + `build` en cada push/PR a `main` o `master`.

## Antes del primer login web

1. Actualiza la implementacion de Apps Script a una **nueva version**.
2. Prueba `.../exec?action=health` y confirma `version: 4.5.0` y `auxiliaryConfigured: true`.
3. Ejecuta el proyecto ASP.NET Core.
4. Entra con el administrador temporal y cambia su contraseña.
