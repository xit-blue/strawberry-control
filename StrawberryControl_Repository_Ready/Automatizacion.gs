/**
 * STRAWBERRY CONTROL V4.7.2 - PUBLICIDAD CORREGIDA + SINCRONIZACION INCREMENTAL
 * -----------------------------------------------------------------------------
 * HOJA 1            : fuente original de pedidos. NO SE MODIFICA.
 * GESTION PEDIDOS   : hoja operativa FB - TIK TOK.
 * GASTOS PUBLICIDAD : captura manual diaria de publicidad.
 * RESUMEN DE VENTAS : metricas reales y proyectadas por fecha/rango/plataforma.
 *
 * MEJORAS V3.6
 * - Estado REPETIDO disponible en Lima y Provincia.
 * - Los pedidos NUEVOS se marcan REPETIDO si otro N.º de pedido ya tiene
 *   el mismo nombre de cliente normalizado O el mismo telefono valido.
 * - La fila REPETIDO se pinta negra con letras blancas.
 * - RESUMEN DE VENTAS incorpora filtro TODAS / FACEBOOK / TIK TOK.
 * - La publicidad se separa por plataforma: FB SOLES o TIKTOK SOLES.
 *
 * INSTALACION
 * 1. Reemplaza TODO el contenido anterior de Automatizacion.gs por este archivo.
 * 2. Reemplaza API.gs por la version V3.6 incluida.
 * 3. Ejecuta actualizarSistemaV36() UNA SOLA VEZ.
 *
 * Se conserva la estructura A:AA de GESTION PEDIDOS y no se modifica Hoja 1.
 */

const SC_CONFIG = {
  VERSION: '4.7.2',
  HOJA_ORIGEN: 'Hoja 1',
  HOJA_GESTION: 'GESTION PEDIDOS',
  HOJA_GASTOS: 'GASTOS PUBLICIDAD',
  HOJA_RESUMEN: 'RESUMEN DE VENTAS',
  HOJA_CONFIG_NEGOCIO: 'CONFIGURACION',
  PROP_MANTENIMIENTO: 'SC_MANTENIMIENTO',

  COLUMNAS_ORIGEN: 13,       // A:M de Hoja 1.
  COLUMNAS_GESTION: 27,      // A:AA. AA es telefono auxiliar oculto.
  COLUMNAS_VISIBLES: 26,     // A:Z visibles.
  COLUMNAS_TOTALES: 33,      // Hasta AG para el panel de configuracion.
  FILAS_PREPARADAS: 1000,
  FILAS_GASTOS_PREPARADAS: 500,
  FILAS_BUFFER: 100,

  ZONA_LIMA: 'LIMA',
  ZONA_PROVINCIA: 'PROVINCIA',

  ESTADOS_LIMA: [
    'Por llamar',
    'En espera',
    'Volver a llamar',
    'Repetido',
    'Confirmado',
    'Cancelado',
    'Programado',
    'Entregado'
  ],

  ESTADOS_PROVINCIA: [
    'Por llamar',
    'En espera',
    'Volver a llamar',
    'Repetido',
    'Confirmado',
    'Esperando adelanto',
    'Cancelado',
    'Enviado',
    'Entregado'
  ],

  DEFAULTS: {
    precio1: 90,
    precio2: 135,
    precio3: 180,
    precioExtra: 90,
    costoUnitario: 21.24,
    fleteLima: 12,
    fleteProvincia: 5,
    tipoCambioPublicidad: 3.5,
    producto: 'STRAWBERRY SKIN CREAM',
    um: 'UND',
    colorMorado: '#C11BE3',
    colorAmarillo: '#E3D91B',
    colorRojo: '#FA3E3E',
    colorAzul: '#1B50E3',
    colorVerde: '#1BE32F'
  }
};

// Indices base cero de GESTION PEDIDOS A:AA.
const SC_COL = {
  FECHA: 0,
  PLATAFORMA: 1,
  PEDIDO: 2,
  CLIENTE: 3,
  DEPARTAMENTO: 4,
  PROVINCIA: 5,
  DISTRITO: 6,
  DIRECCION: 7,
  CANT_SHOPIFY: 8,
  CANT_REAL: 9,
  PRODUCTO: 10,
  UM: 11,
  MONTO: 12,
  ZONA: 13,
  MODO_ZONA: 14,
  FLETE_COURIER: 15,
  FLETE_SHALOM: 16,
  CONDICION_PAGO: 17,
  ADELANTO: 18,
  SALDO: 19,
  FECHA_ENTREGA: 20,
  FECHA_ENVIO: 21,
  CLAVE_SHALOM: 22,
  ESTADO: 23,
  MOTIVO: 24,
  COMENTARIO: 25,
  TELEFONO_AUX: 26
};

const SC_RESUMEN = {
  PERIODO: 'B3',
  DESDE: 'E3',
  HASTA: 'H3',
  PLATAFORMA: 'B4',
  REAL_FECHA: 'B6',
  REAL_VALORES: 'B7:B13',
  PROY_FECHA: 'B17',
  PROY_VALORES: 'B18:B24',
  ACTUALIZADO: 'B27'
};

/**
 * INSTALACION / REPARACION PRINCIPAL.
 * - Pausa el activador automatico.
 * - Espera de forma segura a que termine cualquier sincronizacion anterior.
 * - No lanza el error "Lock timeout".
 * - Conserva los datos manuales y crea un respaldo antes de migrar.
 */
function instalarSistemaCompleto() {
  ejecutarMantenimientoSistemaV32_('Sistema completo instalado y reparado.');
}

/** Actualiza o repara una instalacion existente, incluida CLAVE SHALOM. */
function actualizarSistemaConClaveShalom() {
  ejecutarMantenimientoSistemaV32_('Sistema actualizado con CLAVE SHALOM.');
}

/** Funcion recomendada para corregir las versiones V3 y V3.2. */
function repararSistemaV32() {
  ejecutarMantenimientoSistemaV32_('Reparacion V3.2 completada correctamente.');
}

/** Aplica una sola vez las mejoras V3.6 sin cambiar la estructura de pedidos. */
function actualizarSistemaV36() {
  ejecutarMantenimientoSistemaV32_(
    'V3.6 aplicada: REPETIDO automatico y filtro de plataforma en RESUMEN DE VENTAS.'
  );
}

/** Corrige únicamente el formato de la columna W - CLAVE SHALOM. */
function repararFormatoClaveShalomV33() {
  const bloqueo = LockService.getDocumentLock();
  if (!bloqueo.tryLock(30000)) {
    throw new Error('Otra sincronizacion esta en proceso. Espera un minuto y vuelve a ejecutar.');
  }

  try {
    const libro = obtenerLibro_();
    const hoja = libro.getSheetByName(SC_CONFIG.HOJA_GESTION);
    if (!hoja) throw new Error('No existe la hoja GESTION PEDIDOS.');

    forzarFormatoClaveShalom_(hoja);
    libro.toast(
      'La columna CLAVE SHALOM fue corregida a texto. Ya no mostrara S/.',
      'STRAWBERRY CONTROL V3.6',
      8
    );
  } finally {
    bloqueo.releaseLock();
  }
}

function ejecutarMantenimientoSistemaV32_(mensajeFinal) {
  const propiedades = PropertiesService.getScriptProperties();
  propiedades.setProperty(SC_CONFIG.PROP_MANTENIMIENTO, '1');

  // Evita que un activador nuevo empiece mientras se prepara el sistema.
  eliminarActivadoresSincronizacion_();

  const bloqueo = LockService.getDocumentLock();
  let adquirido = false;

  try {
    // tryLock devuelve false en vez de lanzar la excepcion Lock timeout.
    adquirido = bloqueo.tryLock(120000);
    if (!adquirido) {
      const libroOcupado = SpreadsheetApp.getActiveSpreadsheet();
      if (libroOcupado) {
        libroOcupado.toast(
          'Otra sincronizacion sigue terminando. Espera un minuto y ejecuta repararSistemaV32 nuevamente.',
          'STRAWBERRY CONTROL',
          10
        );
      }
      return;
    }

    const libro = SpreadsheetApp.getActiveSpreadsheet();
    if (!libro) {
      throw new Error('Este proyecto debe estar vinculado al archivo de Google Sheets.');
    }

    const origen = libro.getSheetByName(SC_CONFIG.HOJA_ORIGEN);
    if (!origen) {
      throw new Error('No existe la hoja "' + SC_CONFIG.HOJA_ORIGEN + '".');
    }

    propiedades.setProperty('STRAWBERRY_SPREADSHEET_ID', libro.getId());
    propiedades.deleteProperty('SC_FILAS_PREPARADAS');

    let gestion = libro.getSheetByName(SC_CONFIG.HOJA_GESTION);
    if (!gestion) gestion = libro.insertSheet(SC_CONFIG.HOJA_GESTION);

    crearRespaldoLigeroSiHayDatos_(libro, gestion);
    migrarGestionV3A31SiCorresponde_(gestion);
    migrarGestionAntiguaSiCorresponde_(gestion);
    prepararGestion_(gestion);
    SpreadsheetApp.flush();

    let gastos = libro.getSheetByName(SC_CONFIG.HOJA_GASTOS);
    if (!gastos) gastos = libro.insertSheet(SC_CONFIG.HOJA_GASTOS);
    prepararGastos_(gastos);
    SpreadsheetApp.flush();

    let resumen = libro.getSheetByName(SC_CONFIG.HOJA_RESUMEN);
    if (!resumen) resumen = libro.insertSheet(SC_CONFIG.HOJA_RESUMEN);
    prepararResumen_(resumen);
    SpreadsheetApp.flush();

    sincronizarPedidosCore_(libro);
    recalcularTotalesGastosCore_(gastos);
    actualizarResumenVentasCore_(libro);

    libro.setActiveSheet(gestion);
    libro.toast(mensajeFinal, 'STRAWBERRY CONTROL V3.6', 8);
  } finally {
    if (adquirido) bloqueo.releaseLock();
    propiedades.deleteProperty(SC_CONFIG.PROP_MANTENIMIENTO);
    repararActivadorCore_();
  }
}

function sistemaEnMantenimiento_() {
  return PropertiesService.getScriptProperties()
    .getProperty(SC_CONFIG.PROP_MANTENIMIENTO) === '1';
}

function eliminarActivadoresSincronizacion_() {
  ScriptApp.getProjectTriggers().forEach(function(activador) {
    if (activador.getHandlerFunction() === 'sincronizarPedidos') {
      ScriptApp.deleteTrigger(activador);
    }
  });
}

/** Alias compatibles con nombres usados en versiones anteriores. */
function configurarSistemaV2() {
  instalarSistemaCompleto();
}

function repararInstalacionCompleta() {
  instalarSistemaCompleto();
}

function crearRepararHojasControlV23() {
  repararHojasGastosYResumen();
}

function repararSelectoresEstadoV22() {
  repararSelectoresEstado();
}

/** Menu superior del archivo. */
function onOpen() {
  try {
    SpreadsheetApp.getUi()
      .createMenu('STRAWBERRY CONTROL')
      .addItem('Sincronizar pedidos ahora', 'sincronizarPedidos')
      .addItem('Recalcular pedidos', 'recalcularTodosLosPedidos')
      .addItem('Actualizar resumen', 'actualizarResumenVentas')
      .addItem('Aplicar mejoras V3.6', 'actualizarSistemaV36')
      .addSeparator()
      .addItem('Reparar selectores de estado', 'repararSelectoresEstado')
      .addItem('Reparar suma de gastos', 'repararSumaGastosV35')
      .addItem('Reparar Gastos y Resumen', 'repararHojasGastosYResumen')
      .addItem('Reparar activador automatico', 'repararActivador')
      .addItem('Reparar sistema completo V3.2', 'repararSistemaV32')
      .addToUi();
  } catch (error) {
    console.log(error);
  }
}

/**
 * Sincronizacion publica. Hoja 1 nunca se modifica.
 */
function sincronizarPedidos() {
  if (sistemaEnMantenimiento_()) return;
  const bloqueo = LockService.getDocumentLock();
  if (!bloqueo.tryLock(12000)) return;

  try {
    const libro = obtenerLibro_();
    const resultado = sincronizarPedidosCore_(libro);
    // Solo actualizamos el resumen si realmente ingresaron pedidos nuevos.
    if (resultado && resultado.insertados > 0) {
      actualizarResumenVentasCore_(libro);
    }
  } finally {
    bloqueo.releaseLock();
  }
}

/**
 * V4.7.1 - Sincronizacion incremental.
 * - Hoja 1 es solo fuente de ALTAS.
 * - Un pedido que ya existe en GESTION PEDIDOS NO se reescribe.
 * - Solo se insertan pedidos nuevos y se calculan una vez con la configuracion vigente.
 * - Las correcciones posteriores viven en GESTION PEDIDOS y no se pisan con Shopify.
 */
function sincronizarPedidosCore_(libro) {
  const origen = libro.getSheetByName(SC_CONFIG.HOJA_ORIGEN);
  const gestion = libro.getSheetByName(SC_CONFIG.HOJA_GESTION);

  if (!origen) throw new Error('No existe la hoja "' + SC_CONFIG.HOJA_ORIGEN + '".');
  if (!gestion) throw new Error('No existe la hoja "' + SC_CONFIG.HOJA_GESTION + '".');

  const configuracion = leerConfiguracion_(gestion);
  const filasOrigen = leerOrigen_(origen);
  const existentes = leerGestion_(gestion);
  const mapaExistentes = existentes.mapa;
  const indiceIdentidades = crearIndiceIdentidades_(existentes.filas);
  const vistosOrigen = new Set();
  const nuevas = [];

  filasOrigen.forEach(function(filaOrigen) {
    const pedido = normalizarPedido_(filaOrigen[1]);
    if (!pedido || vistosOrigen.has(pedido)) return;
    vistosOrigen.add(pedido);

    // Regla central: si ya esta en GESTION PEDIDOS, no se toca.
    if (mapaExistentes.has(pedido)) return;

    const nombreClave = normalizarNombreRepetido_(filaOrigen[2]);
    const telefonoClave = normalizarTelefonoRepetido_(filaOrigen[3]);
    const marcarRepetido = existeIdentidadEnOtroPedido_(
      indiceIdentidades,
      pedido,
      nombreClave,
      telefonoClave
    );

    const filaGestion = construirFilaGestion_(
      filaOrigen,
      null,
      configuracion,
      marcarRepetido
    );
    nuevas.push(filaGestion);

    registrarIdentidadPedido_(
      indiceIdentidades,
      pedido,
      nombreClave,
      telefonoClave
    );
  });

  if (!nuevas.length) {
    return {
      insertados: 0,
      origen: vistosOrigen.size,
      existentes: existentes.filas.length
    };
  }

  const filaInicio = Math.max(2, existentes.ultimaFila + 1);
  const filaFin = filaInicio + nuevas.length - 1;
  asegurarTamanoHoja_(gestion, filaFin, SC_CONFIG.COLUMNAS_TOTALES);

  // Una sola escritura para todos los pedidos nuevos.
  gestion
    .getRange(filaInicio, 1, nuevas.length, SC_CONFIG.COLUMNAS_GESTION)
    .setValues(nuevas);

  // Validaciones solo para las filas recien creadas, no para toda la hoja.
  aplicarValidacionesBaseGestion_(gestion, filaInicio, nuevas.length);
  aplicarValidacionesEstadoDatos_(gestion, filaInicio, nuevas);

  // Formato minimo solo para las nuevas filas. Evita reformatear 1000 filas cada minuto.
  aplicarFormatoNuevasFilasV471_(gestion, filaInicio, nuevas.length);

  // Marcador de ultima sincronizacion. No es necesario para el negocio, solo diagnostico.
  try {
    gestion.getRange('AG11')
      .setValue(new Date())
      .setNumberFormat('dd/mm/yyyy HH:mm:ss');
  } catch (e) {
    console.log('No se pudo actualizar marcador AG11: ' + e);
  }

  return {
    insertados: nuevas.length,
    origen: vistosOrigen.size,
    existentes: existentes.filas.length
  };
}

/** Formato ligero para filas nuevas. No toca filas historicas. */
function aplicarFormatoNuevasFilasV471_(hoja, filaInicio, cantidad) {
  if (!cantidad || cantidad <= 0) return;

  const rangoVisible = hoja.getRange(filaInicio, 1, cantidad, SC_CONFIG.COLUMNAS_VISIBLES);
  rangoVisible
    .setFontFamily('Arial')
    .setFontSize(9)
    .setVerticalAlignment('middle');

  hoja.getRange(filaInicio, 1, cantidad, 1).setNumberFormat('dd/mm/yyyy');
  hoja.getRange(filaInicio, 3, cantidad, 1).setNumberFormat('@');
  hoja.getRange(filaInicio, 9, cantidad, 2).setNumberFormat('0');
  hoja.getRange(filaInicio, 13, cantidad, 1).setNumberFormat('"S/" #,##0.00');
  hoja.getRange(filaInicio, 16, cantidad, 2).setNumberFormat('"S/" #,##0.00');
  hoja.getRange(filaInicio, 18, cantidad, 1).setNumberFormat('@');
  hoja.getRange(filaInicio, 19, cantidad, 2).setNumberFormat('"S/" #,##0.00');
  hoja.getRange(filaInicio, 21, cantidad, 2).setNumberFormat('dd/mm/yyyy');
  hoja.getRange(filaInicio, 23, cantidad, 1).setNumberFormat('@');
  hoja.getRange(filaInicio, 26, cantidad, 1).setWrap(true);
  hoja.getRange(filaInicio, 27, cantidad, 1).setNumberFormat('@');

  // Colores de fuente siguiendo la logica historica.
  hoja.getRange(filaInicio, 1, cantidad, 9).setFontColor('#166534');
  hoja.getRange(filaInicio, 11, cantidad, 3).setFontColor('#111827');
  [10, 14, 15, 17, 19, 21, 22, 23, 24, 25, 26, 27].forEach(function(columna) {
    hoja.getRange(filaInicio, columna, cantidad, 1).setFontColor('#0B57D0');
  });
}

