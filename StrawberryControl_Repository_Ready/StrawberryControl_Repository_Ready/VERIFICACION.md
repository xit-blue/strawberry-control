# Verificacion del paquete

Se realizaron las siguientes comprobaciones antes de generar el ZIP de repositorio:

- Estructura de solucion y proyecto ASP.NET Core presente.
- `TargetFramework` = `net10.0`.
- URL de Apps Script configurada en `appsettings.json`.
- Archivos Apps Script de referencia actualizados a V4.5.
- Sintaxis de todos los archivos JavaScript validada con `node --check`.
- Archivos JSON (`appsettings*` y `launchSettings.json`) validados.
- Acciones utilizadas por la interfaz comparadas contra `GatewayController` y API V4.5: sin faltantes.
- IDs DOM usados por cada JavaScript comparados contra sus vistas Razor: sin faltantes.
- Contraseña temporal del administrador NO incluida en el repositorio.
- Imágenes del producto incluidas en `wwwroot/images`.
- Dockerfile preparado para imágenes `mcr.microsoft.com/dotnet/sdk:10.0` y `aspnet:10.0`.
- Workflow de GitHub Actions agregado para `restore` y `build` con .NET 10.

## Comprobacion pendiente automatica

El entorno donde se revisó este ZIP no dispone del SDK `dotnet`, por lo que la compilacion real debe ejecutarse en tu PC o automaticamente en GitHub Actions al subir el repositorio:

```bash
dotnet restore StrawberryControl.sln
dotnet build StrawberryControl.sln -c Release
```

Si el workflow de GitHub queda en verde, la compilacion del repositorio queda validada en .NET 10.
