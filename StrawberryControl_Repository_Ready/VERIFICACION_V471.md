# VERIFICACION V4.7.1

- Apps Script Automatizacion: sintaxis JavaScript validada con Node.
- Apps Script API: sintaxis JavaScript validada con Node.
- JavaScript web: sintaxis validada con Node.
- ASP.NET: healthz marcado 4.7.1; el entorno de generacion no incluye SDK .NET, por lo que el build real debe validarse en Render/GitHub Actions.
- La sincronizacion ya no reescribe pedidos existentes: solo inserta pedidos que no existen por N. de pedido.
- `listOrders` lee CONFIGURACION WEB una sola vez por consulta, no una vez por pedido.