/** Recalcula todos los pedidos sin volver a leer Hoja 1. */
function recalcularTodosLosPedidos() {
  if (sistemaEnMantenimiento_()) return;
  const bloqueo = LockService.getDocumentLock();
  if (!bloqueo.tryLock(30000)) return;

  try {
    recalcularTodosLosPedidosCore_(obtenerLibro_());
  } finally {
    bloqueo.releaseLock();
  }
}

function recalcularTodosLosPedidosCore_(libro) {
  const gestion = libro.getSheetByName(SC_CONFIG.HOJA_GESTION);
  if (!gestion) throw new Error('No existe GESTION PEDIDOS.');

  const lectura = leerGestion_(gestion);
  if (!lectura.filas.length) {
    actualizarResumenVentasCore_(libro);
    return;
  }

  const configuracion = leerConfiguracion_(gestion);
  const salida = lectura.filas.map(function(registro) {
    return recalcularFilaGestion_(registro.datos, configuracion);
  });

  gestion
    .getRange(2, 1, salida.length, SC_CONFIG.COLUMNAS_GESTION)
    .setValues(salida);
  aplicarValidacionesBaseGestion_(gestion, 2, salida.length);
  aplicarValidacionesEstadoDatos_(gestion, 2, salida);
  prepararColoresPorEstado_(gestion, configuracion);
  gestion.getRange('AG11')
    .setValue(new Date())
    .setNumberFormat('dd/mm/yyyy HH:mm:ss');

  actualizarResumenVentasCore_(libro);
}

/** Control de ediciones manuales en las tres hojas. */
function onEdit(evento) {
  if (!evento || !evento.range || sistemaEnMantenimiento_()) return;

  const hoja = evento.range.getSheet();
  const nombre = hoja.getName();

  // GASTOS PUBLICIDAD se procesa sin DocumentLock. Es una operacion corta y
  // debe actualizar el total aun cuando la sincronizacion de pedidos este activa.
  if (nombre === SC_CONFIG.HOJA_GASTOS) {
    try {
      manejarEdicionGastos_(evento);
    } catch (error) {
      console.error(error);
    }
    return;
  }

  const bloqueo = LockService.getDocumentLock();
  if (!bloqueo.tryLock(10000)) return;

  try {
    if (nombre === SC_CONFIG.HOJA_GESTION) {
      manejarEdicionGestion_(evento);
    } else if (nombre === SC_CONFIG.HOJA_RESUMEN) {
      manejarEdicionResumen_(evento);
    } else if (nombre === SC_CONFIG.HOJA_CONFIG_NEGOCIO) {
      manejarEdicionConfiguracionV47_(evento);
    }
  } catch (error) {
    console.error(error);
  } finally {
    bloqueo.releaseLock();
  }
}

function manejarEdicionGestion_(evento) {
  const hoja = evento.range.getSheet();
  const filaInicial = evento.range.getRow();
  const filaFinal = evento.range.getLastRow();
  const colInicial = evento.range.getColumn();
  const colFinal = evento.range.getLastColumn();

  // Panel de configuracion AG2:AG10 y AG13:AG17.
  const tocaAG = colInicial <= 33 && colFinal >= 33;
  const tocaFilaConfig =
    (filaInicial <= 10 && filaFinal >= 2) ||
    (filaInicial <= 17 && filaFinal >= 13);

  if (tocaAG && tocaFilaConfig) {
    normalizarPanelConfiguracion_(hoja);
    sincronizarConfigDesdePanelV47_(hoja);
    recalcularTodosLosPedidosCore_(obtenerLibro_());
    return;
  }

  if (filaFinal < 2) return;

  const columnasRelevantes = [
    4, 5, 6, 7, 8, // cliente, ubicacion y direccion editables en GESTION PEDIDOS
    10,             // cantidad real
    14, 15,         // zona y modo zona
    17,              // flete Shalom
    19,              // adelanto
    21, 22,          // fechas
    23,              // clave Shalom
    24, 25, 26,      // estado, motivo, comentario
    27               // telefono operativo sin +51
  ];

  const tocaRelevante = columnasRelevantes.some(function(columna) {
    return columna >= colInicial && columna <= colFinal;
  });
  if (!tocaRelevante) return;

  const cantidadFilas = filaFinal - filaInicial + 1;
  const datos = hoja
    .getRange(filaInicial, 1, cantidadFilas, SC_CONFIG.COLUMNAS_GESTION)
    .getValues();
  const configuracion = leerConfiguracion_(hoja);
  let hayPedido = false;
  let claveRechazada = false;

  const procesadas = datos.map(function(fila) {
    if (!normalizarPedido_(fila[SC_COL.PEDIDO])) return fila;
    hayPedido = true;

    if (14 >= colInicial && 14 <= colFinal) {
      fila[SC_COL.ZONA] = normalizarZona_(fila[SC_COL.ZONA]);
      fila[SC_COL.MODO_ZONA] = 'MANUAL';
    }

    if (15 >= colInicial && 15 <= colFinal) {
      fila[SC_COL.MODO_ZONA] =
        normalizarTexto_(fila[SC_COL.MODO_ZONA]) === 'manual'
          ? 'MANUAL'
          : 'AUTO';
    }

    if (23 >= colInicial && 23 <= colFinal) {
      const zonaClave = normalizarZona_(fila[SC_COL.ZONA]);
      const estadoClave = normalizarTexto_(fila[SC_COL.ESTADO]);
      const permiteClave =
        zonaClave === SC_CONFIG.ZONA_PROVINCIA &&
        (estadoClave === 'enviado' || estadoClave === 'entregado');
      if (!permiteClave && String(fila[SC_COL.CLAVE_SHALOM] || '').trim()) {
        claveRechazada = true;
      }
    }

    return recalcularFilaGestion_(fila, configuracion);
  });

  if (!hayPedido) return;

  hoja
    .getRange(filaInicial, 1, cantidadFilas, SC_CONFIG.COLUMNAS_GESTION)
    .setValues(procesadas);
  aplicarValidacionesBaseGestion_(hoja, filaInicial, cantidadFilas);
  aplicarValidacionesEstadoDatos_(hoja, filaInicial, procesadas);
  if (claveRechazada) {
    obtenerLibro_().toast(
      'La clave Shalom solo se guarda en PROVINCIA con estado Enviado o Entregado.',
      'CLAVE SHALOM',
      6
    );
  }
  actualizarResumenVentasCore_(obtenerLibro_());
}

function manejarEdicionGastos_(evento) {
  const colInicial = evento.range.getColumn();
  const colFinal = evento.range.getLastColumn();

  // Solo interesa la tabla A:F. Si se modifica FECHA o cualquier importe,
  // se recalcula el total de las filas afectadas y luego el resumen.
  if (colInicial > 6 || colFinal < 1) return;

  const hoja = evento.range.getSheet();
  const filaInicial = Math.max(2, evento.range.getRow());
  const filaFinal = Math.max(filaInicial, evento.range.getLastRow());
  const cantidad = filaFinal - filaInicial + 1;

  actualizarGastosPublicidadFilasV472_(hoja, filaInicial, cantidad);

  try {
    actualizarResumenVentasCore_(obtenerLibro_());
  } catch (error) {
    console.error(error);
  }
}

function manejarEdicionResumen_(evento) {
  const hoja = evento.range.getSheet();
  const a1 = evento.range.getA1Notation();

  if (a1 === SC_RESUMEN.PERIODO) {
    aplicarPeriodoRapido_(hoja, String(evento.value || 'PERSONALIZADO'));
    actualizarResumenVentasCore_(obtenerLibro_());
    return;
  }

  if (a1 === SC_RESUMEN.DESDE || a1 === SC_RESUMEN.HASTA) {
    hoja.getRange(SC_RESUMEN.PERIODO).setValue('PERSONALIZADO');
    actualizarResumenVentasCore_(obtenerLibro_());
    return;
  }

  if (a1 === SC_RESUMEN.PLATAFORMA) {
    hoja.getRange(SC_RESUMEN.PLATAFORMA)
      .setValue(normalizarFiltroPlataforma_(evento.value));
    actualizarResumenVentasCore_(obtenerLibro_());
  }
}

/** Construye o actualiza una fila conservando datos manuales. */
function construirFilaGestion_(filaOrigen, anterior, configuracion, marcarRepetido) {
  const fila = new Array(SC_CONFIG.COLUMNAS_GESTION).fill('');

  fila[SC_COL.FECHA] = fechaParaHoja_(filaOrigen[0]);
  fila[SC_COL.PLATAFORMA] = detectarPlataforma_(filaOrigen[12]);
  fila[SC_COL.PEDIDO] = normalizarPedido_(filaOrigen[1]);
  fila[SC_COL.CLIENTE] = filaOrigen[2] || '';
  fila[SC_COL.DEPARTAMENTO] = filaOrigen[4] || '';
  fila[SC_COL.PROVINCIA] = filaOrigen[5] || '';
  fila[SC_COL.DISTRITO] = filaOrigen[6] || '';
  fila[SC_COL.DIRECCION] = filaOrigen[7] || '';
  fila[SC_COL.CANT_SHOPIFY] = Math.max(0, Math.floor(numeroSeguro_(filaOrigen[8])));
  fila[SC_COL.CANT_REAL] = fila[SC_COL.CANT_SHOPIFY];
  fila[SC_COL.PRODUCTO] = configuracion.producto;
  fila[SC_COL.UM] = configuracion.um;
  fila[SC_COL.ZONA] = clasificarZona_(
    fila[SC_COL.DEPARTAMENTO],
    fila[SC_COL.PROVINCIA],
    fila[SC_COL.DISTRITO]
  );
  fila[SC_COL.MODO_ZONA] = 'AUTO';
  fila[SC_COL.FLETE_SHALOM] = fila[SC_COL.ZONA] === SC_CONFIG.ZONA_LIMA
    ? 'NO APLICA'
    : 0;
  fila[SC_COL.ADELANTO] = fila[SC_COL.ZONA] === SC_CONFIG.ZONA_LIMA
    ? 'NO APLICA'
    : 0;
  fila[SC_COL.FECHA_ENTREGA] = fila[SC_COL.ZONA] === SC_CONFIG.ZONA_LIMA
    ? ''
    : 'NO APLICA';
  fila[SC_COL.FECHA_ENVIO] = fila[SC_COL.ZONA] === SC_CONFIG.ZONA_LIMA
    ? 'NO APLICA'
    : '';
  fila[SC_COL.ESTADO] = marcarRepetido ? 'Repetido' : 'Por llamar';
  fila[SC_COL.MOTIVO] = 'NO APLICA';
  fila[SC_COL.COMENTARIO] = '';
  fila[SC_COL.TELEFONO_AUX] = limpiarTelefono_(filaOrigen[3]);
  fila[SC_COL.CLAVE_SHALOM] = '';

  if (anterior) {
    // GESTION PEDIDOS es la hoja operativa. Una vez creado el pedido,
    // las correcciones manuales hechas por los trabajadores deben sobrevivir
    // a las siguientes sincronizaciones desde Hoja 1.
    if (!estaVacio_(anterior[SC_COL.CLIENTE])) fila[SC_COL.CLIENTE] = anterior[SC_COL.CLIENTE];
    if (!estaVacio_(anterior[SC_COL.DEPARTAMENTO])) fila[SC_COL.DEPARTAMENTO] = anterior[SC_COL.DEPARTAMENTO];
    if (!estaVacio_(anterior[SC_COL.PROVINCIA])) fila[SC_COL.PROVINCIA] = anterior[SC_COL.PROVINCIA];
    if (!estaVacio_(anterior[SC_COL.DISTRITO])) fila[SC_COL.DISTRITO] = anterior[SC_COL.DISTRITO];
    if (!estaVacio_(anterior[SC_COL.DIRECCION])) fila[SC_COL.DIRECCION] = anterior[SC_COL.DIRECCION];
    if (!estaVacio_(anterior[SC_COL.TELEFONO_AUX])) fila[SC_COL.TELEFONO_AUX] = limpiarTelefono_(anterior[SC_COL.TELEFONO_AUX]);

    fila[SC_COL.CANT_REAL] = estaVacio_(anterior[SC_COL.CANT_REAL])
      ? fila[SC_COL.CANT_SHOPIFY]
      : anterior[SC_COL.CANT_REAL];

    const modoAnterior =
      normalizarTexto_(anterior[SC_COL.MODO_ZONA]) === 'manual'
        ? 'MANUAL'
        : 'AUTO';
    fila[SC_COL.MODO_ZONA] = modoAnterior;
    if (modoAnterior === 'MANUAL') {
      fila[SC_COL.ZONA] = normalizarZona_(anterior[SC_COL.ZONA]);
    }

    fila[SC_COL.FLETE_SHALOM] = anterior[SC_COL.FLETE_SHALOM];
    fila[SC_COL.ADELANTO] = anterior[SC_COL.ADELANTO];
    fila[SC_COL.FECHA_ENTREGA] = anterior[SC_COL.FECHA_ENTREGA];
    fila[SC_COL.FECHA_ENVIO] = anterior[SC_COL.FECHA_ENVIO];
    fila[SC_COL.ESTADO] = anterior[SC_COL.ESTADO] || 'Por llamar';
    fila[SC_COL.MOTIVO] = anterior[SC_COL.MOTIVO];
    fila[SC_COL.COMENTARIO] = anterior[SC_COL.COMENTARIO] || '';
    fila[SC_COL.CLAVE_SHALOM] = anterior[SC_COL.CLAVE_SHALOM] || '';
  }

  return recalcularFilaGestion_(fila, configuracion);
}

/** Funcion central de calculo, compartida con API.gs. */
function recalcularFilaGestion_(filaEntrada, configuracion) {
  const fila = filaEntrada.slice(0, SC_CONFIG.COLUMNAS_GESTION);
  while (fila.length < SC_CONFIG.COLUMNAS_GESTION) fila.push('');

  let modoZona =
    normalizarTexto_(fila[SC_COL.MODO_ZONA]) === 'manual'
      ? 'MANUAL'
      : 'AUTO';
  let zona = normalizarZona_(fila[SC_COL.ZONA]);

  if (modoZona === 'AUTO') {
    zona = clasificarZona_(
      fila[SC_COL.DEPARTAMENTO],
      fila[SC_COL.PROVINCIA],
      fila[SC_COL.DISTRITO]
    );
  }

  const cantidadShopify = Math.max(
    0,
    Math.floor(numeroSeguro_(fila[SC_COL.CANT_SHOPIFY]))
  );
  const cantidadReal = estaVacio_(fila[SC_COL.CANT_REAL])
    ? cantidadShopify
    : Math.max(0, Math.floor(numeroSeguro_(fila[SC_COL.CANT_REAL])));

  const monto = calcularMonto_(cantidadReal, configuracion);
  const estado = adaptarEstadoAZona_(fila[SC_COL.ESTADO], zona);
  const cancelado = normalizarTexto_(estado) === 'cancelado';

  fila[SC_COL.CANT_SHOPIFY] = cantidadShopify;
  fila[SC_COL.CANT_REAL] = cantidadReal;
  fila[SC_COL.PRODUCTO] = configuracion.producto;
  fila[SC_COL.UM] = configuracion.um;
  fila[SC_COL.MONTO] = monto;
  fila[SC_COL.ZONA] = zona;
  fila[SC_COL.MODO_ZONA] = modoZona;
  fila[SC_COL.FLETE_COURIER] = zona === SC_CONFIG.ZONA_LIMA
    ? configuracion.fleteLima
    : configuracion.fleteProvincia;
  fila[SC_COL.CONDICION_PAGO] = zona === SC_CONFIG.ZONA_LIMA
    ? 'CONTADO'
    : 'PARCIAL';
  fila[SC_COL.ESTADO] = estado;

  if (zona === SC_CONFIG.ZONA_LIMA) {
    fila[SC_COL.FLETE_SHALOM] = 'NO APLICA';
    fila[SC_COL.ADELANTO] = 'NO APLICA';
    fila[SC_COL.SALDO] = 'NO APLICA';
    fila[SC_COL.FECHA_ENTREGA] = normalizarNoAplica_(fila[SC_COL.FECHA_ENTREGA])
      ? ''
      : fila[SC_COL.FECHA_ENTREGA];
    fila[SC_COL.FECHA_ENVIO] = 'NO APLICA';
  } else {
    const adelanto = Math.min(
      Math.max(0, numeroSeguro_(fila[SC_COL.ADELANTO])),
      monto
    );
    fila[SC_COL.FLETE_SHALOM] = Math.max(
      0,
      numeroSeguro_(fila[SC_COL.FLETE_SHALOM])
    );
    fila[SC_COL.ADELANTO] = adelanto;
    fila[SC_COL.SALDO] = Math.max(0, monto - adelanto);
    fila[SC_COL.FECHA_ENTREGA] = 'NO APLICA';
    fila[SC_COL.FECHA_ENVIO] = normalizarNoAplica_(fila[SC_COL.FECHA_ENVIO])
      ? ''
      : fila[SC_COL.FECHA_ENVIO];
  }

  if (cancelado) {
    if (normalizarNoAplica_(fila[SC_COL.MOTIVO])) {
      fila[SC_COL.MOTIVO] = '';
    }
  } else {
    fila[SC_COL.MOTIVO] = 'NO APLICA';
  }

  fila[SC_COL.COMENTARIO] = String(fila[SC_COL.COMENTARIO] || '');
  fila[SC_COL.TELEFONO_AUX] = limpiarTelefono_(fila[SC_COL.TELEFONO_AUX]);

  // La clave solo se edita en PROVINCIA cuando el pedido esta Enviado o Entregado.
  const estadoClave = normalizarTexto_(estado);
  const permiteClave =
    zona === SC_CONFIG.ZONA_PROVINCIA &&
    (estadoClave === 'enviado' || estadoClave === 'entregado');

  if (zona === SC_CONFIG.ZONA_LIMA) {
    fila[SC_COL.CLAVE_SHALOM] = 'NO APLICA';
  } else if (permiteClave) {
    fila[SC_COL.CLAVE_SHALOM] = normalizarNoAplica_(fila[SC_COL.CLAVE_SHALOM])
      ? ''
      : String(fila[SC_COL.CLAVE_SHALOM] || '').trim();
  } else {
    fila[SC_COL.CLAVE_SHALOM] = '';
  }

  return fila;
}

