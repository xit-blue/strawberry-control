# Arquitectura Strawberry Control V4.5

```text
SHOPIFY
   |
   v
GOOGLE SHEET PRINCIPAL
  - Hoja 1
  - GESTION PEDIDOS
  - GASTOS PUBLICIDAD
  - RESUMEN DE VENTAS
  - CONFIGURACION (si existe)
   |
   | Apps Script
   v
GOOGLE APPS SCRIPT API V4.5
  - autenticacion de negocio
  - reglas de pedidos
  - bloqueo temporal de atencion
  - contador 1/5 de llamadas
  - cancelacion automatica al quinto intento
  - espera de adelanto y vencimiento a 7 dias
  - publicidad, resumen y proyecciones
   |
   +----------------------------+
   |                            |
   v                            v
SHEET PRINCIPAL          SHEET AUXILIAR V4.5
                         - USUARIOS
                         - SESIONES
                         - HISTORIAL LLAMADAS
                         - AUDITORIA
                         - PEDIDOS META
                         - CONFIGURACION WEB
   |
   | HTTPS / JSON
   v
ASP.NET CORE 10 MVC
  - C#
  - Razor / HTML
  - CSS responsive
  - JavaScript
  - Cookie Authentication
  - Antiforgery
  - autorizacion ADMIN / TRABAJADOR
   |
   v
NAVEGADOR
```

## Decisiones principales

- No se usa PostgreSQL en esta etapa.
- Google Sheets sigue siendo la fuente operativa.
- ASP.NET Core es la aplicacion web profesional y actua como servidor intermedio entre el navegador y Apps Script.
- El navegador no recibe ni almacena directamente el token de Apps Script.
- La base auxiliar evita modificar o reconstruir la estructura actual de `GESTION PEDIDOS`.
