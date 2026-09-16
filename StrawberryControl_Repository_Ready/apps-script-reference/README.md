# Google Apps Script compatible con la web

Estos son los archivos que corresponden al backend actualmente usado por Strawberry Control V4.5:

- `Automatizacion_V4_5_BASE_ESTABLE.gs`
- `API_V4_5_1_SIN_UI_ADMIN.gs`

La base operativa de pedidos permanece en el Google Sheet principal. Los datos nuevos de la web (usuarios, sesiones, historial, auditoría y metadatos) viven en la base auxiliar creada por `configurarBaseWebV45()`.

No subas credenciales ni contraseñas a este repositorio. La contraseña temporal del Administrador se genera en Apps Script y debe cambiarse después del primer acceso.