function calcularMonto_(cantidad, configuracion) {
  const unidades = Math.max(0, Math.floor(numeroSeguro_(cantidad)));
  if (unidades === 1) return configuracion.precio1;
  if (unidades === 2) return configuracion.precio2;
  if (unidades === 3) return configuracion.precio3;
  if (unidades > 3) {
    return configuracion.precio3 +
      ((unidades - 3) * configuracion.precioExtra);
  }
  return 0;
}

/** Configura la hoja operativa sin tocar Hoja 1. */
function prepararGestion_(hoja) {
  asegurarTamanoHoja_(
    hoja,
    SC_CONFIG.FILAS_PREPARADAS + 1,
    SC_CONFIG.COLUMNAS_TOTALES
  );

  const encabezados = [[
    'FECHA DE PEDIDO',
    'PLATAFORMA',
    'N.º PEDIDO',
    'CLIENTE',
    'DEPARTAMENTO',
    'PROV',
    'DISTRITO',
    'DIRECCIÓN',
    'CANT SHOPIFY',
    'CANT REAL',
    'PRODUCTO',
    'UM',
    'MONTO (S/)',
    'ZONA',
    'MODO ZONA',
    'FLETE COURIER',
    'FLETE SHALOM',
    'CONDICIÓN DE PAGO',
    'ADELANTO',
    'SALDO',
    'FECHA DE ENTREGA',
    'FECHA DE ENVÍO',
    'CLAVE SHALOM',
    'ESTADO',
    'MOTIVO',
    'COMENTARIO',
    'TELÉFONO'
  ]];

  hoja.getRange(1, 1, 1, SC_CONFIG.COLUMNAS_GESTION)
    .clearDataValidations()
    .setValues(encabezados)
    .setBackground('#F4B183')
    .setFontColor('#111827')
    .setFontWeight('bold')
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle')
    .setWrap(true);

  hoja.getRange('W1').setNote(
    'Solo se ingresa para pedidos de PROVINCIA cuando el estado es Enviado o Entregado.'
  );

  hoja.setFrozenRows(1);
  hoja.setFrozenColumns(3);
  hoja.setRowHeight(1, 42);

  // Anchos agrupados para reducir llamadas al servicio.
  hoja.setColumnWidth(1, 112);
  hoja.setColumnWidths(2, 2, 105);
  hoja.setColumnWidth(4, 205);
  hoja.setColumnWidths(5, 3, 125);
  hoja.setColumnWidth(8, 250);
  hoja.setColumnWidths(9, 2, 90);
  hoja.setColumnWidth(11, 190);
  hoja.setColumnWidth(12, 65);
  hoja.setColumnWidths(13, 6, 105);
  hoja.setColumnWidths(19, 2, 95);
  hoja.setColumnWidths(21, 2, 115);
  hoja.setColumnWidth(23, 140);
  hoja.setColumnWidth(24, 130);
  hoja.setColumnWidth(25, 180);
  hoja.setColumnWidth(26, 250);
  hoja.setColumnWidth(27, 125);
  hoja.setColumnWidth(31, 24);
  hoja.setColumnWidth(32, 210);
  hoja.setColumnWidth(33, 130);

  try {
    hoja.showColumns(23, 5); // W:AA, incluido TELEFONO visible.
  } catch (error) {
    console.log(error);
  }

  prepararPanelConfiguracion_(hoja);
  asegurarFormatoGestionHasta_(hoja, SC_CONFIG.FILAS_PREPARADAS);
  // Fuerza W como texto incluso si una version anterior dejo formato monetario.
  forzarFormatoClaveShalom_(hoja);
  prepararColoresPorEstado_(hoja, leerConfiguracion_(hoja));
  hoja.setTabColor('#F4B183');
}

function asegurarFormatoGestionHasta_(hoja, cantidadFilas) {
  const preparada = Math.max(
    0,
    Number(PropertiesService.getScriptProperties().getProperty('SC_FILAS_PREPARADAS') || 0)
  );
  if (cantidadFilas <= preparada) return;

  const filaInicio = preparada > 0 ? preparada + 2 : 2;
  const filaFin = cantidadFilas + 1;
  const numeroFilas = filaFin - filaInicio + 1;
  if (numeroFilas <= 0) return;

  asegurarTamanoHoja_(hoja, filaFin, SC_CONFIG.COLUMNAS_TOTALES);
  const rangoVisible = hoja.getRange(
    filaInicio,
    1,
    numeroFilas,
    SC_CONFIG.COLUMNAS_VISIBLES
  );
  rangoVisible
    .setFontFamily('Arial')
    .setFontSize(9)
    .setVerticalAlignment('middle');

  hoja.getRange(filaInicio, 1, numeroFilas, 1).setNumberFormat('dd/mm/yyyy');
  hoja.getRange(filaInicio, 3, numeroFilas, 1).setNumberFormat('@');
  hoja.getRange(filaInicio, 9, numeroFilas, 2).setNumberFormat('0');
  hoja.getRange(filaInicio, 13, numeroFilas, 1).setNumberFormat('"S/" #,##0.00');
  hoja.getRange(filaInicio, 16, numeroFilas, 2).setNumberFormat('"S/" #,##0.00');
  hoja.getRange(filaInicio, 18, numeroFilas, 1).setNumberFormat('@');
  hoja.getRange(filaInicio, 19, numeroFilas, 2).setNumberFormat('"S/" #,##0.00');
  hoja.getRange(filaInicio, 21, numeroFilas, 2).setNumberFormat('dd/mm/yyyy');
  hoja.getRange(filaInicio, 23, numeroFilas, 1).setNumberFormat('@');
  hoja.getRange(filaInicio, 26, numeroFilas, 1).setWrap(true);
  hoja.getRange(filaInicio, 27, numeroFilas, 1).setNumberFormat('@');

  // Importados desde Hoja 1.
  hoja.getRange(filaInicio, 1, numeroFilas, 9).setFontColor('#166534');
  // Campos calculados.
  hoja.getRange(filaInicio, 11, numeroFilas, 3).setFontColor('#111827');
  // Campos manipulables.
  [10, 14, 15, 17, 19, 21, 22, 23, 24, 25, 26].forEach(function(columna) {
    hoja.getRange(filaInicio, columna, numeroFilas, 1).setFontColor('#0B57D0');
  });

  aplicarValidacionesBaseGestion_(hoja, filaInicio, numeroFilas);
  PropertiesService.getScriptProperties().setProperty(
    'SC_FILAS_PREPARADAS',
    String(cantidadFilas)
  );
}

/**
 * Deja CLAVE SHALOM como texto plano y convierte valores numéricos antiguos
 * a texto para quitar de inmediato cualquier formato S/.
 */
function forzarFormatoClaveShalom_(hoja) {
  const cantidadFilas = Math.max(1, hoja.getMaxRows() - 1);
  const rango = hoja.getRange(2, SC_COL.CLAVE_SHALOM + 1, cantidadFilas, 1);
  const valores = rango.getValues().map(function(fila) {
    const valor = fila[0];
    if (valor === '' || valor === null) return [''];
    return [String(valor)];
  });

  rango
    .clearDataValidations()
    .setNumberFormat('@')
    .setHorizontalAlignment('left')
    .setValues(valores);
}

function prepararPanelConfiguracion_(hoja) {
  const d = SC_CONFIG.DEFAULTS;
  const marcador = String(hoja.getRange('AF1').getValue() || '').trim();
  let valores;

  if (marcador.indexOf('CONFIGURACIÓN SISTEMA') === 0) {
    valores = hoja.getRange('AG2:AG17').getValues().flat();
  } else {
    valores = [
      d.precio1,
      d.precio2,
      d.precio3,
      d.precioExtra,
      d.costoUnitario,
      d.fleteLima,
      d.fleteProvincia,
      d.producto,
      d.um,
      new Date(),
      '',
      d.colorMorado,
      d.colorAmarillo,
      d.colorRojo,
      d.colorAzul,
      d.colorVerde
    ];
  }

  const etiquetas = [
    ['PRECIO 1 UNIDAD'],
    ['PRECIO 2 UNIDADES'],
    ['PRECIO 3 UNIDADES'],
    ['PRECIO UNIDAD EXTRA'],
    ['COSTO UNITARIO'],
    ['FLETE LIMA'],
    ['FLETE PROVINCIA'],
    ['PRODUCTO'],
    ['UM'],
    ['ÚLTIMA SINCRONIZACIÓN'],
    [''],
    ['COLOR MORADO'],
    ['COLOR AMARILLO'],
    ['COLOR ROJO'],
    ['COLOR AZUL'],
    ['COLOR VERDE']
  ];

  hoja.getRange('AF1:AG17').breakApart().clearFormat();
  hoja.getRange('AF1:AG1')
    .setValues([['CONFIGURACIÓN SISTEMA V3', 'VALOR']])
    .setBackground('#16324F')
    .setFontColor('#FFFFFF')
    .setFontWeight('bold');
  hoja.getRange('AF2:AF17')
    .setValues(etiquetas)
    .setBackground('#EEF2F7')
    .setFontColor('#172033')
    .setFontWeight('bold');
  hoja.getRange('AG2:AG17').setValues(
    valores.map(function(valor) { return [valor]; })
  );
  hoja.getRange('AG2:AG8')
    .setNumberFormat('"S/" #,##0.00')
    .setFontColor('#0B57D0')
    .setFontWeight('bold');
  hoja.getRange('AG9:AG10').setFontColor('#0B57D0').setFontWeight('bold');
  hoja.getRange('AG11').setNumberFormat('dd/mm/yyyy HH:mm:ss');
  hoja.getRange('AG13:AG17').setFontColor('#0B57D0').setFontWeight('bold');
  hoja.getRange('AF1:AG17').setBorder(
    true, true, true, true, true, true,
    '#CBD5E1', SpreadsheetApp.BorderStyle.SOLID
  );

  normalizarPanelConfiguracion_(hoja);
}

function normalizarPanelConfiguracion_(hoja) {
  const d = SC_CONFIG.DEFAULTS;
  const numericas = [
    ['AG2', d.precio1],
    ['AG3', d.precio2],
    ['AG4', d.precio3],
    ['AG5', d.precioExtra],
    ['AG6', d.costoUnitario],
    ['AG7', d.fleteLima],
    ['AG8', d.fleteProvincia]
  ];

  numericas.forEach(function(item) {
    const celda = hoja.getRange(item[0]);
    const valorActual = celda.getValue();
    const valor = estaVacio_(valorActual)
      ? item[1]
      : Math.max(0, numeroSeguro_(valorActual));
    celda.setValue(valor);
  });

  if (!String(hoja.getRange('AG9').getValue() || '').trim()) {
    hoja.getRange('AG9').setValue(d.producto);
  }
  if (!String(hoja.getRange('AG10').getValue() || '').trim()) {
    hoja.getRange('AG10').setValue(d.um);
  }

  [
    ['AG13', d.colorMorado],
    ['AG14', d.colorAmarillo],
    ['AG15', d.colorRojo],
    ['AG16', d.colorAzul],
    ['AG17', d.colorVerde]
  ].forEach(function(item) {
    const celda = hoja.getRange(item[0]);
    celda.setValue(colorSeguro_(celda.getValue(), item[1]));
  });
}

function leerConfiguracion_(hoja) {
  const d = SC_CONFIG.DEFAULTS;
  const libro = hoja && hoja.getParent ? hoja.getParent() : obtenerLibro_();

  // V4.7: CONFIGURACION es la fuente principal de precios, costos y fletes.
  // Si faltan claves, se completa de forma no destructiva a partir del panel AF:AG
  // o de los valores por defecto del negocio.
  try {
    const config = libro.getSheetByName(SC_CONFIG.HOJA_CONFIG_NEGOCIO);
    if (config && config.getLastRow() >= 2) {
      const datos = config.getRange(2, 1, config.getLastRow() - 1, Math.min(3, config.getMaxColumns())).getValues();
      const mapa = {};
      datos.forEach(function(f) {
        const clave = String(f[0] || '').trim().toUpperCase();
        if (clave) mapa[clave] = f[1];
      });
      if (Object.keys(mapa).length) {
        return {
          precio1: numeroConfig_(mapa.PRECIO_1_UNIDAD, d.precio1),
          precio2: numeroConfig_(mapa.PRECIO_2_UNIDADES, d.precio2),
          precio3: numeroConfig_(mapa.PRECIO_3_UNIDADES, d.precio3),
          precioExtra: numeroConfig_(mapa.PRECIO_UNIDAD_EXTRA, d.precioExtra),
          costoUnitario: numeroConfig_(mapa.COSTO_UNITARIO, d.costoUnitario),
          fleteLima: numeroConfig_(mapa.FLETE_LIMA, d.fleteLima),
          fleteProvincia: numeroConfig_(mapa.FLETE_PROVINCIA, d.fleteProvincia),
          tipoCambioPublicidad: numeroConfig_(mapa.TIPO_CAMBIO_PUBLICIDAD, d.tipoCambioPublicidad),
          producto: String(mapa.PRODUCTO || d.producto).trim() || d.producto,
          um: String(mapa.UM || d.um).trim().toUpperCase() || d.um,
          colorMorado: colorSeguro_(mapa.COLOR_MORADO, d.colorMorado),
          colorAmarillo: colorSeguro_(mapa.COLOR_AMARILLO, d.colorAmarillo),
          colorRojo: colorSeguro_(mapa.COLOR_ROJO, d.colorRojo),
          colorAzul: colorSeguro_(mapa.COLOR_AZUL, d.colorAzul),
          colorVerde: colorSeguro_(mapa.COLOR_VERDE, d.colorVerde)
        };
      }
    }
  } catch (e) {
    console.log('No se pudo leer CONFIGURACION; se usara compatibilidad AF:AG. ' + e);
  }

  // Compatibilidad original V3.6: panel AF:AG.
  try {
    const valores = hoja.getRange('AG2:AG17').getValues().flat();
    return {
      precio1: numeroConfig_(valores[0], d.precio1),
      precio2: numeroConfig_(valores[1], d.precio2),
      precio3: numeroConfig_(valores[2], d.precio3),
      precioExtra: numeroConfig_(valores[3], d.precioExtra),
      costoUnitario: numeroConfig_(valores[4], d.costoUnitario),
      fleteLima: numeroConfig_(valores[5], d.fleteLima),
      fleteProvincia: numeroConfig_(valores[6], d.fleteProvincia),
      tipoCambioPublicidad: d.tipoCambioPublicidad,
      producto: String(valores[7] || d.producto).trim() || d.producto,
      um: String(valores[8] || d.um).trim().toUpperCase() || d.um,
      colorMorado: colorSeguro_(valores[11], d.colorMorado),
      colorAmarillo: colorSeguro_(valores[12], d.colorAmarillo),
      colorRojo: colorSeguro_(valores[13], d.colorRojo),
      colorAzul: colorSeguro_(valores[14], d.colorAzul),
      colorVerde: colorSeguro_(valores[15], d.colorVerde)
    };
  } catch (e) {
    return Object.assign({}, d);
  }
}

function aplicarValidacionesBaseGestion_(hoja, filaInicio, cantidadFilas) {
  if (cantidadFilas <= 0) return;

  const cantidad = SpreadsheetApp.newDataValidation()
    .requireNumberGreaterThanOrEqualTo(0)
    .setAllowInvalid(false)
    .setHelpText('Ingresa una cantidad igual o mayor que cero.')
    .build();

  const zona = SpreadsheetApp.newDataValidation()
    .requireValueInList([SC_CONFIG.ZONA_LIMA, SC_CONFIG.ZONA_PROVINCIA], true)
    .setAllowInvalid(false)
    .setHelpText('Selecciona LIMA o PROVINCIA.')
    .build();

  const modo = SpreadsheetApp.newDataValidation()
    .requireValueInList(['AUTO', 'MANUAL'], true)
    .setAllowInvalid(false)
    .build();

  hoja.getRange(filaInicio, SC_COL.CANT_REAL + 1, cantidadFilas, 1)
    .setDataValidation(cantidad);
  hoja.getRange(filaInicio, SC_COL.ZONA + 1, cantidadFilas, 1)
    .setDataValidation(zona);
  hoja.getRange(filaInicio, SC_COL.MODO_ZONA + 1, cantidadFilas, 1)
    .setDataValidation(modo);

  // CLAVE SHALOM no usa formula de validacion personalizada.
  // Ese tipo de regla depende de la configuracion regional de Google Sheets y
  // producia el error "el argumento de la regla no es valido".
  // La regla se controla de forma segura en onEdit y en recalcularFilaGestion_.
  hoja.getRange(filaInicio, SC_COL.CLAVE_SHALOM + 1, cantidadFilas, 1)
    .clearDataValidations()
    .setNumberFormat('@');
}

function aplicarValidacionesEstadoDatos_(hoja, filaInicio, datos) {
  if (!datos || !datos.length) return;

  const validaciones = datos.map(function(fila) {
    if (!normalizarPedido_(fila[SC_COL.PEDIDO])) return [null];

    const lista = normalizarZona_(fila[SC_COL.ZONA]) === SC_CONFIG.ZONA_LIMA
      ? SC_CONFIG.ESTADOS_LIMA
      : SC_CONFIG.ESTADOS_PROVINCIA;

    return [SpreadsheetApp.newDataValidation()
      .requireValueInList(lista, true)
      .setAllowInvalid(false)
      .setHelpText('Selecciona el estado del pedido.')
      .build()];
  });

  hoja.getRange(filaInicio, SC_COL.ESTADO + 1, datos.length, 1)
    .setDataValidations(validaciones);
}

function aplicarValidacionEstadoFila_(hoja, fila, zona) {
  const lista = normalizarZona_(zona) === SC_CONFIG.ZONA_LIMA
    ? SC_CONFIG.ESTADOS_LIMA
    : SC_CONFIG.ESTADOS_PROVINCIA;

  hoja.getRange(fila, SC_COL.ESTADO + 1).setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInList(lista, true)
      .setAllowInvalid(false)
      .setHelpText('Selecciona el estado del pedido.')
      .build()
  );
}

function repararSelectoresEstado() {
  const libro = obtenerLibro_();
  const hoja = libro.getSheetByName(SC_CONFIG.HOJA_GESTION);
  if (!hoja) throw new Error('No existe GESTION PEDIDOS.');

  const lectura = leerGestion_(hoja);
  if (lectura.filas.length) {
    aplicarValidacionesEstadoDatos_(
      hoja,
      2,
      lectura.filas.map(function(registro) { return registro.datos; })
    );
  }

  libro.toast(
    'Selectores de estado reparados en la columna ESTADO.',
    'STRAWBERRY CONTROL',
    5
  );
}

function prepararColoresPorEstado_(hoja, configuracion) {
  const ultimaFilaColor = Math.max(
    SC_CONFIG.FILAS_PREPARADAS + 1,
    hoja.getLastRow() + SC_CONFIG.FILAS_BUFFER
  );
  const rango = hoja.getRange('A2:Z' + ultimaFilaColor);

  const reglas = [
    reglaColorEstado_(rango, '=$X2="En espera"', configuracion.colorAmarillo, '#111827'),
    reglaColorEstado_(rango, '=$X2="Volver a llamar"', configuracion.colorMorado, '#FFFFFF'),
    reglaColorEstado_(rango, '=$X2="Repetido"', '#000000', '#FFFFFF'),
    reglaColorEstado_(rango, '=$X2="Cancelado"', configuracion.colorRojo, '#FFFFFF'),
    reglaColorEstado_(rango, '=$X2="Programado"', configuracion.colorAzul, '#FFFFFF'),
    reglaColorEstado_(rango, '=$X2="Enviado"', configuracion.colorAzul, '#FFFFFF'),
    reglaColorEstado_(rango, '=$X2="Entregado"', configuracion.colorVerde, '#111827')
  ];

  hoja.setConditionalFormatRules(reglas);
}

function reglaColorEstado_(rango, formula, fondo, texto) {
  return SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied(formula)
    .setBackground(fondo)
    .setFontColor(texto)
    .setRanges([rango])
    .build();
}

/** Configura la hoja manual de gastos. */
function prepararGastos_(hoja) {
  asegurarTamanoHoja_(hoja, SC_CONFIG.FILAS_GASTOS_PREPARADAS + 1, 6);

  hoja.getRange('A1:F1')
    .setValues([[
      'FECHA',
      'FB DÓLARES',
      'FB SOLES',
      'TIKTOK SOLES',
      'TOTAL SOLES',
      'OBSERVACIÓN'
    ]])
    .setBackground('#F4B183')
    .setFontColor('#111827')
    .setFontWeight('bold')
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');

  hoja.setFrozenRows(1);
  hoja.setRowHeight(1, 34);
  hoja.setColumnWidth(1, 100);
  hoja.setColumnWidths(2, 2, 105);
  hoja.setColumnWidth(4, 120);
  hoja.setColumnWidth(5, 110);
  hoja.setColumnWidth(6, 260);

  const filas = SC_CONFIG.FILAS_GASTOS_PREPARADAS;
  hoja.getRange(2, 1, filas, 6)
    .setFontFamily('Arial')
    .setFontSize(10)
    .setVerticalAlignment('middle');
  hoja.getRange(2, 1, filas, 1)
    .setNumberFormat('dd/mm/yyyy')
    .setFontColor('#0B57D0');
  hoja.getRange(2, 2, filas, 1)
    .setNumberFormat('"$" #,##0.00')
    .setFontColor('#0B57D0');
  hoja.getRange(2, 3, filas, 3)
    .setNumberFormat('"S/" #,##0.00');
  hoja.getRange(2, 3, filas, 2).setFontColor('#0B57D0');
  hoja.getRange(2, 5, filas, 1).setFontWeight('bold').setFontColor('#111827');
  hoja.getRange(2, 6, filas, 1).setWrap(true).setFontColor('#0B57D0');

  const fecha = SpreadsheetApp.newDataValidation()
    .requireDate()
    .setAllowInvalid(false)
    .setHelpText('Selecciona la fecha del gasto.')
    .build();
  const numero = SpreadsheetApp.newDataValidation()
    .requireNumberGreaterThanOrEqualTo(0)
    .setAllowInvalid(false)
    .build();

  hoja.getRange(2, 1, filas, 1).setDataValidation(fecha);
  hoja.getRange(2, 2, filas, 3).setDataValidation(numero);
  hoja.getRange('A1:F200').setBorder(
    true, true, true, true, true, true,
    '#D1D5DB', SpreadsheetApp.BorderStyle.SOLID
  );

  hoja.setTabColor('#F4B183');
  recalcularTotalesGastosCore_(hoja);
}

/**
 * Calcula TOTAL SOLES como valor, no como formula.
 * TOTAL SOLES = FB SOLES (C) + TIKTOK SOLES (D).
 * FB DOLARES (B) es informativo y no se suma nuevamente.
 *
 * Se usan valores para evitar errores por configuracion regional, separadores
 * de formulas o referencias R1C1/A1.
 */
function obtenerTipoCambioPublicidadV472_() {
  try {
    const gestion = obtenerLibro_().getSheetByName(SC_CONFIG.HOJA_GESTION);
    if (gestion) {
      const cfg = leerConfiguracion_(gestion);
      const tc = Math.max(0.01, numeroSeguro_(cfg.tipoCambioPublicidad));
      if (tc > 0) return tc;
    }
  } catch (e) {
    console.error(e);
  }
  return Math.max(0.01, numeroSeguro_(SC_CONFIG.DEFAULTS.tipoCambioPublicidad) || 3.5);
}

/**
 * V4.7.2 - Logica original de publicidad restaurada.
 * B = FB DOLARES (manual)
 * C = FB SOLES = B * tipo de cambio (automatico)
 * D = TIKTOK SOLES (manual)
 * E = TOTAL SOLES = C + D (automatico)
 */
function actualizarGastosPublicidadFilasV472_(hoja, filaInicial, cantidadFilas) {
  const inicio = Math.max(2, Math.floor(numeroSeguro_(filaInicial)) || 2);
  const maxDisponibles = Math.max(0, hoja.getMaxRows() - inicio + 1);
  const cantidad = Math.min(maxDisponibles, Math.max(0, Math.floor(numeroSeguro_(cantidadFilas))));
  if (cantidad <= 0) return;

  const tc = obtenerTipoCambioPublicidadV472_();
  const valores = hoja.getRange(inicio, 2, cantidad, 3).getValues(); // B:D
  const fbSoles = [];
  const totales = [];

  valores.forEach(function(fila) {
    const usdVacio = estaVacio_(fila[0]);
    const tiktokVacio = estaVacio_(fila[2]);
    if (usdVacio && tiktokVacio) {
      fbSoles.push(['']);
      totales.push(['']);
      return;
    }
    const usd = Math.max(0, numeroSeguro_(fila[0]));
    const tt = Math.max(0, numeroSeguro_(fila[2]));
    const fb = Math.round((usd * tc) * 100) / 100;
    const total = Math.round((fb + tt) * 100) / 100;
    fbSoles.push([fb]);
    totales.push([total]);
  });

  hoja.getRange(inicio, 3, cantidad, 1)
    .setValues(fbSoles)
    .setNumberFormat('"S/" #,##0.00')
    .setBackground('#FFF7ED');
  hoja.getRange(inicio, 5, cantidad, 1)
    .setValues(totales)
    .setNumberFormat('"S/" #,##0.00')
    .setFontWeight('bold')
    .setFontColor('#111827');
}

// Alias para compatibilidad con versiones anteriores.
function actualizarTotalesGastosFilas_(hoja, filaInicial, cantidadFilas) {
  actualizarGastosPublicidadFilasV472_(hoja, filaInicial, cantidadFilas);
}
function instalarFormulasTotalesGastos_(hoja, filaInicial, cantidadFilas) {
  actualizarGastosPublicidadFilasV472_(hoja, filaInicial, cantidadFilas);
}
function recalcularTotalesGastosCore_(hoja) {
  const ultima = Math.max(2, ultimaFilaConDatosEnColumnas_(hoja, 1, 6));
  actualizarGastosPublicidadFilasV472_(hoja, 2, Math.max(1, ultima - 1));
}
function recalcularGastosPublicidadV472_(libroOpcional) {
  const libro = libroOpcional || obtenerLibro_();
  const hoja = libro.getSheetByName(SC_CONFIG.HOJA_GASTOS);
  if (!hoja) return 0;
  const ultima = ultimaFilaConDatosEnColumnas_(hoja, 1, 6);
  if (ultima < 2) return 0;
  actualizarGastosPublicidadFilasV472_(hoja, 2, ultima - 1);
  return ultima - 1;
}

/** Repara solamente la suma automatica de GASTOS PUBLICIDAD. */
function repararSumaGastosV35() {
  const libro = obtenerLibro_();
  let hoja = libro.getSheetByName(SC_CONFIG.HOJA_GASTOS);
  if (!hoja) hoja = libro.insertSheet(SC_CONFIG.HOJA_GASTOS);

  prepararGastos_(hoja);
  actualizarTotalesGastosFilas_(
    hoja,
    2,
    Math.min(SC_CONFIG.FILAS_GASTOS_PREPARADAS, hoja.getMaxRows() - 1)
  );

  try {
    actualizarResumenVentasCore_(libro);
  } catch (error) {
    console.error(error);
  }

  libro.setActiveSheet(hoja);
  libro.toast(
    'TOTAL SOLES corregido: FB SOLES + TIKTOK SOLES, sin formulas ni errores regionales.',
    'STRAWBERRY CONTROL V3.6',
    8
  );
}

// Alias para quienes ya tenian seleccionada la funcion anterior.
function repararSumaGastosV34() {
  repararSumaGastosV35();
}

/** Repara solo Gastos y Resumen, sin modificar Hoja 1 ni los pedidos. */
function repararHojasGastosYResumen() {
  const bloqueo = LockService.getDocumentLock();
  if (!bloqueo.tryLock(30000)) return;

  try {
    const libro = obtenerLibro_();
    let gastos = libro.getSheetByName(SC_CONFIG.HOJA_GASTOS);
    if (!gastos) gastos = libro.insertSheet(SC_CONFIG.HOJA_GASTOS);
    prepararGastos_(gastos);
    SpreadsheetApp.flush();

    let resumen = libro.getSheetByName(SC_CONFIG.HOJA_RESUMEN);
    if (!resumen) resumen = libro.insertSheet(SC_CONFIG.HOJA_RESUMEN);
    prepararResumen_(resumen);
    SpreadsheetApp.flush();

    actualizarResumenVentasCore_(libro);
    libro.setActiveSheet(gastos);
    libro.toast(
      'GASTOS PUBLICIDAD y RESUMEN DE VENTAS fueron creadas o reparadas.',
      'STRAWBERRY CONTROL',
      7
    );
  } finally {
    bloqueo.releaseLock();
  }
}

/** Configura el panel de metricas. */
function prepararResumen_(hoja) {
  asegurarTamanoHoja_(hoja, 35, 8);

  const periodoPrevio = String(hoja.getRange(SC_RESUMEN.PERIODO).getValue() || '').trim();
  const desdePrevio = aFecha_(hoja.getRange(SC_RESUMEN.DESDE).getValue());
  const hastaPrevio = aFecha_(hoja.getRange(SC_RESUMEN.HASTA).getValue());
  const plataformaPrevia = normalizarFiltroPlataforma_(
    hoja.getRange(SC_RESUMEN.PLATAFORMA).getValue()
  );

  hoja.getRange('A1:H30').breakApart().clearFormat().clearContent();

  hoja.getRange('A1:H1').merge()
    .setValue('RESUMEN DE VENTAS - STRAWBERRY SKIN CREAM')
    .setBackground('#16324F')
    .setFontColor('#FFFFFF')
    .setFontWeight('bold')
    .setFontSize(14)
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');

  hoja.getRange('A3').setValue('PERIODO').setFontWeight('bold');
  hoja.getRange('D3').setValue('DESDE').setFontWeight('bold');
  hoja.getRange('G3').setValue('HASTA').setFontWeight('bold');
  hoja.getRange('A4').setValue('PLATAFORMA').setFontWeight('bold');

  const hoy = inicioDia_(new Date());
  const periodo = periodoPrevio || 'MES ACTUAL';
  const desde = desdePrevio || new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const hasta = hastaPrevio || hoy;
  const plataforma = plataformaPrevia || 'TODAS';

  hoja.getRange(SC_RESUMEN.PERIODO).setValue(periodo).setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInList([
        'HOY',
        'SEMANA ACTUAL',
        'QUINCENA ACTUAL',
        'MES ACTUAL',
        'PERSONALIZADO'
      ], true)
      .setAllowInvalid(false)
      .build()
  );
  hoja.getRange(SC_RESUMEN.DESDE).setValue(desde).setNumberFormat('dd/mm/yyyy');
  hoja.getRange(SC_RESUMEN.HASTA).setValue(hasta).setNumberFormat('dd/mm/yyyy');
  hoja.getRange(SC_RESUMEN.PLATAFORMA).setValue(plataforma).setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInList(['TODAS', 'FACEBOOK', 'TIK TOK'], true)
      .setAllowInvalid(false)
      .setHelpText('Selecciona TODAS, FACEBOOK o TIK TOK.')
      .build()
  );
  hoja.getRange('A3:H3').setBackground('#FFF7ED');
  hoja.getRange('A4:B4').setBackground('#E0F2FE');

  prepararBloqueResumen_(hoja, 5, 'INFORMACIÓN REAL');
  prepararBloqueResumen_(hoja, 16, 'PROYECCIÓN');

  hoja.getRange('D5:H13').merge()
    .setValue(
      'INFORMACIÓN REAL\n\n' +
      '• Unidades: ENTREGADO + ENVIADO.\n' +
      '• Ingresos: ENTREGADO suma el monto completo; ENVIADO suma solo el adelanto.\n' +
      '• Plataforma: TODAS, FACEBOOK o TIK TOK.\n' +
      '• Publicidad: TODAS usa TOTAL SOLES; FACEBOOK usa FB SOLES; TIK TOK usa TIKTOK SOLES.\n' +
      '• Costo de producción: unidades × costo unitario.\n' +
      '• Fletes: pedidos ENTREGADOS + ENVIADOS.'
    )
    .setWrap(true)
    .setVerticalAlignment('top')
    .setBackground('#F8FAFC');

  hoja.getRange('D16:H24').merge()
    .setValue(
      'PROYECCIÓN\n\n' +
      '• Unidades e ingresos: ENTREGADO + PROGRAMADO + ENVIADO, usando el monto completo.\n' +
      '• Plataforma: aplica el mismo filtro TODAS / FACEBOOK / TIK TOK.\n' +
      '• Courier: ENTREGADO + PROGRAMADO + ENVIADO.\n' +
      '• Shalom: ENTREGADO + ENVIADO.\n' +
      '• Publicidad: se descuenta únicamente la publicidad de la plataforma seleccionada.'
    )
    .setWrap(true)
    .setVerticalAlignment('top')
    .setBackground('#F8FAFC');

  hoja.setColumnWidth(1, 210);
  hoja.setColumnWidth(2, 140);
  hoja.setColumnWidth(3, 30);
  hoja.setColumnWidths(4, 2, 120);
  hoja.setColumnWidth(6, 30);
  hoja.setColumnWidths(7, 2, 120);
  hoja.setFrozenRows(4);
  hoja.setTabColor('#A9D18E');
}

function prepararBloqueResumen_(hoja, filaTitulo, titulo) {
  hoja.getRange(filaTitulo, 1, 1, 2).merge()
    .setValue(titulo)
    .setBackground('#A9D18E')
    .setFontWeight('bold')
    .setHorizontalAlignment('center');

  const etiquetas = [
    ['FECHA / RANGO'],
    ['UNIDADES VENDIDAS'],
    ['INGRESOS'],
    ['PUBLICIDAD (SOLES)'],
    ['COSTO PRODUCCIÓN'],
    ['FLETES COURIER'],
    ['FLETES SHALOM'],
    ['GANANCIA/PÉRDIDA']
  ];

  hoja.getRange(filaTitulo + 1, 1, etiquetas.length, 1).setValues(etiquetas);
  hoja.getRange(filaTitulo + 1, 1, etiquetas.length, 2).setBorder(
    true, true, true, true, true, true,
    '#CBD5E1', SpreadsheetApp.BorderStyle.SOLID
  );
  hoja.getRange(filaTitulo + 1, 2).setNumberFormat('@');
  hoja.getRange(filaTitulo + 2, 2).setNumberFormat('0');
  hoja.getRange(filaTitulo + 3, 2, 6, 1).setNumberFormat('"S/" #,##0.00');
  hoja.getRange(filaTitulo + 8, 1, 1, 2)
    .setBackground('#A9D18E')
    .setFontWeight('bold');
}

function aplicarPeriodoRapido_(hoja, periodo) {
  const hoy = inicioDia_(new Date());
  const normalizado = normalizarTexto_(periodo);
  let desde;
  let hasta;

  if (normalizado === 'hoy') {
    desde = hoy;
    hasta = hoy;
  } else if (normalizado === 'semana actual') {
    const dia = hoy.getDay();
    const diferenciaLunes = dia === 0 ? -6 : 1 - dia;
    desde = new Date(hoy);
    desde.setDate(hoy.getDate() + diferenciaLunes);
    hasta = new Date(desde);
    hasta.setDate(desde.getDate() + 6);
  } else if (normalizado === 'quincena actual') {
    if (hoy.getDate() <= 15) {
      desde = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      hasta = new Date(hoy.getFullYear(), hoy.getMonth(), 15);
    } else {
      desde = new Date(hoy.getFullYear(), hoy.getMonth(), 16);
      hasta = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
    }
  } else if (normalizado === 'mes actual') {
    desde = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    hasta = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
  } else {
    return;
  }

  hoja.getRange(SC_RESUMEN.DESDE).setValue(desde).setNumberFormat('dd/mm/yyyy');
  hoja.getRange(SC_RESUMEN.HASTA).setValue(hasta).setNumberFormat('dd/mm/yyyy');
}

function actualizarResumenVentas() {
  if (sistemaEnMantenimiento_()) return;
  const bloqueo = LockService.getDocumentLock();
  if (!bloqueo.tryLock(30000)) return;

  try {
    actualizarResumenVentasCore_(obtenerLibro_());
  } finally {
    bloqueo.releaseLock();
  }
}

/** Calcula ambos bloques por FECHA DE PEDIDO, plataforma y fecha de gasto. */
function actualizarResumenVentasCore_(libro) {
  const gestion = libro.getSheetByName(SC_CONFIG.HOJA_GESTION);
  const gastos = libro.getSheetByName(SC_CONFIG.HOJA_GASTOS);
  const resumen = libro.getSheetByName(SC_CONFIG.HOJA_RESUMEN);
  if (!gestion || !gastos || !resumen) return;

  const configuracion = leerConfiguracion_(gestion);
  let desde = aFecha_(resumen.getRange(SC_RESUMEN.DESDE).getValue());
  let hasta = aFecha_(resumen.getRange(SC_RESUMEN.HASTA).getValue());
  const plataformaFiltro = normalizarFiltroPlataforma_(
    resumen.getRange(SC_RESUMEN.PLATAFORMA).getValue()
  );
  resumen.getRange(SC_RESUMEN.PLATAFORMA).setValue(plataformaFiltro);

  if (!desde || !hasta) {
    const hoy = inicioDia_(new Date());
    desde = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    hasta = hoy;
  }

  desde = inicioDia_(desde);
  hasta = finDia_(hasta);

  if (desde.getTime() > hasta.getTime()) {
    const anteriorDesde = desde;
    desde = inicioDia_(hasta);
    hasta = finDia_(anteriorDesde);
    resumen.getRange(SC_RESUMEN.DESDE).setValue(desde);
    resumen.getRange(SC_RESUMEN.HASTA).setValue(hasta);
  }

  const pedidosPeriodo = leerGestion_(gestion).filas
    .map(function(registro) { return registro.datos; })
    .filter(function(fila) {
      const fecha = aFecha_(fila[SC_COL.FECHA]);
      const plataformaPedido = detectarPlataforma_(fila[SC_COL.PLATAFORMA]);
      const coincidePlataforma = plataformaFiltro === 'TODAS' ||
        plataformaPedido === plataformaFiltro;

      return fecha &&
        fecha.getTime() >= desde.getTime() &&
        fecha.getTime() <= hasta.getTime() &&
        coincidePlataforma;
    });

  let publicidad = 0;
  const ultimaGasto = ultimaFilaConDatosEnColumnas_(gastos, 1, 5);
  if (ultimaGasto >= 2) {
    const filasGastos = gastos.getRange(2, 1, ultimaGasto - 1, 5).getValues();
    filasGastos.forEach(function(fila) {
      const fecha = aFecha_(fila[0]);
      if (fecha &&
          fecha.getTime() >= desde.getTime() &&
          fecha.getTime() <= hasta.getTime()) {
        if (plataformaFiltro === 'FACEBOOK') {
          publicidad += Math.max(0, numeroSeguro_(fila[2])); // C: FB SOLES
        } else if (plataformaFiltro === 'TIK TOK') {
          publicidad += Math.max(0, numeroSeguro_(fila[3])); // D: TIKTOK SOLES
        } else {
          publicidad += Math.max(0, numeroSeguro_(fila[4])); // E: TOTAL SOLES
        }
      }
    });
  }

  const metricas = calcularMetricasResumen_(
    pedidosPeriodo,
    publicidad,
    configuracion.costoUnitario
  );
  const textoPeriodo = construirTextoPeriodo_(desde, hasta);

  resumen.getRange(SC_RESUMEN.REAL_FECHA).setValue(textoPeriodo);
  resumen.getRange(SC_RESUMEN.PROY_FECHA).setValue(textoPeriodo);
  escribirMetricas_(resumen, 7, metricas.real);
  escribirMetricas_(resumen, 18, metricas.proyeccion);
  colorearGanancia_(resumen.getRange('B13'), metricas.real.ganancia);
  colorearGanancia_(resumen.getRange('B24'), metricas.proyeccion.ganancia);

  resumen.getRange('A27').setValue('ÚLTIMA ACTUALIZACIÓN').setFontWeight('bold');
  resumen.getRange(SC_RESUMEN.ACTUALIZADO)
    .setValue(new Date())
    .setNumberFormat('dd/mm/yyyy HH:mm:ss');
}

/** Funcion pura para facilitar verificacion de la logica de negocio. */
function calcularMetricasResumen_(filas, publicidad, costoUnitario) {
  const real = crearAcumulador_();
  const proyeccion = crearAcumulador_();

  filas.forEach(function(fila) {
    const estado = normalizarTexto_(fila[SC_COL.ESTADO]);
    const unidades = Math.max(0, numeroSeguro_(fila[SC_COL.CANT_REAL]));
    const monto = Math.max(0, numeroSeguro_(fila[SC_COL.MONTO]));
    const courier = Math.max(0, numeroSeguro_(fila[SC_COL.FLETE_COURIER]));
    const shalom = Math.max(0, numeroSeguro_(fila[SC_COL.FLETE_SHALOM]));
    const adelanto = Math.max(0, numeroSeguro_(fila[SC_COL.ADELANTO]));

    // REAL: ENTREGADO + ENVIADO.
    if (estado === 'entregado' || estado === 'enviado') {
      real.unidades += unidades;
      real.ingresos += estado === 'entregado' ? monto : adelanto;
      real.fleteCourier += courier;
      real.fleteShalom += shalom;
    }

    // PROYECCION: ENTREGADO + PROGRAMADO + ENVIADO.
    if (estado === 'entregado' || estado === 'programado' || estado === 'enviado' || estado === 'confirmado' || estado === 'esperando adelanto') {
      proyeccion.unidades += unidades;
      proyeccion.ingresos += monto;
      proyeccion.fleteCourier += courier;
    }

    // SHALOM proyectado: ENTREGADO + ENVIADO.
    if (estado === 'entregado' || estado === 'enviado') {
      proyeccion.fleteShalom += shalom;
    }
  });

  real.publicidad = Math.max(0, numeroSeguro_(publicidad));
  real.costoProduccion = real.unidades * Math.max(0, numeroSeguro_(costoUnitario));
  real.ganancia = real.ingresos - real.publicidad - real.costoProduccion -
    real.fleteCourier - real.fleteShalom;

  proyeccion.publicidad = Math.max(0, numeroSeguro_(publicidad));
  proyeccion.costoProduccion =
    proyeccion.unidades * Math.max(0, numeroSeguro_(costoUnitario));
  proyeccion.ganancia = proyeccion.ingresos - proyeccion.publicidad -
    proyeccion.costoProduccion - proyeccion.fleteCourier - proyeccion.fleteShalom;

  return { real: real, proyeccion: proyeccion };
}

function crearAcumulador_() {
  return {
    unidades: 0,
    ingresos: 0,
    publicidad: 0,
    costoProduccion: 0,
    fleteCourier: 0,
    fleteShalom: 0,
    ganancia: 0
  };
}

function escribirMetricas_(hoja, filaInicio, datos) {
  hoja.getRange(filaInicio, 2, 7, 1).setValues([
    [datos.unidades],
    [datos.ingresos],
    [datos.publicidad],
    [datos.costoProduccion],
    [datos.fleteCourier],
    [datos.fleteShalom],
    [datos.ganancia]
  ]);
  hoja.getRange(filaInicio, 2).setNumberFormat('0');
  hoja.getRange(filaInicio + 1, 2, 6, 1).setNumberFormat('"S/" #,##0.00');
}

function colorearGanancia_(celda, valor) {
  if (numeroSeguro_(valor) >= 0) {
    celda.setBackground('#A9D18E').setFontColor('#111827');
  } else {
    celda.setBackground('#FA3E3E').setFontColor('#FFFFFF');
  }
  celda.setFontWeight('bold');
}


/**
 * Migra automaticamente la distribucion V3 a V3.2.
 * V3:  W Estado | X Motivo | Y Comentario | Z Telefono aux | AA Clave aux
 * V3.1 W Clave Shalom | X Estado | Y Motivo | Z Comentario | AA Telefono aux
 */
function migrarGestionV3A31SiCorresponde_(hoja) {
  const w1 = normalizarTexto_(hoja.getRange('W1').getValue());
  const x1 = normalizarTexto_(hoja.getRange('X1').getValue());
  const y1 = normalizarTexto_(hoja.getRange('Y1').getValue());
  const z1 = normalizarTexto_(hoja.getRange('Z1').getValue());
  const aa1 = normalizarTexto_(hoja.getRange('AA1').getValue());

  if (w1 === 'clave shalom' && x1 === 'estado') return;

  const esV3 =
    w1 === 'estado' &&
    x1 === 'motivo' &&
    y1 === 'comentario' &&
    z1.indexOf('telefono') >= 0 &&
    aa1.indexOf('clave') >= 0;

  if (!esV3) return;

  const ultimaFila = hoja.getLastRow();
  if (ultimaFila < 2) return;

  const antiguas = hoja.getRange(
    2,
    1,
    ultimaFila - 1,
    SC_CONFIG.COLUMNAS_GESTION
  ).getValues();

  const migradas = antiguas.map(function(vieja) {
    const nueva = new Array(SC_CONFIG.COLUMNAS_GESTION).fill('');

    for (let indice = 0; indice <= SC_COL.FECHA_ENVIO; indice++) {
      nueva[indice] = vieja[indice];
    }

    nueva[SC_COL.CLAVE_SHALOM] = vieja[26] || '';
    nueva[SC_COL.ESTADO] = vieja[22] || 'Por llamar';
    nueva[SC_COL.MOTIVO] = vieja[23] || 'NO APLICA';
    nueva[SC_COL.COMENTARIO] = vieja[24] || '';
    nueva[SC_COL.TELEFONO_AUX] = vieja[25] || '';

    return nueva;
  });

  hoja.getRange(2, 1, migradas.length, SC_CONFIG.COLUMNAS_GESTION)
    .clearDataValidations()
    .setValues(migradas);
}

/** Migra la estructura original anterior A:AD si todavia existe. */
function migrarGestionAntiguaSiCorresponde_(hoja) {
  const b1 = normalizarTexto_(hoja.getRange('B1').getValue());
  const c1 = normalizarTexto_(hoja.getRange('C1').getValue());

  const yaNueva = b1 === 'plataforma' && c1.indexOf('pedido') >= 0;
  if (yaNueva || (!b1 && !c1)) return;

  const esAnterior = b1.indexOf('pedido') >= 0 && c1.indexOf('nombre') >= 0;
  if (!esAnterior) {
    throw new Error(
      'La estructura de GESTION PEDIDOS no es reconocida. ' +
      'No se modifico para evitar perder datos.'
    );
  }

  const ultimaFila = ultimaFilaConPedidoAntiguo_(hoja);
  if (ultimaFila < 2) return;

  const antiguas = hoja.getRange(2, 1, ultimaFila - 1, 30).getValues();
  const config = SC_CONFIG.DEFAULTS;
  const migradas = [];

  antiguas.forEach(function(vieja) {
    const pedido = normalizarPedido_(vieja[1]);
    if (!pedido) return;

    const nueva = new Array(SC_CONFIG.COLUMNAS_GESTION).fill('');
    nueva[SC_COL.FECHA] = fechaParaHoja_(vieja[0]);
    nueva[SC_COL.PLATAFORMA] = detectarPlataforma_(vieja[12]);
    nueva[SC_COL.PEDIDO] = pedido;
    nueva[SC_COL.CLIENTE] = vieja[2] || '';
    nueva[SC_COL.DEPARTAMENTO] = vieja[4] || '';
    nueva[SC_COL.PROVINCIA] = vieja[5] || '';
    nueva[SC_COL.DISTRITO] = vieja[6] || '';
    nueva[SC_COL.DIRECCION] = vieja[7] || '';
    nueva[SC_COL.CANT_SHOPIFY] = Math.max(0, Math.floor(numeroSeguro_(vieja[8])));
    nueva[SC_COL.CANT_REAL] = nueva[SC_COL.CANT_SHOPIFY];
    nueva[SC_COL.PRODUCTO] = config.producto;
    nueva[SC_COL.UM] = config.um;
    nueva[SC_COL.ZONA] = normalizarZona_(vieja[10]);
    nueva[SC_COL.MODO_ZONA] = normalizarTexto_(vieja[11]) === 'manual'
      ? 'MANUAL'
      : 'AUTO';
    nueva[SC_COL.FLETE_SHALOM] = nueva[SC_COL.ZONA] === SC_CONFIG.ZONA_LIMA
      ? 'NO APLICA'
      : 0;
    nueva[SC_COL.ADELANTO] = nueva[SC_COL.ZONA] === SC_CONFIG.ZONA_LIMA
      ? 'NO APLICA'
      : Math.max(0, numeroSeguro_(vieja[15]));
    nueva[SC_COL.FECHA_ENTREGA] = nueva[SC_COL.ZONA] === SC_CONFIG.ZONA_LIMA
      ? (vieja[21] || '')
      : 'NO APLICA';
    nueva[SC_COL.FECHA_ENVIO] = nueva[SC_COL.ZONA] === SC_CONFIG.ZONA_LIMA
      ? 'NO APLICA'
      : (vieja[20] || '');
    nueva[SC_COL.ESTADO] = vieja[13] || 'Por llamar';
    nueva[SC_COL.MOTIVO] = 'NO APLICA';
    nueva[SC_COL.COMENTARIO] = vieja[26] || '';
    nueva[SC_COL.TELEFONO_AUX] = limpiarTelefono_(vieja[3]);
    nueva[SC_COL.CLAVE_SHALOM] = vieja[14] || '';

    migradas.push(recalcularFilaGestion_(nueva, config));
  });

  const rangoLimpiar = hoja.getRange(
    1,
    1,
    Math.max(ultimaFila, 2),
    Math.min(30, hoja.getMaxColumns())
  );
  rangoLimpiar.clearContent().clearDataValidations();

  if (migradas.length) {
    hoja.getRange(2, 1, migradas.length, SC_CONFIG.COLUMNAS_GESTION)
      .setValues(migradas);
  }
}

/** Respaldo ligero de valores; no copia miles de filas vacias ni formatos. */
function crearRespaldoLigeroSiHayDatos_(libro, hoja) {
  const ultimaFila = Math.max(1, hoja.getLastRow());
  const ultimaColumna = Math.min(
    SC_CONFIG.COLUMNAS_TOTALES,
    Math.max(1, hoja.getLastColumn())
  );
  const hayContenido = ultimaFila > 1 || String(hoja.getRange('A1').getValue() || '').trim();
  if (!hayContenido) return;

  const zona = Session.getScriptTimeZone() || 'America/Lima';
  const sello = Utilities.formatDate(new Date(), zona, 'yyyyMMdd_HHmmss');
  let nombre = 'RESPALDO_GESTION_' + sello;
  let contador = 1;
  while (libro.getSheetByName(nombre)) {
    nombre = 'RESPALDO_GESTION_' + sello + '_' + contador;
    contador++;
  }

  const respaldo = libro.insertSheet(nombre);
  asegurarTamanoHoja_(respaldo, ultimaFila, ultimaColumna);
  const valores = hoja.getRange(1, 1, ultimaFila, ultimaColumna).getValues();
  respaldo.getRange(1, 1, ultimaFila, ultimaColumna).setValues(valores);
  respaldo.hideSheet();
}

function leerOrigen_(hoja) {
  const ultimaFila = hoja.getLastRow();
  if (ultimaFila < 1) return [];

  return hoja.getRange(1, 1, ultimaFila, SC_CONFIG.COLUMNAS_ORIGEN)
    .getValues()
    .filter(function(fila) {
      return normalizarPedido_(fila[1]) !== '';
    });
}

function leerGestion_(hoja) {
  const ultimaFilaHoja = hoja.getLastRow();
  if (ultimaFilaHoja < 2) {
    return { filas: [], mapa: new Map(), ultimaFila: 1 };
  }

  const datos = hoja.getRange(
    2,
    1,
    ultimaFilaHoja - 1,
    SC_CONFIG.COLUMNAS_GESTION
  ).getValues();

  const filas = [];
  const mapa = new Map();
  let ultimaFila = 1;

  datos.forEach(function(fila, indice) {
    const pedido = normalizarPedido_(fila[SC_COL.PEDIDO]);
    if (!pedido) return;

    const filaReal = indice + 2;
    const registro = { fila: filaReal, datos: fila };
    filas.push(registro);
    if (!mapa.has(pedido)) mapa.set(pedido, registro);
    ultimaFila = filaReal;
  });

  return { filas: filas, mapa: mapa, ultimaFila: ultimaFila };
}

function ultimaFilaConPedidoAntiguo_(hoja) {
  const ultima = hoja.getLastRow();
  if (ultima < 2) return 1;

  const pedidos = hoja.getRange(2, 2, ultima - 1, 1).getDisplayValues();
  for (let i = pedidos.length - 1; i >= 0; i--) {
    if (String(pedidos[i][0] || '').trim()) return i + 2;
  }
  return 1;
}

function ultimaFilaConDatosEnColumnas_(hoja, columnaInicial, cantidadColumnas) {
  const ultima = hoja.getLastRow();
  if (ultima < 2) return 1;

  const datos = hoja.getRange(2, columnaInicial, ultima - 1, cantidadColumnas).getValues();
  for (let i = datos.length - 1; i >= 0; i--) {
    const tiene = datos[i].some(function(valor) { return !estaVacio_(valor); });
    if (tiene) return i + 2;
  }
  return 1;
}

/** Clasificacion visible solamente como LIMA o PROVINCIA. */
function clasificarZona_(departamento, provincia, distrito) {
  const dep = normalizarTexto_(departamento);
  const prov = normalizarTexto_(provincia);
  const dist = normalizarTexto_(distrito);

  const provinciasLimaRegion = [
    'barranca', 'cajatambo', 'canta', 'canete', 'huaral',
    'huarochiri', 'huaura', 'oyon', 'yauyos'
  ];
  if (provinciasLimaRegion.indexOf(prov) >= 0) {
    return SC_CONFIG.ZONA_PROVINCIA;
  }

  const distritosCallao = [
    'callao', 'bellavista', 'carmen de la legua reynoso',
    'la perla', 'la punta', 'mi peru', 'ventanilla'
  ];

  const distritosLima = [
    'ancon', 'ate', 'barranco', 'brena', 'carabayllo', 'chaclacayo',
    'chorrillos', 'cieneguilla', 'comas', 'el agustino', 'independencia',
    'jesus maria', 'la molina', 'la victoria', 'lima', 'cercado de lima',
    'lince', 'los olivos', 'lurigancho', 'lurigancho chosica', 'chosica',
    'lurin', 'magdalena del mar', 'miraflores', 'pachacamac', 'pucusana',
    'pueblo libre', 'puente piedra', 'punta hermosa', 'punta negra',
    'rimac', 'san bartolo', 'san borja', 'san isidro',
    'san juan de lurigancho', 'san juan de miraflores', 'san luis',
    'san martin de porres', 'san miguel', 'santa anita',
    'santa maria del mar', 'santa rosa', 'santiago de surco', 'surco',
    'surquillo', 'villa el salvador', 'villa maria del triunfo'
  ];

  if (
    dep.indexOf('callao') >= 0 ||
    prov.indexOf('callao') >= 0 ||
    distritosCallao.indexOf(prov) >= 0 ||
    distritosCallao.indexOf(dist) >= 0
  ) {
    return SC_CONFIG.ZONA_LIMA;
  }

  if (
    prov === 'lima' ||
    prov === 'provincia de lima' ||
    distritosLima.indexOf(prov) >= 0 ||
    distritosLima.indexOf(dist) >= 0
  ) {
    return SC_CONFIG.ZONA_LIMA;
  }

  if (dep.indexOf('lima') >= 0 && !prov) return SC_CONFIG.ZONA_LIMA;
  return SC_CONFIG.ZONA_PROVINCIA;
}

function adaptarEstadoAZona_(estado, zona) {
  const actual = normalizarTexto_(estado);
  const lista = normalizarZona_(zona) === SC_CONFIG.ZONA_LIMA
    ? SC_CONFIG.ESTADOS_LIMA
    : SC_CONFIG.ESTADOS_PROVINCIA;

  const encontrado = lista.find(function(opcion) {
    return normalizarTexto_(opcion) === actual;
  });

  if (encontrado) return encontrado;
  if (zona === SC_CONFIG.ZONA_LIMA && actual === 'enviado') return 'Programado';
  if (zona === SC_CONFIG.ZONA_PROVINCIA && actual === 'programado') return 'Enviado';
  return 'Por llamar';
}

/** Normaliza el nombre solo para detectar pedidos repetidos. */
function normalizarNombreRepetido_(valor) {
  return normalizarTexto_(valor)
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Acepta telefonos de al menos 7 digitos para evitar falsos repetidos por valores cortos. */
function normalizarTelefonoRepetido_(valor) {
  const telefono = limpiarTelefono_(valor);
  return telefono.length >= 7 ? telefono : '';
}

function crearIndiceIdentidades_(registros) {
  const indice = {
    nombres: new Map(),
    telefonos: new Map()
  };

  (registros || []).forEach(function(registro) {
    const fila = registro && registro.datos ? registro.datos : registro;
    if (!fila) return;

    registrarIdentidadPedido_(
      indice,
      normalizarPedido_(fila[SC_COL.PEDIDO]),
      normalizarNombreRepetido_(fila[SC_COL.CLIENTE]),
      normalizarTelefonoRepetido_(fila[SC_COL.TELEFONO_AUX])
    );
  });

  return indice;
}

function registrarIdentidadPedido_(indice, pedido, nombreClave, telefonoClave) {
  if (!pedido) return;

  registrarClavePedido_(indice.nombres, nombreClave, pedido);
  registrarClavePedido_(indice.telefonos, telefonoClave, pedido);
}

function registrarClavePedido_(mapa, clave, pedido) {
  if (!clave) return;
  if (!mapa.has(clave)) mapa.set(clave, new Set());
  mapa.get(clave).add(pedido);
}

function existeIdentidadEnOtroPedido_(indice, pedido, nombreClave, telefonoClave) {
  return existeClaveEnOtroPedido_(indice.nombres, nombreClave, pedido) ||
    existeClaveEnOtroPedido_(indice.telefonos, telefonoClave, pedido);
}

function existeClaveEnOtroPedido_(mapa, clave, pedido) {
  if (!clave || !mapa.has(clave)) return false;
  const pedidos = mapa.get(clave);
  let repetido = false;
  pedidos.forEach(function(otroPedido) {
    if (otroPedido !== pedido) repetido = true;
  });
  return repetido;
}

function normalizarFiltroPlataforma_(valor) {
  const texto = normalizarTexto_(valor);
  if (texto === 'facebook' || texto === 'fb') return 'FACEBOOK';
  if (
    texto === 'tik tok' ||
    texto === 'tiktok' ||
    texto === 'tt' ||
    texto === 'tk'
  ) {
    return 'TIK TOK';
  }
  return 'TODAS';
}

function detectarPlataforma_(valor) {
  const codigo = normalizarTexto_(valor);
  if (codigo.indexOf('fb') === 0 || codigo.indexOf('facebook') >= 0) {
    return 'FACEBOOK';
  }
  if (
    codigo.indexOf('tk') === 0 ||
    codigo.indexOf('tt') === 0 ||
    codigo.indexOf('tiktok') >= 0
  ) {
    return 'TIK TOK';
  }

  const original = String(valor || '').trim().toUpperCase();
  return original || 'SIN IDENTIFICAR';
}

function repararActivador() {
  repararActivadorCore_();
  obtenerLibro_().toast(
    'Activador reparado. La sincronizacion se ejecutara cada minuto.',
    'STRAWBERRY CONTROL',
    5
  );
}

function repararActivadorCore_() {
  eliminarActivadoresSincronizacion_();
  if (sistemaEnMantenimiento_()) return;

  ScriptApp.newTrigger('sincronizarPedidos')
    .timeBased()
    .everyMinutes(1)
    .create();
}

function obtenerLibro_() {
  const activo = SpreadsheetApp.getActiveSpreadsheet();
  if (activo) return activo;

  const id = PropertiesService.getScriptProperties()
    .getProperty('STRAWBERRY_SPREADSHEET_ID');
  if (!id) {
    throw new Error('Ejecuta instalarSistemaCompleto() una vez.');
  }
  return SpreadsheetApp.openById(id);
}

function asegurarTamanoHoja_(hoja, filas, columnas) {
  if (hoja.getMaxRows() < filas) {
    hoja.insertRowsAfter(hoja.getMaxRows(), filas - hoja.getMaxRows());
  }
  if (hoja.getMaxColumns() < columnas) {
    hoja.insertColumnsAfter(hoja.getMaxColumns(), columnas - hoja.getMaxColumns());
  }
}

function normalizarPedido_(valor) {
  return String(valor || '').trim();
}

function limpiarTelefono_(valor) {
  let telefono = String(valor || '').replace(/\D/g, '');
  if (telefono.indexOf('51') === 0 && telefono.length > 9) {
    telefono = telefono.substring(2);
  }
  return telefono;
}

function normalizarZona_(valor) {
  const texto = normalizarTexto_(valor);
  return (texto.indexOf('lima') >= 0 || texto.indexOf('callao') >= 0)
    ? SC_CONFIG.ZONA_LIMA
    : SC_CONFIG.ZONA_PROVINCIA;
}

function normalizarNoAplica_(valor) {
  const texto = normalizarTexto_(valor);
  return texto === 'no aplica' || texto === 'n a';
}

function numeroConfig_(valor, defecto) {
  if (estaVacio_(valor)) return defecto;
  const numero = numeroSeguro_(valor);
  return numero >= 0 ? numero : defecto;
}

function numeroSeguro_(valor) {
  if (typeof valor === 'number') {
    return Number.isFinite(valor) ? valor : 0;
  }

  let texto = String(valor || '').trim();
  if (!texto) return 0;

  texto = texto.replace(/[^0-9,.-]/g, '');
  const tieneComa = texto.indexOf(',') >= 0;
  const tienePunto = texto.indexOf('.') >= 0;

  if (tieneComa && tienePunto) {
    // 1.234,56 -> 1234.56; 1,234.56 -> 1234.56.
    if (texto.lastIndexOf(',') > texto.lastIndexOf('.')) {
      texto = texto.replace(/\./g, '').replace(',', '.');
    } else {
      texto = texto.replace(/,/g, '');
    }
  } else if (tieneComa) {
    texto = texto.replace(',', '.');
  }

  const numero = Number(texto);
  return Number.isFinite(numero) ? numero : 0;
}

function normalizarTexto_(valor) {
  return String(valor || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[()]/g, '')
    .replace(/[\/-]/g, ' ')
    .replace(/\s+/g, ' ');
}

function colorSeguro_(valor, defecto) {
  const texto = String(valor || '').trim().toUpperCase();
  return /^#[0-9A-F]{6}$/.test(texto) ? texto : defecto;
}

function estaVacio_(valor) {
  return valor === '' || valor === null || valor === undefined;
}

function fechaParaHoja_(valor) {
  const fecha = aFecha_(valor);
  return fecha || valor || '';
}

function aFecha_(valor) {
  if (!valor) return null;

  if (
    Object.prototype.toString.call(valor) === '[object Date]' &&
    !isNaN(valor.getTime())
  ) {
    return new Date(valor.getTime());
  }

  const texto = String(valor).trim();
  let coincidencia = texto.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (coincidencia) {
    return new Date(
      Number(coincidencia[1]),
      Number(coincidencia[2]) - 1,
      Number(coincidencia[3])
    );
  }

  coincidencia = texto.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/);
  if (coincidencia) {
    return new Date(
      Number(coincidencia[3]),
      Number(coincidencia[2]) - 1,
      Number(coincidencia[1])
    );
  }

  const fecha = new Date(texto);
  return isNaN(fecha.getTime()) ? null : fecha;
}

function fechaISO_(valor) {
  const fecha = aFecha_(valor);
  if (!fecha) return '';
  return Utilities.formatDate(
    fecha,
    Session.getScriptTimeZone() || 'America/Lima',
    'yyyy-MM-dd'
  );
}

function inicioDia_(fecha) {
  const copia = new Date(fecha.getTime());
  copia.setHours(0, 0, 0, 0);
  return copia;
}

function finDia_(fecha) {
  const copia = new Date(fecha.getTime());
  copia.setHours(23, 59, 59, 999);
  return copia;
}

function construirTextoPeriodo_(desde, hasta) {
  const zona = Session.getScriptTimeZone() || 'America/Lima';
  const a = Utilities.formatDate(desde, zona, 'dd/MM/yyyy');
  const b = Utilities.formatDate(hasta, zona, 'dd/MM/yyyy');
  return a === b ? a : a + ' al ' + b;
}



// =============================================================================
// V4.5 - BASE WEB AUXILIAR SEPARADA (NO MODIFICA GESTION PEDIDOS)
// =============================================================================

const SC_WEB45 = {
  PROP_AUX_ID: 'SC_V45_AUX_SPREADSHEET_ID',
  PROP_SOURCE_ID: 'STRAWBERRY_SPREADSHEET_ID',
  HOJA_USUARIOS: 'USUARIOS',
  HOJA_SESIONES: 'SESIONES',
  HOJA_LLAMADAS: 'HISTORIAL LLAMADAS',
  HOJA_AUDITORIA: 'AUDITORIA',
  HOJA_META: 'PEDIDOS META',
  HOJA_CONFIG_WEB: 'CONFIGURACION WEB'
};

/**
 * EJECUTAR UNA SOLA VEZ para habilitar la web.
 * Crea un SEGUNDO Google Sheet liviano para usuarios/sesiones/historial/metadatos.
 * NO agrega, elimina ni reordena columnas en GESTION PEDIDOS.
 */
function configurarBaseWebV45() {
  const props = PropertiesService.getScriptProperties();
  const source = SpreadsheetApp.getActiveSpreadsheet();
  if (!source) throw new Error('Este proyecto debe estar vinculado al archivo principal de Strawberry Control.');
  props.setProperty(SC_WEB45.PROP_SOURCE_ID, source.getId());

  let aux = null;
  const existente = props.getProperty(SC_WEB45.PROP_AUX_ID);
  if (existente) {
    try { aux = SpreadsheetApp.openById(existente); } catch (e) { aux = null; }
  }
  if (!aux) {
    aux = SpreadsheetApp.create('STRAWBERRY CONTROL - BASE WEB V4.5');
    props.setProperty(SC_WEB45.PROP_AUX_ID, aux.getId());
  }

  prepararBaseAuxV45_(aux);
  console.log('BASE WEB V4.5 LISTA');
  console.log('Archivo principal: ' + source.getId());
  console.log('Base auxiliar: ' + aux.getId());
  try {
    source.toast('Base web V4.5 lista. Ahora ejecuta crearOResetearAdministrador() desde API.gs.', 'STRAWBERRY CONTROL', 10);
  } catch (e) {}
  return aux.getId();
}

/**
 * Alternativa si prefieres crear manualmente un Google Sheet vacio.
 * Pega su ID cuando aparezca el cuadro y se usara como base auxiliar.
 */
function vincularBaseWebV45Manual() {
  const ui = SpreadsheetApp.getUi();
  const r = ui.prompt('Base web V4.5', 'Pega el ID del Google Sheet auxiliar vacio:', ui.ButtonSet.OK_CANCEL);
  if (r.getSelectedButton() !== ui.Button.OK) return;
  const id = String(r.getResponseText() || '').trim();
  if (!id) throw new Error('Debes indicar el ID del archivo auxiliar.');
  const aux = SpreadsheetApp.openById(id);
  const source = SpreadsheetApp.getActiveSpreadsheet();
  const props = PropertiesService.getScriptProperties();
  props.setProperty(SC_WEB45.PROP_SOURCE_ID, source.getId());
  props.setProperty(SC_WEB45.PROP_AUX_ID, aux.getId());
  prepararBaseAuxV45_(aux);
  source.toast('Base auxiliar vinculada correctamente.', 'STRAWBERRY CONTROL V4.5', 8);
}

function prepararBaseAuxV45_(aux) {
  const defs = [
    [SC_WEB45.HOJA_USUARIOS, ['ID','USUARIO','NOMBRE','ROL','PASSWORD_HASH','SALT','ACTIVO','CREADO_EN','ACTUALIZADO_EN','ULTIMO_LOGIN','OBSERVACION']],
    [SC_WEB45.HOJA_SESIONES, ['TOKEN_HASH','USUARIO_ID','USUARIO','ROL','CREADA_EN','EXPIRA_EN','ULTIMO_ACCESO','ACTIVA']],
    [SC_WEB45.HOJA_LLAMADAS, ['ID','FECHA/HORA','PEDIDO','TIPO','INTENTO NO RESPONDE','RESULTADO','ESTADO ANTES','ESTADO DESPUES','PROXIMA LLAMADA','USUARIO','NOMBRE USUARIO','COMENTARIO']],
    [SC_WEB45.HOJA_AUDITORIA, ['ID','FECHA/HORA','USUARIO','ROL','ACCION','PEDIDO','ENTIDAD','DETALLE','ORIGEN']],
    [SC_WEB45.HOJA_META, ['PEDIDO','DNI','INTENTOS NO RESPONDE','ULTIMA LLAMADA','PROXIMA LLAMADA','ATENDIENDO POR','ATENDIENDO DESDE','CONFIRMADO EN','ESPERANDO ADELANTO DESDE','CERRADO','ACTUALIZADO POR','ACTUALIZADO EN','REPETIDO AUTO']],
    [SC_WEB45.HOJA_CONFIG_WEB, ['CLAVE','VALOR','DESCRIPCION']]
  ];

  defs.forEach(function(d) {
    let sh = aux.getSheetByName(d[0]);
    if (!sh) sh = aux.insertSheet(d[0]);
    sh.getRange(1, 1, 1, d[1].length).setValues([d[1]]);
    sh.setFrozenRows(1);
  });

  const cfg = aux.getSheetByName(SC_WEB45.HOJA_CONFIG_WEB);
  const defaults = [
    ['MAX_INTENTOS_NO_RESPONDE', 5, 'Al quinto NO RESPONDE se cancela automaticamente'],
    ['DIAS_ESPERA_ADELANTO', 7, 'Dias maximos de espera de adelanto en Provincia'],
    ['MINUTOS_BLOQUEO_ATENCION', 20, 'Tiempo de bloqueo Atendiendo por'],
    ['HORAS_SESION', 12, 'Duracion de la sesion web'],
    ['MAX_TRABAJADORES', 10, 'Numero maximo de trabajadores activos'],
    ['VERSION_WEB', '4.5.0', 'Version de la capa web']
  ];
  const actuales = {};
  if (cfg.getLastRow() >= 2) {
    cfg.getRange(2,1,cfg.getLastRow()-1,2).getValues().forEach(function(f){ if(f[0]) actuales[String(f[0])] = f[1]; });
  }
  const filas = defaults.map(function(f){ return [f[0], actuales[f[0]] === undefined ? f[1] : actuales[f[0]], f[2]]; });
  if (cfg.getLastRow() > 1) cfg.getRange(2,1,cfg.getLastRow()-1,3).clearContent();
  cfg.getRange(2,1,filas.length,3).setValues(filas);

  // Borra la hoja vacia inicial si aun existe y no contiene datos.
  const h1 = aux.getSheetByName('Sheet1') || aux.getSheetByName('Hoja 1');
  if (h1 && h1.getLastRow() <= 1 && h1.getLastColumn() <= 1 && aux.getSheets().length > 1) {
    try { aux.deleteSheet(h1); } catch (e) {}
  }
}

function obtenerLibroAuxV45_() {
  const id = PropertiesService.getScriptProperties().getProperty(SC_WEB45.PROP_AUX_ID);
  if (!id) throw new Error('La base web V4.5 no esta configurada. Ejecuta configurarBaseWebV45().');
  return SpreadsheetApp.openById(id);
}

function obtenerHojaAuxV45_(nombre) {
  const aux = obtenerLibroAuxV45_();
  const sh = aux.getSheetByName(nombre);
  if (!sh) throw new Error('No existe la hoja auxiliar ' + nombre + '. Ejecuta configurarBaseWebV45().');
  return sh;
}

function leerConfigWebV45_() {
  const d = {maxIntentos:5,diasEsperaAdelanto:7,minutosBloqueo:20,horasSesion:12,maxTrabajadores:10};
  try {
    const sh = obtenerHojaAuxV45_(SC_WEB45.HOJA_CONFIG_WEB);
    if (sh.getLastRow() < 2) return d;
    const mapa = {};
    sh.getRange(2,1,sh.getLastRow()-1,2).getValues().forEach(function(f){ if(f[0]) mapa[String(f[0])] = f[1]; });
    return {
      maxIntentos: Math.max(1, Math.floor(numeroSeguro_(mapa.MAX_INTENTOS_NO_RESPONDE) || d.maxIntentos)),
      diasEsperaAdelanto: Math.max(1, Math.floor(numeroSeguro_(mapa.DIAS_ESPERA_ADELANTO) || d.diasEsperaAdelanto)),
      minutosBloqueo: Math.max(5, Math.floor(numeroSeguro_(mapa.MINUTOS_BLOQUEO_ATENCION) || d.minutosBloqueo)),
      horasSesion: Math.max(1, Math.floor(numeroSeguro_(mapa.HORAS_SESION) || d.horasSesion)),
      maxTrabajadores: Math.max(1, Math.floor(numeroSeguro_(mapa.MAX_TRABAJADORES) || d.maxTrabajadores))
    };
  } catch(e) { return d; }
}

function diagnosticoWebV45() {
  const props = PropertiesService.getScriptProperties();
  const sourceId = props.getProperty(SC_WEB45.PROP_SOURCE_ID) || '(sin registrar)';
  const auxId = props.getProperty(SC_WEB45.PROP_AUX_ID) || '(sin configurar)';
  console.log('VERSION=' + SC_CONFIG.VERSION);
  console.log('SOURCE=' + sourceId);
  console.log('AUX=' + auxId);
  if (auxId !== '(sin configurar)') {
    const aux = SpreadsheetApp.openById(auxId);
    console.log('AUX hojas=' + aux.getSheets().map(function(s){return s.getName();}).join(', '));
  }
  return {version:SC_CONFIG.VERSION, sourceId:sourceId, auxId:auxId};
}


// =============================================================================
// V4.7 - RESTAURACION DE LA LOGICA CENTRAL DEL NEGOCIO
// =============================================================================

/**
 * Ejecutar UNA SOLA VEZ despues de pegar Automatizacion_V47 y API_V47.
 * No reconstruye GESTION PEDIDOS ni toca Hoja 1.
 * 1) asegura CONFIGURACION comercial,
 * 2) vuelve visible TELÉFONO en AA,
 * 3) restaura el activador de sincronizacion cada minuto,
 * 4) sincroniza inmediatamente Hoja 1 -> GESTION PEDIDOS,
 * 5) recalcula montos, fletes, saldos y resumen.
 */
function actualizarNegocioV47() {
  const bloqueo = LockService.getDocumentLock();
  if (!bloqueo.tryLock(60000)) {
    throw new Error('Otra sincronizacion esta en proceso. Espera unos segundos y vuelve a intentar.');
  }
  try {
    const libro = SpreadsheetApp.getActiveSpreadsheet() || obtenerLibro_();
    if (!libro) throw new Error('No se pudo abrir el archivo principal.');
    const origen = libro.getSheetByName(SC_CONFIG.HOJA_ORIGEN);
    const gestion = libro.getSheetByName(SC_CONFIG.HOJA_GESTION);
    if (!origen) throw new Error('No existe "' + SC_CONFIG.HOJA_ORIGEN + '".');
    if (!gestion) throw new Error('No existe "' + SC_CONFIG.HOJA_GESTION + '".');

    PropertiesService.getScriptProperties().setProperty('STRAWBERRY_SPREADSHEET_ID', libro.getId());
    asegurarConfiguracionNegocioV47_(libro, gestion);
    repararCantidadesRealesInicialesV47_(gestion);

    // No se cambia A:AA; solo se deja visible el telefono operativo.
    gestion.getRange(1, SC_COL.TELEFONO_AUX + 1).setValue('TELÉFONO');
    try { gestion.showColumns(SC_COL.TELEFONO_AUX + 1, 1); } catch (e) {}
    gestion.setColumnWidth(SC_COL.TELEFONO_AUX + 1, 125);
    const filasTelefono = Math.max(1, Math.min(gestion.getMaxRows() - 1, Math.max(gestion.getLastRow() - 1, 1)));
    gestion.getRange(2, SC_COL.TELEFONO_AUX + 1, filasTelefono, 1).setNumberFormat('@');

    asegurarActivadorSincronizacionV47_();
    sincronizarPedidosCore_(libro);
    actualizarResumenVentasCore_(libro);
    SpreadsheetApp.flush();
    libro.toast('V4.7 lista: sincronizacion restaurada y configuracion comercial activa.', 'STRAWBERRY CONTROL', 8);
    console.log('V4.7 OK - Hoja 1 -> GESTION PEDIDOS sincronizada.');
  } finally {
    bloqueo.releaseLock();
  }
}

/**
 * Repara solo filas claramente heredadas de la version rota: cantidad Shopify > 0,
 * cantidad real = 0, monto = 0 y estado aun Por llamar/Repetido. No toca pedidos
 * cancelados, entregados, enviados, programados ni cantidades manuales validas.
 */
function repararCantidadesRealesInicialesV47_(gestion) {
  const lectura = leerGestion_(gestion);
  if (!lectura.filas.length) return 0;
  let cambios = 0;
  const cantidades = lectura.filas.map(function(registro) {
    const f = registro.datos;
    const shopify = Math.max(0, Math.floor(numeroSeguro_(f[SC_COL.CANT_SHOPIFY])));
    let real = Math.max(0, Math.floor(numeroSeguro_(f[SC_COL.CANT_REAL])));
    const monto = Math.max(0, numeroSeguro_(f[SC_COL.MONTO]));
    const estado = normalizarTexto_(f[SC_COL.ESTADO]);
    const reparable = shopify > 0 && real <= 0 && monto <= 0 && (estado === '' || estado === 'por llamar' || estado === 'repetido');
    if (reparable) { real = shopify; cambios++; }
    return [real];
  });
  if (cambios > 0) gestion.getRange(2, SC_COL.CANT_REAL + 1, cantidades.length, 1).setValues(cantidades);
  console.log('V4.7 cantidades reales reparadas=' + cambios);
  return cambios;
}

/** Crea/completa CONFIGURACION sin borrar valores existentes. */
function asegurarConfiguracionNegocioV47_(libro, gestion) {
  let hoja = libro.getSheetByName(SC_CONFIG.HOJA_CONFIG_NEGOCIO);
  if (!hoja) hoja = libro.insertSheet(SC_CONFIG.HOJA_CONFIG_NEGOCIO);

  if (hoja.getMaxColumns() < 3) hoja.insertColumnsAfter(hoja.getMaxColumns(), 3 - hoja.getMaxColumns());
  hoja.getRange('A1:C1').setValues([['CLAVE', 'VALOR', 'DESCRIPCION']]).setFontWeight('bold');

  const base = leerConfiguracionDesdePanelV47_(gestion);
  const existentes = {};
  if (hoja.getLastRow() >= 2) {
    hoja.getRange(2, 1, hoja.getLastRow() - 1, 2).getValues().forEach(function(f) {
      const k = String(f[0] || '').trim().toUpperCase();
      if (k) existentes[k] = f[1];
    });
  }

  // Algunas versiones intermedias dejaron CONFIGURACION con todos los importes en 0.
  // Si detectamos ese caso, recuperamos la logica original desde AF:AG y, si
  // tambien esta vacio, desde los defaults historicos del negocio.
  const clavesNumericas = ['PRECIO_1_UNIDAD','PRECIO_2_UNIDADES','PRECIO_3_UNIDADES','PRECIO_UNIDAD_EXTRA','COSTO_UNITARIO','FLETE_LIMA','FLETE_PROVINCIA'];
  const propsV47 = PropertiesService.getScriptProperties();
  const primeraReparacionV47 = propsV47.getProperty('SC_V47_CONFIG_REPARADA') !== '1';
  const d = SC_CONFIG.DEFAULTS;
  const baseSegura = {
    precio1: base.precio1 > 0 ? base.precio1 : d.precio1,
    precio2: base.precio2 > 0 ? base.precio2 : d.precio2,
    precio3: base.precio3 > 0 ? base.precio3 : d.precio3,
    precioExtra: base.precioExtra > 0 ? base.precioExtra : d.precioExtra,
    costoUnitario: base.costoUnitario > 0 ? base.costoUnitario : d.costoUnitario,
    fleteLima: base.fleteLima > 0 ? base.fleteLima : d.fleteLima,
    fleteProvincia: base.fleteProvincia > 0 ? base.fleteProvincia : d.fleteProvincia,
    tipoCambioPublicidad: (base.tipoCambioPublicidad || d.tipoCambioPublicidad) > 0 ? (base.tipoCambioPublicidad || d.tipoCambioPublicidad) : d.tipoCambioPublicidad
  };

  const filas = [
    ['PRECIO_1_UNIDAD', valorInicialNumericoV47_(existentes, 'PRECIO_1_UNIDAD', baseSegura.precio1, primeraReparacionV47), 'Precio total cuando la cantidad real es 1.'],
    ['PRECIO_2_UNIDADES', valorInicialNumericoV47_(existentes, 'PRECIO_2_UNIDADES', baseSegura.precio2, primeraReparacionV47), 'Precio total cuando la cantidad real es 2.'],
    ['PRECIO_3_UNIDADES', valorInicialNumericoV47_(existentes, 'PRECIO_3_UNIDADES', baseSegura.precio3, primeraReparacionV47), 'Precio total cuando la cantidad real es 3.'],
    ['PRECIO_UNIDAD_EXTRA', valorInicialNumericoV47_(existentes, 'PRECIO_UNIDAD_EXTRA', baseSegura.precioExtra, primeraReparacionV47), 'Importe por cada unidad adicional a partir de la cuarta.'],
    ['COSTO_UNITARIO', valorInicialNumericoV47_(existentes, 'COSTO_UNITARIO', baseSegura.costoUnitario, primeraReparacionV47), 'Costo de produccion por unidad; se usa en utilidad y proyecciones.'],
    ['FLETE_LIMA', valorInicialNumericoV47_(existentes, 'FLETE_LIMA', baseSegura.fleteLima, primeraReparacionV47), 'Flete courier aplicado a pedidos LIMA.'],
    ['FLETE_PROVINCIA', valorInicialNumericoV47_(existentes, 'FLETE_PROVINCIA', baseSegura.fleteProvincia, primeraReparacionV47), 'Flete courier base aplicado a PROVINCIA.'],
    ['TIPO_CAMBIO_PUBLICIDAD', valorInicialNumericoV47_(existentes, 'TIPO_CAMBIO_PUBLICIDAD', baseSegura.tipoCambioPublicidad, false), 'Tipo de cambio USD a PEN para convertir Facebook US$ a Facebook S/.'],
    ['PRODUCTO', valorExistenteV47_(existentes, 'PRODUCTO', base.producto), 'Nombre comercial mostrado en GESTION PEDIDOS.'],
    ['UM', valorExistenteV47_(existentes, 'UM', base.um), 'Unidad de medida.'],
    ['COLOR_MORADO', valorExistenteV47_(existentes, 'COLOR_MORADO', base.colorMorado), 'Color de Volver a llamar.'],
    ['COLOR_AMARILLO', valorExistenteV47_(existentes, 'COLOR_AMARILLO', base.colorAmarillo), 'Color de En espera.'],
    ['COLOR_ROJO', valorExistenteV47_(existentes, 'COLOR_ROJO', base.colorRojo), 'Color de Cancelado.'],
    ['COLOR_AZUL', valorExistenteV47_(existentes, 'COLOR_AZUL', base.colorAzul), 'Color de Programado/Enviado.'],
    ['COLOR_VERDE', valorExistenteV47_(existentes, 'COLOR_VERDE', base.colorVerde), 'Color de Entregado.']
  ];

  hoja.getRange(2, 1, filas.length, 3).setValues(filas);
  hoja.getRange(2, 2, 8, 1).setNumberFormat('0.00');
  hoja.autoResizeColumns(1, 3);
  hoja.setFrozenRows(1);
  hoja.setTabColor('#D97706');
  propsV47.setProperty('SC_V47_CONFIG_REPARADA', '1');
  sincronizarPanelDesdeConfigV47_(gestion, leerConfiguracion_(gestion));
  return hoja;
}

function valorInicialNumericoV47_(mapa, clave, defecto, primeraReparacion) {
  if (!Object.prototype.hasOwnProperty.call(mapa, clave) || estaVacio_(mapa[clave])) return defecto;
  const v = Math.max(0, numeroSeguro_(mapa[clave]));
  // Solo en la primera reparacion V4.7 se considera un cero heredado como posible
  // corrupcion de versiones intermedias. Luego el Administrador puede guardar 0.
  if (primeraReparacion && v <= 0 && defecto > 0) return defecto;
  return v;
}

function valorExistenteV47_(mapa, clave, defecto) {
  return Object.prototype.hasOwnProperty.call(mapa, clave) && !estaVacio_(mapa[clave]) ? mapa[clave] : defecto;
}

function leerConfiguracionDesdePanelV47_(gestion) {
  const d = SC_CONFIG.DEFAULTS;
  try {
    const v = gestion.getRange('AG2:AG17').getValues().flat();
    return {
      precio1: numeroConfig_(v[0], d.precio1), precio2: numeroConfig_(v[1], d.precio2),
      precio3: numeroConfig_(v[2], d.precio3), precioExtra: numeroConfig_(v[3], d.precioExtra),
      costoUnitario: numeroConfig_(v[4], d.costoUnitario), fleteLima: numeroConfig_(v[5], d.fleteLima),
      fleteProvincia: numeroConfig_(v[6], d.fleteProvincia), tipoCambioPublicidad: d.tipoCambioPublicidad, producto: String(v[7] || d.producto).trim() || d.producto,
      um: String(v[8] || d.um).trim().toUpperCase() || d.um,
      colorMorado: colorSeguro_(v[11], d.colorMorado), colorAmarillo: colorSeguro_(v[12], d.colorAmarillo),
      colorRojo: colorSeguro_(v[13], d.colorRojo), colorAzul: colorSeguro_(v[14], d.colorAzul),
      colorVerde: colorSeguro_(v[15], d.colorVerde)
    };
  } catch (e) {
    return Object.assign({}, d);
  }
}

/** Guarda configuracion comercial desde la web o desde otras funciones. */
function guardarConfiguracionNegocioV47_(cambios) {
  const libro = obtenerLibro_();
  const gestion = libro.getSheetByName(SC_CONFIG.HOJA_GESTION);
  if (!gestion) throw new Error('No existe GESTION PEDIDOS.');
  const hoja = asegurarConfiguracionNegocioV47_(libro, gestion);
  const actual = leerConfiguracion_(gestion);
  const nueva = {
    precio1: cambios.precio1 !== undefined ? Math.max(0, numeroSeguro_(cambios.precio1)) : actual.precio1,
    precio2: cambios.precio2 !== undefined ? Math.max(0, numeroSeguro_(cambios.precio2)) : actual.precio2,
    precio3: cambios.precio3 !== undefined ? Math.max(0, numeroSeguro_(cambios.precio3)) : actual.precio3,
    precioExtra: cambios.precioExtra !== undefined ? Math.max(0, numeroSeguro_(cambios.precioExtra)) : actual.precioExtra,
    costoUnitario: cambios.costoUnitario !== undefined ? Math.max(0, numeroSeguro_(cambios.costoUnitario)) : actual.costoUnitario,
    fleteLima: cambios.fleteLima !== undefined ? Math.max(0, numeroSeguro_(cambios.fleteLima)) : actual.fleteLima,
    fleteProvincia: cambios.fleteProvincia !== undefined ? Math.max(0, numeroSeguro_(cambios.fleteProvincia)) : actual.fleteProvincia,
    tipoCambioPublicidad: cambios.tipoCambioPublicidad !== undefined ? Math.max(0.01, numeroSeguro_(cambios.tipoCambioPublicidad)) : actual.tipoCambioPublicidad,
    producto: cambios.producto !== undefined ? (String(cambios.producto || '').trim() || actual.producto) : actual.producto,
    um: cambios.um !== undefined ? (String(cambios.um || '').trim().toUpperCase() || actual.um) : actual.um,
    colorMorado: cambios.colorMorado !== undefined ? colorSeguro_(cambios.colorMorado, actual.colorMorado) : actual.colorMorado,
    colorAmarillo: cambios.colorAmarillo !== undefined ? colorSeguro_(cambios.colorAmarillo, actual.colorAmarillo) : actual.colorAmarillo,
    colorRojo: cambios.colorRojo !== undefined ? colorSeguro_(cambios.colorRojo, actual.colorRojo) : actual.colorRojo,
    colorAzul: cambios.colorAzul !== undefined ? colorSeguro_(cambios.colorAzul, actual.colorAzul) : actual.colorAzul,
    colorVerde: cambios.colorVerde !== undefined ? colorSeguro_(cambios.colorVerde, actual.colorVerde) : actual.colorVerde
  };

  const mapa = {
    PRECIO_1_UNIDAD: nueva.precio1, PRECIO_2_UNIDADES: nueva.precio2, PRECIO_3_UNIDADES: nueva.precio3,
    PRECIO_UNIDAD_EXTRA: nueva.precioExtra, COSTO_UNITARIO: nueva.costoUnitario, FLETE_LIMA: nueva.fleteLima,
    FLETE_PROVINCIA: nueva.fleteProvincia, TIPO_CAMBIO_PUBLICIDAD: nueva.tipoCambioPublicidad, PRODUCTO: nueva.producto, UM: nueva.um,
    COLOR_MORADO: nueva.colorMorado, COLOR_AMARILLO: nueva.colorAmarillo, COLOR_ROJO: nueva.colorRojo,
    COLOR_AZUL: nueva.colorAzul, COLOR_VERDE: nueva.colorVerde
  };
  const last = hoja.getLastRow();
  const datos = last >= 2 ? hoja.getRange(2, 1, last - 1, 2).getValues() : [];
  datos.forEach(function(f, i) {
    const k = String(f[0] || '').trim().toUpperCase();
    if (Object.prototype.hasOwnProperty.call(mapa, k)) hoja.getRange(i + 2, 2).setValue(mapa[k]);
  });
  sincronizarPanelDesdeConfigV47_(gestion, nueva);
  recalcularTodosLosPedidosCore_(libro);
  actualizarResumenVentasCore_(libro);
  return nueva;
}

function sincronizarPanelDesdeConfigV47_(gestion, c) {
  try {
    gestion.getRange('AG2:AG10').setValues([[c.precio1],[c.precio2],[c.precio3],[c.precioExtra],[c.costoUnitario],[c.fleteLima],[c.fleteProvincia],[c.producto],[c.um]]);
    gestion.getRange('AG13:AG17').setValues([[c.colorMorado],[c.colorAmarillo],[c.colorRojo],[c.colorAzul],[c.colorVerde]]);
    gestion.getRange('AG11').setValue(new Date()).setNumberFormat('dd/mm/yyyy HH:mm:ss');
  } catch (e) { console.log('No se pudo espejar configuracion en AF:AG: ' + e); }
}

function sincronizarConfigDesdePanelV47_(gestion) {
  const c = leerConfiguracionDesdePanelV47_(gestion);
  const libro = gestion.getParent();
  const hoja = asegurarConfiguracionNegocioV47_(libro, gestion);
  const mapa = {
    PRECIO_1_UNIDAD:c.precio1, PRECIO_2_UNIDADES:c.precio2, PRECIO_3_UNIDADES:c.precio3,
    PRECIO_UNIDAD_EXTRA:c.precioExtra, COSTO_UNITARIO:c.costoUnitario, FLETE_LIMA:c.fleteLima,
    FLETE_PROVINCIA:c.fleteProvincia, PRODUCTO:c.producto, UM:c.um,
    COLOR_MORADO:c.colorMorado, COLOR_AMARILLO:c.colorAmarillo, COLOR_ROJO:c.colorRojo,
    COLOR_AZUL:c.colorAzul, COLOR_VERDE:c.colorVerde
  };
  const data = hoja.getRange(2,1,hoja.getLastRow()-1,2).getValues();
  data.forEach(function(f,i){const k=String(f[0]||'').trim().toUpperCase();if(Object.prototype.hasOwnProperty.call(mapa,k))hoja.getRange(i+2,2).setValue(mapa[k]);});
}

function manejarEdicionConfiguracionV47_(evento) {
  if (evento.range.getRow() < 2 || evento.range.getColumn() !== 2) return;
  const libro = evento.range.getSheet().getParent();
  const gestion = libro.getSheetByName(SC_CONFIG.HOJA_GESTION);
  if (!gestion) return;
  asegurarConfiguracionNegocioV47_(libro, gestion);
  sincronizarPanelDesdeConfigV47_(gestion, leerConfiguracion_(gestion));
  recalcularTodosLosPedidosCore_(libro);
  recalcularGastosPublicidadV472_(libro);
  actualizarResumenVentasCore_(libro);
}

/** Restaura el trigger basico que alimenta GESTION PEDIDOS desde Hoja 1. */
function asegurarActivadorSincronizacionV47_() {
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getHandlerFunction() === 'sincronizarPedidos') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('sincronizarPedidos').timeBased().everyMinutes(1).create();
}


/**
 * Ejecutar UNA VEZ al actualizar a V4.7.1.
 * No reconstruye GESTION PEDIDOS: asegura el trigger e inserta solo faltantes.
 */
function actualizarNegocioV471() {
  const bloqueo = LockService.getDocumentLock();
  if (!bloqueo.tryLock(30000)) throw new Error('Hay otra sincronizacion activa. Intenta nuevamente.');
  try {
    const libro = obtenerLibro_();
    const gestion = libro.getSheetByName(SC_CONFIG.HOJA_GESTION);
    if (!gestion) throw new Error('No existe GESTION PEDIDOS.');

    // Conserva y completa la configuracion comercial sin resetear valores del administrador.
    if (typeof asegurarConfiguracionNegocioV47_ === 'function') {
      asegurarConfiguracionNegocioV47_(libro, gestion);
    }

    asegurarActivadorSincronizacionV47_();
    const resultado = sincronizarPedidosCore_(libro);
    if (resultado.insertados > 0) actualizarResumenVentasCore_(libro);

    console.log('STRAWBERRY CONTROL V4.7.1 LISTO');
    console.log('Pedidos nuevos insertados=' + resultado.insertados);
    console.log('Pedidos origen=' + resultado.origen + ' / existentes antes=' + resultado.existentes);
    console.log('IMPORTANTE: pedidos ya existentes NO se reescriben desde Hoja 1.');
    return resultado;
  } finally {
    bloqueo.releaseLock();
  }
}

/** Diagnostico V4.7.1: compara origen contra gestion sin modificar datos. */
function verificarSincronizacionV471() {
  const libro = obtenerLibro_();
  const origen = libro.getSheetByName(SC_CONFIG.HOJA_ORIGEN);
  const gestion = libro.getSheetByName(SC_CONFIG.HOJA_GESTION);
  if (!origen || !gestion) throw new Error('Falta Hoja 1 o GESTION PEDIDOS.');

  const origenPedidos = new Set();
  leerOrigen_(origen).forEach(function(f){ const p=normalizarPedido_(f[1]); if(p) origenPedidos.add(p); });
  const gestionLectura = leerGestion_(gestion);
  const gestionPedidos = new Set();
  gestionLectura.filas.forEach(function(r){ const p=normalizarPedido_(r.datos[SC_COL.PEDIDO]); if(p) gestionPedidos.add(p); });
  const faltantes=[];
  origenPedidos.forEach(function(p){ if(!gestionPedidos.has(p)) faltantes.push(p); });
  const triggers = ScriptApp.getProjectTriggers().filter(function(t){ return t.getHandlerFunction()==='sincronizarPedidos'; });

  console.log('V4.7.1 VERSION=' + SC_CONFIG.VERSION);
  console.log('Pedidos Hoja 1=' + origenPedidos.size);
  console.log('Pedidos Gestion=' + gestionPedidos.size);
  console.log('Faltantes=' + faltantes.length + (faltantes.length ? ' -> ' + faltantes.slice(0,25).join(', ') : ''));
  console.log('Trigger sincronizarPedidos=' + triggers.length);
  return {version:SC_CONFIG.VERSION, origen:origenPedidos.size, gestion:gestionPedidos.size, faltantes:faltantes, triggers:triggers.length};
}

function verificarSincronizacionV47() {
  const libro = obtenerLibro_();
  const origen = libro.getSheetByName(SC_CONFIG.HOJA_ORIGEN);
  const gestion = libro.getSheetByName(SC_CONFIG.HOJA_GESTION);
  const origenRows = leerOrigen_(origen);
  const gestionRows = leerGestion_(gestion).filas;
  const origenPedidos = new Set(origenRows.map(function(r){return normalizarPedido_(r[1]);}).filter(Boolean));
  const gestionPedidos = new Set(gestionRows.map(function(r){return normalizarPedido_(r.datos[SC_COL.PEDIDO]);}).filter(Boolean));
  const faltantes = [];
  origenPedidos.forEach(function(p){if(!gestionPedidos.has(p))faltantes.push(p);});
  const triggers = ScriptApp.getProjectTriggers().filter(function(t){return t.getHandlerFunction()==='sincronizarPedidos';});
  console.log('V4.7 VERSION=' + SC_CONFIG.VERSION);
  console.log('Pedidos origen=' + origenPedidos.size + ' gestion=' + gestionPedidos.size + ' faltantes=' + faltantes.length);
  console.log('Faltantes=' + faltantes.join(', '));
  const cfg = leerConfiguracion_(gestion);
  console.log('Trigger sincronizarPedidos=' + triggers.length);
  console.log('Config precios=' + [cfg.precio1,cfg.precio2,cfg.precio3,cfg.precioExtra].join('/') + ' costo=' + cfg.costoUnitario + ' fletes=' + cfg.fleteLima + '/' + cfg.fleteProvincia);
  return {version:SC_CONFIG.VERSION, origen:origenPedidos.size, gestion:gestionPedidos.size, faltantes:faltantes, triggers:triggers.length, config:cfg};
}

/** Alias de emergencia: sincroniza inmediatamente sin esperar al trigger. */
function sincronizarAhoraV47() {
  sincronizarPedidos();
  return verificarSincronizacionV47();
}

/** Ejecutar UNA VEZ al actualizar a V4.7.2. Repara publicidad historica y conserva pedidos. */
function actualizarNegocioV472() {
  const libro = obtenerLibro_();
  const gestion = libro.getSheetByName(SC_CONFIG.HOJA_GESTION);
  if (!gestion) throw new Error('No existe GESTION PEDIDOS.');
  asegurarConfiguracionNegocioV47_(libro, gestion);
  const gastos = recalcularGastosPublicidadV472_(libro);
  try { actualizarResumenVentasCore_(libro); } catch (e) { console.error(e); }
  asegurarActivadorSincronizacionV47_();
  const sync = sincronizarPedidosCore_(libro);
  console.log('STRAWBERRY CONTROL V4.7.2 LISTO');
  console.log('Tipo cambio publicidad=' + leerConfiguracion_(gestion).tipoCambioPublicidad);
  console.log('Filas publicidad recalculadas=' + gastos);
  console.log('Pedidos nuevos insertados=' + sync.insertados);
  return {gastosRecalculados:gastos, pedidosInsertados:sync.insertados};
}

function verificarPublicidadV472() {
  const libro = obtenerLibro_();
  const gestion = libro.getSheetByName(SC_CONFIG.HOJA_GESTION);
  const cfg = leerConfiguracion_(gestion);
  const sh = libro.getSheetByName(SC_CONFIG.HOJA_GASTOS);
  console.log('VERSION=' + SC_CONFIG.VERSION);
  console.log('TIPO_CAMBIO_PUBLICIDAD=' + cfg.tipoCambioPublicidad);
  if (sh && sh.getLastRow() >= 2) {
    const last = ultimaFilaConDatosEnColumnas_(sh,1,6);
    const sample = sh.getRange(Math.max(2,last),1,1,Math.min(6,sh.getMaxColumns())).getDisplayValues()[0];
    console.log('ULTIMO_GASTO=' + sample.join(' | '));
  }
  return true;
}
