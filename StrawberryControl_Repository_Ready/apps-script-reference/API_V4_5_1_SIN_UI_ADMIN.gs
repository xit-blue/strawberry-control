/**
 * STRAWBERRY CONTROL V4.5 - API WEB SOBRE BASE EXISTENTE + AUXILIAR SEPARADA
 * -----------------------------------------------------------------------------
 * - GESTION PEDIDOS / GASTOS / RESUMEN permanecen en el archivo principal.
 * - USUARIOS / SESIONES / HISTORIAL / AUDITORIA / METADATA se guardan en un
 *   segundo Google Sheet liviano configurado por configurarBaseWebV45().
 * - No requiere migrar ni reconstruir GESTION PEDIDOS.
 */

const SC_API = {
  VERSION: '4.5.0',
  ROL_ADMIN: 'ADMIN',
  ROL_TRABAJADOR: 'TRABAJADOR',
  PASSWORD_MIN: 8
};

function doGet(e) {
  try {
    const action = String((e && e.parameter && e.parameter.action) || 'health').trim();
    if (action === 'health' || action === 'ping') {
      const props = PropertiesService.getScriptProperties();
      return apiJson_({
        ok: true,
        service: 'Strawberry Control',
        version: SC_API.VERSION,
        mode: 'aspnet-core + apps-script + google-sheets',
        auxiliaryConfigured: !!props.getProperty(SC_WEB45.PROP_AUX_ID),
        time: new Date().toISOString()
      });
    }
    return apiJson_({ ok: false, message: 'Usa POST autenticado. GET solo admite action=health.' });
  } catch (error) {
    return apiJson_({ ok: false, message: String(error.message || error) });
  }
}

function doPost(e) {
  try {
    const params = apiParametros_(e);
    const action = String(params.action || '').trim();

    if (action === 'health') {
      return apiJson_({ ok: true, version: SC_API.VERSION, time: new Date().toISOString() });
    }
    if (action === 'login') return apiJson_(apiLogin_(params));

    const user = apiValidarSesion_(params.token);

    switch (action) {
      case 'me': return apiJson_({ ok: true, user: apiUsuarioPublico_(user), version: SC_API.VERSION });
      case 'logout': apiLogout_(params.token, user); return apiJson_({ ok: true });
      case 'listOrders':
      case 'list': return apiJson_({ ok: true, data: apiListarPedidosV45_(params) });
      case 'getOrder': return apiJson_({ ok: true, order: apiObtenerPedidoV45_(params.pedido), history: apiListarHistorialLlamadas_(params.pedido, 100) });
      case 'claimOrder': return apiJson_({ ok: true, order: apiTomarPedido_(params.pedido, user) });
      case 'releaseOrder': return apiJson_({ ok: true, order: apiLiberarPedido_(params.pedido, user) });
      case 'updateOrder':
      case 'update': return apiJson_({ ok: true, order: apiActualizarPedidoV45_(params.pedido, params, user) });
      case 'registerNoAnswer': return apiJson_({ ok: true, result: apiRegistrarNoResponde_(params.pedido, params, user) });
      case 'registerResponse': return apiJson_({ ok: true, result: apiRegistrarRespuesta_(params.pedido, params, user) });
      case 'listCallHistory': return apiJson_({ ok: true, history: apiListarHistorialLlamadas_(params.pedido, params.limit || 200) });
      case 'operationalDashboard': return apiJson_({ ok: true, dashboard: apiDashboardOperativo_(params) });
      case 'states': return apiJson_({ ok: true, lima: SC_CONFIG.ESTADOS_LIMA, provincia: SC_CONFIG.ESTADOS_PROVINCIA });

      case 'refreshSummary':
        apiExigirAdmin_(user);
        actualizarResumenVentasCore_(obtenerLibro_());
        return apiJson_({ ok: true, summary: apiLeerResumenV45_() });
      case 'summary':
      case 'adminDashboard':
        apiExigirAdmin_(user);
        return apiJson_({ ok: true, dashboard: apiDashboardAdmin_(params) });
      case 'listAdvertising':
        apiExigirAdmin_(user);
        return apiJson_({ ok: true, items: apiListarGastos_(params) });
      case 'saveAdvertising':
        apiExigirAdmin_(user);
        return apiJson_({ ok: true, item: apiGuardarGasto_(params, user) });
      case 'deleteAdvertising':
        apiExigirAdmin_(user);
        apiEliminarGasto_(params.id, user);
        return apiJson_({ ok: true });
      case 'getConfig':
        apiExigirAdmin_(user);
        return apiJson_({ ok: true, config: apiLeerConfigCompletaV45_() });
      case 'updateConfig':
        apiExigirAdmin_(user);
        return apiJson_({ ok: true, config: apiActualizarConfiguracionV45_(params, user) });
      case 'listUsers':
        apiExigirAdmin_(user);
        return apiJson_({ ok: true, users: apiListarUsuarios_() });
      case 'createUser':
        apiExigirAdmin_(user);
        return apiJson_({ ok: true, user: apiCrearUsuario_(params, user) });
      case 'updateUser':
        apiExigirAdmin_(user);
        return apiJson_({ ok: true, user: apiActualizarUsuario_(params, user) });
      case 'resetPassword':
        apiExigirAdmin_(user);
        apiResetearPassword_(params, user);
        return apiJson_({ ok: true });
      case 'listAudit':
        apiExigirAdmin_(user);
        return apiJson_({ ok: true, items: apiListarAuditoria_(params) });
      case 'forceSync':
        apiExigirAdmin_(user);
        apiForzarSincronizacion_(user);
        return apiJson_({ ok: true, message: 'Sincronizacion completada.' });
      case 'reopenOrder':
        apiExigirAdmin_(user);
        return apiJson_({ ok: true, order: apiReabrirPedido_(params.pedido, params, user) });
      default:
        return apiJson_({ ok: false, message: 'Accion POST no valida: ' + action });
    }
  } catch (error) {
    return apiJson_({
      ok: false,
      code: error && error.code ? error.code : 'ERROR',
      message: String(error && error.message ? error.message : error)
    });
  }
}

// =============================================================================
// AUTENTICACION EN BASE AUXILIAR
// =============================================================================

function crearOResetearAdministrador() {
  // Bootstrap sin interfaz grafica: funciona desde el editor de Apps Script.
  obtenerLibroAuxV45_();

  const username = 'admin';
  const nombre = 'Administrador';
  const password = apiGenerarClaveTemporalAdmin_();

  const resultado = apiCrearOResetearAdministradorDirecto_(username, nombre, password);

  console.log('ADMINISTRADOR V4.5 CREADO / RESETEADO');
  console.log('USUARIO=' + username);
  console.log('CLAVE_TEMPORAL=' + password);
  console.log('IMPORTANTE: copia la clave temporal del registro y cambiala luego desde el panel de Administracion.');

  return resultado;
}

function apiCrearOResetearAdministradorDirecto_(usuario, nombre, password) {
  const username = apiNormalizarUsuario_(usuario);
  const nombreLimpio = String(nombre || '').trim();
  const clave = String(password || '');

  if (!username || !nombreLimpio || clave.length < SC_API.PASSWORD_MIN) {
    throw new Error('Usuario, nombre y contraseña valida son obligatorios.');
  }

  const hoja = v45Aux_(SC_WEB45.HOJA_USUARIOS);
  const registro = apiBuscarUsuarioPorRol_(SC_API.ROL_ADMIN);
  const salt = apiGenerarSalt_();
  const hash = apiHashPassword_(clave, salt);
  const ahora = new Date();
  let id = Utilities.getUuid();

  if (registro) {
    id = registro.datos[0];
    hoja.getRange(registro.fila, 1, 1, 11).setValues([[
      id,
      username,
      nombreLimpio,
      SC_API.ROL_ADMIN,
      hash,
      salt,
      true,
      registro.datos[7] || ahora,
      ahora,
      registro.datos[9] || '',
      registro.datos[10] || 'Administrador principal'
    ]]);
  } else {
    hoja.appendRow([
      id,
      username,
      nombreLimpio,
      SC_API.ROL_ADMIN,
      hash,
      salt,
      true,
      ahora,
      ahora,
      '',
      'Administrador principal'
    ]);
  }

  apiInvalidarSesionesUsuario_(id);

  return {
    ok: true,
    id: id,
    usuario: username,
    nombre: nombreLimpio,
    rol: SC_API.ROL_ADMIN,
    activo: true
  };
}

function apiGenerarClaveTemporalAdmin_() {
  const base = Utilities.getUuid().replace(/-/g, '').substring(0, 12);
  return 'Straw-' + base + '!9';
}

function apiLogin_(params) {
  const username = apiNormalizarUsuario_(params.username || params.usuario);
  const password = String(params.password || params.clave || '');
  if (!username || !password) throw new Error('Ingresa usuario y contraseña.');

  const r = apiBuscarUsuarioPorNombre_(username);
  if (!r || !apiBooleano_(r.datos[6])) throw new Error('Usuario o contraseña incorrectos.');
  if (apiHashPassword_(password, r.datos[5]) !== String(r.datos[4] || '')) throw new Error('Usuario o contraseña incorrectos.');

  const cfg = leerConfigWebV45_();
  const raw = apiGenerarToken_();
  const tokenHash = apiHashSimple_(raw);
  const ahora = new Date();
  const expira = new Date(ahora.getTime() + cfg.horasSesion * 3600000);
  const sesiones = v45Aux_(SC_WEB45.HOJA_SESIONES);
  apiLimpiarSesionesExpiradas_();
  sesiones.appendRow([tokenHash, r.datos[0], r.datos[1], r.datos[3], ahora, expira, ahora, true]);
  v45Aux_(SC_WEB45.HOJA_USUARIOS).getRange(r.fila, 10).setValue(ahora);

  const user = { id:r.datos[0], usuario:r.datos[1], nombre:r.datos[2], rol:r.datos[3], activo:true };
  apiRegistrarAuditoria_(user, 'LOGIN', '', 'SESION', 'Inicio de sesion');
  return { ok:true, token:raw, expiresAt:expira.toISOString(), user:apiUsuarioPublico_(user), version:SC_API.VERSION };
}

function apiLogout_(token, user) {
  const hash = apiHashSimple_(String(token || ''));
  const sh = v45Aux_(SC_WEB45.HOJA_SESIONES);
  if (sh.getLastRow() >= 2) {
    const data = sh.getRange(2,1,sh.getLastRow()-1,8).getValues();
    for (let i=0;i<data.length;i++) {
      if (String(data[i][0]) === hash && apiBooleano_(data[i][7])) {
        sh.getRange(i+2,8).setValue(false); break;
      }
    }
  }
  apiRegistrarAuditoria_(user, 'LOGOUT', '', 'SESION', 'Cierre de sesion');
}

function apiValidarSesion_(token) {
  const raw = String(token || '').trim();
  if (!raw) throw apiError_('AUTH_REQUIRED', 'Sesion requerida.');
  const hash = apiHashSimple_(raw);
  const sh = v45Aux_(SC_WEB45.HOJA_SESIONES);
  if (sh.getLastRow() < 2) throw apiError_('AUTH_REQUIRED', 'Sesion no valida.');
  const data = sh.getRange(2,1,sh.getLastRow()-1,8).getValues();
  const ahora = new Date();
  for (let i=0;i<data.length;i++) {
    const f=data[i];
    if (String(f[0]) !== hash || !apiBooleano_(f[7])) continue;
    const expira=aFecha_(f[5]);
    if (!expira || expira.getTime() <= ahora.getTime()) {
      sh.getRange(i+2,8).setValue(false);
      throw apiError_('SESSION_EXPIRED','La sesion expiro.');
    }
    const usr=apiBuscarUsuarioPorId_(f[1]);
    if (!usr || !apiBooleano_(usr.datos[6])) throw apiError_('USER_DISABLED','El usuario esta desactivado.');
    sh.getRange(i+2,7).setValue(ahora);
    return { id:usr.datos[0], usuario:usr.datos[1], nombre:usr.datos[2], rol:usr.datos[3], activo:true };
  }
  throw apiError_('AUTH_REQUIRED','Sesion no valida.');
}

function apiUsuarioPublico_(u) { return { id:u.id, usuario:u.usuario, nombre:u.nombre, rol:u.rol, activo:u.activo !== false }; }
function apiExigirAdmin_(u) { if (!u || u.rol !== SC_API.ROL_ADMIN) throw apiError_('FORBIDDEN','Solo el Administrador puede realizar esta accion.'); }

function apiBuscarUsuarioPorNombre_(username) {
  const sh=v45Aux_(SC_WEB45.HOJA_USUARIOS); if(sh.getLastRow()<2)return null;
  const data=sh.getRange(2,1,sh.getLastRow()-1,11).getValues();
  for(let i=0;i<data.length;i++) if(apiNormalizarUsuario_(data[i][1])===username)return{fila:i+2,datos:data[i]};
  return null;
}
function apiBuscarUsuarioPorId_(id) {
  const sh=v45Aux_(SC_WEB45.HOJA_USUARIOS); if(sh.getLastRow()<2)return null;
  const data=sh.getRange(2,1,sh.getLastRow()-1,11).getValues();
  for(let i=0;i<data.length;i++) if(String(data[i][0])===String(id))return{fila:i+2,datos:data[i]};
  return null;
}
function apiBuscarUsuarioPorRol_(rol) {
  const sh=v45Aux_(SC_WEB45.HOJA_USUARIOS); if(sh.getLastRow()<2)return null;
  const data=sh.getRange(2,1,sh.getLastRow()-1,11).getValues();
  for(let i=0;i<data.length;i++) if(String(data[i][3])===rol)return{fila:i+2,datos:data[i]};
  return null;
}
function apiListarUsuarios_() {
  const sh=v45Aux_(SC_WEB45.HOJA_USUARIOS); if(sh.getLastRow()<2)return[];
  return sh.getRange(2,1,sh.getLastRow()-1,11).getValues().filter(function(f){return f[0];}).map(function(f){
    return {id:f[0],usuario:f[1],nombre:f[2],rol:f[3],activo:apiBooleano_(f[6]),creadoEn:apiFechaHoraISO_(f[7]),actualizadoEn:apiFechaHoraISO_(f[8]),ultimoLogin:apiFechaHoraISO_(f[9])};
  });
}
function apiCrearUsuario_(p,admin) {
  const username=apiNormalizarUsuario_(p.username||p.usuario), nombre=String(p.nombre||p.name||'').trim(), password=String(p.password||p.clave||'');
  if(!username||!nombre||password.length<SC_API.PASSWORD_MIN)throw new Error('Usuario, nombre y contraseña de minimo 8 caracteres son obligatorios.');
  if(apiBuscarUsuarioPorNombre_(username))throw new Error('El usuario ya existe.');
  const cfg=leerConfigWebV45_();
  const activos=apiListarUsuarios_().filter(function(u){return u.rol===SC_API.ROL_TRABAJADOR&&u.activo;}).length;
  if(activos>=cfg.maxTrabajadores)throw new Error('Ya existen '+cfg.maxTrabajadores+' trabajadores activos.');
  const sh=v45Aux_(SC_WEB45.HOJA_USUARIOS), salt=apiGenerarSalt_(), id=Utilities.getUuid(), ahora=new Date();
  sh.appendRow([id,username,nombre,SC_API.ROL_TRABAJADOR,apiHashPassword_(password,salt),salt,true,ahora,ahora,'','']);
  apiRegistrarAuditoria_(admin,'CREAR_USUARIO','', 'USUARIO', username+' / '+nombre);
  return{id:id,usuario:username,nombre:nombre,rol:SC_API.ROL_TRABAJADOR,activo:true};
}
function apiActualizarUsuario_(p,admin) {
  const r=apiBuscarUsuarioPorId_(p.id); if(!r)throw new Error('Usuario no encontrado.');
  if(r.datos[3]===SC_API.ROL_ADMIN)throw new Error('El Administrador principal no se activa/desactiva desde esta opcion.');
  const activo=p.activo===undefined?apiBooleano_(r.datos[6]):apiBooleano_(p.activo);
  if(activo&&!apiBooleano_(r.datos[6])){
    const cfg=leerConfigWebV45_(), activos=apiListarUsuarios_().filter(function(u){return u.rol===SC_API.ROL_TRABAJADOR&&u.activo;}).length;
    if(activos>=cfg.maxTrabajadores)throw new Error('Ya existen '+cfg.maxTrabajadores+' trabajadores activos.');
  }
  const sh=v45Aux_(SC_WEB45.HOJA_USUARIOS);
  sh.getRange(r.fila,7).setValue(activo); sh.getRange(r.fila,9).setValue(new Date());
  if(!activo)apiInvalidarSesionesUsuario_(r.datos[0]);
  apiRegistrarAuditoria_(admin,'ACTUALIZAR_USUARIO','', 'USUARIO', r.datos[1]+' activo='+activo);
  return{id:r.datos[0],usuario:r.datos[1],nombre:r.datos[2],rol:r.datos[3],activo:activo};
}
function apiResetearPassword_(p,admin) {
  const r=apiBuscarUsuarioPorId_(p.id); if(!r)throw new Error('Usuario no encontrado.');
  const password=String(p.password||p.clave||''); if(password.length<SC_API.PASSWORD_MIN)throw new Error('La contraseña debe tener al menos 8 caracteres.');
  const salt=apiGenerarSalt_(), sh=v45Aux_(SC_WEB45.HOJA_USUARIOS);
  sh.getRange(r.fila,5,1,2).setValues([[apiHashPassword_(password,salt),salt]]); sh.getRange(r.fila,9).setValue(new Date());
  apiInvalidarSesionesUsuario_(r.datos[0]);
  apiRegistrarAuditoria_(admin,'RESET_PASSWORD','', 'USUARIO', r.datos[1]);
}
function apiInvalidarSesionesUsuario_(id){if(!id)return;const sh=v45Aux_(SC_WEB45.HOJA_SESIONES);if(sh.getLastRow()<2)return;const d=sh.getRange(2,1,sh.getLastRow()-1,8).getValues();for(let i=0;i<d.length;i++)if(String(d[i][1])===String(id)&&apiBooleano_(d[i][7]))sh.getRange(i+2,8).setValue(false);}
function apiLimpiarSesionesExpiradas_(){const sh=v45Aux_(SC_WEB45.HOJA_SESIONES);if(sh.getLastRow()<2)return;const d=sh.getRange(2,1,sh.getLastRow()-1,8).getValues(),now=Date.now();for(let i=0;i<d.length;i++){const f=aFecha_(d[i][5]);if(apiBooleano_(d[i][7])&&(!f||f.getTime()<=now))sh.getRange(i+2,8).setValue(false);}}

// =============================================================================
// METADATA DE PEDIDOS EN BASE AUXILIAR
// =============================================================================

function v45MetaDefault_(pedido){return [String(pedido||''),'',0,'','','','','','','', '', '', false];}
function v45MetaMap_(){const sh=v45Aux_(SC_WEB45.HOJA_META),map=new Map();if(sh.getLastRow()<2)return map;const d=sh.getRange(2,1,sh.getLastRow()-1,13).getValues();d.forEach(function(f,i){if(f[0])map.set(String(f[0]),{fila:i+2,datos:f});});return map;}
function v45MetaRegistro_(pedido,crear){const p=String(pedido||'').trim();if(!p)throw new Error('Falta el numero de pedido.');const sh=v45Aux_(SC_WEB45.HOJA_META);if(sh.getLastRow()>=2){const vals=sh.getRange(2,1,sh.getLastRow()-1,1).getDisplayValues();for(let i=0;i<vals.length;i++)if(String(vals[i][0])===p)return{hoja:sh,fila:i+2,datos:sh.getRange(i+2,1,1,13).getValues()[0]};}if(!crear)return{hoja:sh,fila:0,datos:v45MetaDefault_(p)};const row=v45MetaDefault_(p);sh.appendRow(row);return{hoja:sh,fila:sh.getLastRow(),datos:row};}
function v45GuardarMeta_(r){if(!r.fila){r.hoja.appendRow(r.datos);r.fila=r.hoja.getLastRow();}else r.hoja.getRange(r.fila,1,1,13).setValues([r.datos]);return r;}
function v45MetaExpirarAtencion_(m){const cfg=leerConfigWebV45_(),who=String(m[5]||''),d=aFecha_(m[6]);if(who&&d&&Date.now()-d.getTime()>=cfg.minutosBloqueo*60000){m[5]='';m[6]='';return true;}return false;}

// =============================================================================
// PEDIDOS
// =============================================================================

function apiListarPedidosV45_(params) {
  v45ProcesarVencimientosSiToca_();
  const hoja=apiObtenerHoja_(), metaMap=v45MetaMap_();
  let orders=leerGestion_(hoja).filas.map(function(r){const p=String(r.datos[SC_COL.PEDIDO]||'');const meta=metaMap.has(p)?metaMap.get(p).datos:v45MetaDefault_(p);return apiFilaAOrdenV45_(r.datos,meta);});
  const q=normalizarTexto_(params.q||params.search||''), estado=normalizarTexto_(params.estado||''), zona=normalizarTexto_(params.zona||''), plataforma=normalizarFiltroPlataforma_(params.plataforma||'TODAS');
  const desde=aFecha_(params.desde),hasta=aFecha_(params.hasta);
  orders=orders.filter(function(o){
    if(q&&normalizarTexto_([o.pedido,o.cliente,o.telefono,o.dni,o.direccion,o.departamento,o.provincia,o.distrito].join(' ')).indexOf(q)<0)return false;
    if(estado&&normalizarTexto_(o.estado)!==estado)return false;
    if(zona&&normalizarTexto_(o.zona)!==zona)return false;
    if(plataforma!=='TODAS'&&detectarPlataforma_(o.plataforma)!==plataforma)return false;
    const f=aFecha_(o.fecha);if(desde&&(!f||f<inicioDia_(desde)))return false;if(hasta&&(!f||f>finDia_(hasta)))return false;return true;
  });
  orders.sort(function(a,b){return String(b.fecha||'').localeCompare(String(a.fecha||''))||String(b.pedido).localeCompare(String(a.pedido));});
  const total=orders.length,page=Math.max(1,Math.floor(numeroSeguro_(params.page)||1)),pageSize=Math.min(200,Math.max(10,Math.floor(numeroSeguro_(params.pageSize)||50))),start=(page-1)*pageSize;
  return{items:orders.slice(start,start+pageSize),total:total,page:page,pageSize:pageSize,pages:Math.max(1,Math.ceil(total/pageSize))};
}
function apiObtenerPedidoV45_(pedido){const r=apiObtenerRegistroPedido_(pedido),m=v45MetaRegistro_(pedido,false).datos;if(v45MetaExpirarAtencion_(m)){const mr=v45MetaRegistro_(pedido,true);mr.datos=m;v45GuardarMeta_(mr);}return apiFilaAOrdenV45_(r.datos,m);}
function apiObtenerRegistroPedido_(pedido){const p=String(pedido||'').trim();if(!p)throw new Error('Falta el numero de pedido.');const lectura=leerGestion_(apiObtenerHoja_()),r=lectura.mapa.get(p);if(!r)throw new Error('No se encontro el pedido '+p+'.');return r;}
function apiTomarPedido_(pedido,user){const mr=v45MetaRegistro_(pedido,true),cfg=leerConfigWebV45_();v45MetaExpirarAtencion_(mr.datos);const who=String(mr.datos[5]||''),since=aFecha_(mr.datos[6]);const vigente=who&&since&&Date.now()-since.getTime()<cfg.minutosBloqueo*60000;if(vigente&&who!==user.usuario)throw apiError_('ORDER_BUSY','Este pedido esta siendo atendido por '+who+'.');mr.datos[5]=user.usuario;mr.datos[6]=new Date();mr.datos[10]=user.usuario;mr.datos[11]=new Date();v45GuardarMeta_(mr);return apiObtenerPedidoV45_(pedido);}
function apiLiberarPedido_(pedido,user){const mr=v45MetaRegistro_(pedido,true),who=String(mr.datos[5]||'');if(who&&who!==user.usuario&&user.rol!==SC_API.ROL_ADMIN)throw apiError_('ORDER_BUSY','El pedido esta siendo atendido por '+who+'.');mr.datos[5]='';mr.datos[6]='';mr.datos[10]=user.usuario;mr.datos[11]=new Date();v45GuardarMeta_(mr);return apiObtenerPedidoV45_(pedido);}

function apiActualizarPedidoV45_(pedido,p,user){
  const r=apiObtenerRegistroPedido_(pedido),hoja=apiObtenerHoja_(),f=r.datos.slice(),mr=v45MetaRegistro_(pedido,true),cfgBase=leerConfiguracion_(hoja);
  if(apiBooleano_(mr.datos[9])&&user.rol!==SC_API.ROL_ADMIN)throw apiError_('ORDER_CLOSED','El pedido esta cerrado. Solo el Administrador puede modificarlo.');
  if(p.cliente!==undefined)f[SC_COL.CLIENTE]=String(p.cliente||'').trim();
  if(p.telefono!==undefined)f[SC_COL.TELEFONO_AUX]=limpiarTelefono_(p.telefono);
  if(p.dni!==undefined)mr.datos[1]=String(p.dni||'').replace(/\D/g,'').substring(0,12);
  if(p.departamento!==undefined)f[SC_COL.DEPARTAMENTO]=String(p.departamento||'').trim();
  if(p.provincia!==undefined)f[SC_COL.PROVINCIA]=String(p.provincia||'').trim();
  if(p.distrito!==undefined)f[SC_COL.DISTRITO]=String(p.distrito||'').trim();
  if(p.direccion!==undefined)f[SC_COL.DIRECCION]=String(p.direccion||'').trim();
  if(p.cantidadReal!==undefined||p.cantidad!==undefined)f[SC_COL.CANT_REAL]=Math.max(0,Math.floor(numeroSeguro_(p.cantidadReal!==undefined?p.cantidadReal:p.cantidad)));
  if(p.zona!==undefined&&String(p.zona).trim()){f[SC_COL.ZONA]=normalizarZona_(p.zona);f[SC_COL.MODO_ZONA]='MANUAL';}
  if(p.modoZona!==undefined)f[SC_COL.MODO_ZONA]=normalizarTexto_(p.modoZona)==='manual'?'MANUAL':'AUTO';
  if(p.fleteShalom!==undefined&&p.fleteShalom!=='')f[SC_COL.FLETE_SHALOM]=Math.max(0,numeroSeguro_(p.fleteShalom));
  if(p.adelanto!==undefined&&p.adelanto!=='')f[SC_COL.ADELANTO]=Math.max(0,numeroSeguro_(p.adelanto));
  if(p.fechaEntrega!==undefined)f[SC_COL.FECHA_ENTREGA]=apiFechaParaCelda_(p.fechaEntrega);
  if(p.fechaEnvio!==undefined)f[SC_COL.FECHA_ENVIO]=apiFechaParaCelda_(p.fechaEnvio);
  if(p.claveShalom!==undefined||p.clave!==undefined)f[SC_COL.CLAVE_SHALOM]=String(p.claveShalom!==undefined?p.claveShalom:(p.clave||'')).trim();
  if(p.comentario!==undefined)f[SC_COL.COMENTARIO]=String(p.comentario||'').trim();
  if(user.rol===SC_API.ROL_ADMIN&&p.intentosLlamada!==undefined)mr.datos[2]=Math.max(0,Math.floor(numeroSeguro_(p.intentosLlamada)));

  let pre=recalcularFilaGestion_(f,cfgBase);
  if(p.estado!==undefined&&String(p.estado).trim()){
    const estado=String(p.estado).trim(),list=normalizarZona_(pre[SC_COL.ZONA])===SC_CONFIG.ZONA_LIMA?SC_CONFIG.ESTADOS_LIMA:SC_CONFIG.ESTADOS_PROVINCIA;
    if(!list.some(function(x){return normalizarTexto_(x)===normalizarTexto_(estado);}))throw new Error('El estado '+estado+' no corresponde a '+pre[SC_COL.ZONA]+'.');
    if(normalizarTexto_(estado)==='cancelado'){
      const motivo=String(p.motivo!==undefined?p.motivo:pre[SC_COL.MOTIVO]||'').trim();if(!motivo||normalizarNoAplica_(motivo))throw new Error('Selecciona un motivo de cancelacion.');pre[SC_COL.MOTIVO]=motivo;mr.datos[9]=true;
    }
    if(normalizarTexto_(estado)==='volver a llamar'){
      const prox=apiFechaParaCelda_(p.proximaLlamada);if(!aFecha_(prox))throw new Error('VOLVER A LLAMAR requiere fecha y hora.');mr.datos[4]=prox;
    } else if(p.proximaLlamada!==undefined) mr.datos[4]=apiFechaParaCelda_(p.proximaLlamada);
    if(normalizarTexto_(estado)==='enviado'&&numeroSeguro_(pre[SC_COL.ADELANTO])<=0)throw new Error('Para marcar ENVIADO debe existir un adelanto.');
    if(normalizarTexto_(estado)==='confirmado'&&!aFecha_(mr.datos[7]))mr.datos[7]=new Date();
    if(normalizarTexto_(estado)==='esperando adelanto'&&!aFecha_(mr.datos[8]))mr.datos[8]=new Date();
    if(normalizarTexto_(estado)==='entregado')mr.datos[9]=true;
    pre[SC_COL.ESTADO]=estado;
  }
  const procesada=recalcularFilaGestion_(pre,cfgBase);
  hoja.getRange(r.fila,1,1,SC_CONFIG.COLUMNAS_GESTION).setValues([procesada]);
  mr.datos[10]=user.usuario;mr.datos[11]=new Date();v45GuardarMeta_(mr);
  apiRegistrarAuditoria_(user,'ACTUALIZAR_PEDIDO',pedido,'PEDIDO','Actualizacion desde web');
  try{actualizarResumenVentasCore_(obtenerLibro_());}catch(e){console.log(e);}
  return apiFilaAOrdenV45_(procesada,mr.datos);
}

function apiRegistrarNoResponde_(pedido,p,user){const r=apiObtenerRegistroPedido_(pedido),hoja=apiObtenerHoja_(),f=r.datos.slice(),mr=v45MetaRegistro_(pedido,true),cfg=leerConfigWebV45_(),baseCfg=leerConfiguracion_(hoja);if(apiBooleano_(mr.datos[9])&&user.rol!==SC_API.ROL_ADMIN)throw apiError_('ORDER_CLOSED','El pedido esta cerrado.');const antes=f[SC_COL.ESTADO],ahora=new Date(),intento=Math.min(cfg.maxIntentos,Math.max(0,Math.floor(numeroSeguro_(mr.datos[2])))+1);mr.datos[2]=intento;mr.datos[3]=ahora;mr.datos[4]='';if(intento>=cfg.maxIntentos){f[SC_COL.ESTADO]='Cancelado';f[SC_COL.MOTIVO]='No responde - '+cfg.maxIntentos+' intentos';mr.datos[9]=true;}else{f[SC_COL.ESTADO]='Por llamar';f[SC_COL.MOTIVO]='NO APLICA';}mr.datos[10]=user.usuario;mr.datos[11]=ahora;const proc=recalcularFilaGestion_(f,baseCfg);hoja.getRange(r.fila,1,1,SC_CONFIG.COLUMNAS_GESTION).setValues([proc]);v45GuardarMeta_(mr);apiRegistrarLlamada_(pedido,'NO_RESPONDE',intento,'No responde',antes,proc[SC_COL.ESTADO],'',user,p.comentario||'');apiRegistrarAuditoria_(user,'NO_RESPONDE',pedido,'PEDIDO','Intento '+intento+'/'+cfg.maxIntentos);try{actualizarResumenVentasCore_(obtenerLibro_());}catch(e){}return{order:apiFilaAOrdenV45_(proc,mr.datos),attempt:intento,maxAttempts:cfg.maxIntentos,autoCancelled:intento>=cfg.maxIntentos};}

function apiRegistrarRespuesta_(pedido,p,user){const resultado=String(p.resultado||p.estado||'').trim(),permitidos=['Confirmado','En espera','Volver a llamar','Cancelado'];if(!permitidos.some(function(x){return normalizarTexto_(x)===normalizarTexto_(resultado);}))throw new Error('Resultado de llamada no valido.');const r=apiObtenerRegistroPedido_(pedido),hoja=apiObtenerHoja_(),f=r.datos.slice(),mr=v45MetaRegistro_(pedido,true),baseCfg=leerConfiguracion_(hoja),antes=f[SC_COL.ESTADO],ahora=new Date();if(apiBooleano_(mr.datos[9])&&user.rol!==SC_API.ROL_ADMIN)throw apiError_('ORDER_CLOSED','El pedido esta cerrado.');mr.datos[3]=ahora;f[SC_COL.ESTADO]=resultado;if(normalizarTexto_(resultado)==='volver a llamar'){const prox=apiFechaParaCelda_(p.proximaLlamada);if(!aFecha_(prox))throw new Error('Indica fecha y hora para volver a llamar.');mr.datos[4]=prox;}else mr.datos[4]='';if(normalizarTexto_(resultado)==='cancelado'){const motivo=String(p.motivo||'').trim();if(!motivo)throw new Error('Selecciona un motivo de cancelacion.');f[SC_COL.MOTIVO]=motivo;mr.datos[9]=true;}if(normalizarTexto_(resultado)==='confirmado'&&!aFecha_(mr.datos[7]))mr.datos[7]=ahora;if(p.comentario!==undefined)f[SC_COL.COMENTARIO]=String(p.comentario||'').trim();mr.datos[10]=user.usuario;mr.datos[11]=ahora;const proc=recalcularFilaGestion_(f,baseCfg);hoja.getRange(r.fila,1,1,SC_CONFIG.COLUMNAS_GESTION).setValues([proc]);v45GuardarMeta_(mr);apiRegistrarLlamada_(pedido,'RESPONDE','',resultado,antes,proc[SC_COL.ESTADO],mr.datos[4],user,p.comentario||p.motivo||'');apiRegistrarAuditoria_(user,'RESPUESTA_CLIENTE',pedido,'PEDIDO',antes+' -> '+proc[SC_COL.ESTADO]);try{actualizarResumenVentasCore_(obtenerLibro_());}catch(e){}return{order:apiFilaAOrdenV45_(proc,mr.datos)};}

function apiReabrirPedido_(pedido,p,user){const r=apiObtenerRegistroPedido_(pedido),hoja=apiObtenerHoja_(),f=r.datos.slice(),mr=v45MetaRegistro_(pedido,true),cfg=leerConfiguracion_(hoja),antes=f[SC_COL.ESTADO];f[SC_COL.ESTADO]=String(p.estado||'Por llamar');f[SC_COL.MOTIVO]='NO APLICA';mr.datos[9]=false;mr.datos[10]=user.usuario;mr.datos[11]=new Date();const proc=recalcularFilaGestion_(f,cfg);hoja.getRange(r.fila,1,1,SC_CONFIG.COLUMNAS_GESTION).setValues([proc]);v45GuardarMeta_(mr);apiRegistrarAuditoria_(user,'REABRIR_PEDIDO',pedido,'PEDIDO',antes+' -> '+proc[SC_COL.ESTADO]);return apiFilaAOrdenV45_(proc,mr.datos);}

function apiFilaAOrdenV45_(f,m){const zona=normalizarZona_(f[SC_COL.ZONA]),telefono=limpiarTelefono_(f[SC_COL.TELEFONO_AUX]),monto=Math.max(0,numeroSeguro_(f[SC_COL.MONTO])),adelanto=zona===SC_CONFIG.ZONA_LIMA?0:Math.max(0,numeroSeguro_(f[SC_COL.ADELANTO]));v45MetaExpirarAtencion_(m);return{fecha:fechaISO_(f[SC_COL.FECHA]),plataforma:f[SC_COL.PLATAFORMA]||'',pedido:String(f[SC_COL.PEDIDO]||'').trim(),cliente:f[SC_COL.CLIENTE]||'',telefono:telefono,whatsappNumero:telefono?('51'+telefono):'',dni:m[1]||'',departamento:f[SC_COL.DEPARTAMENTO]||'',provincia:f[SC_COL.PROVINCIA]||'',distrito:f[SC_COL.DISTRITO]||'',direccion:f[SC_COL.DIRECCION]||'',cantidadShopify:numeroSeguro_(f[SC_COL.CANT_SHOPIFY]),cantidadReal:numeroSeguro_(f[SC_COL.CANT_REAL]),producto:f[SC_COL.PRODUCTO]||'',um:f[SC_COL.UM]||'',total:monto,zona:zona,modoZona:f[SC_COL.MODO_ZONA]||'AUTO',fleteCourier:numeroSeguro_(f[SC_COL.FLETE_COURIER]),fleteShalom:numeroSeguro_(f[SC_COL.FLETE_SHALOM]),condicionPago:f[SC_COL.CONDICION_PAGO]||'',adelanto:adelanto,saldo:zona===SC_CONFIG.ZONA_LIMA?0:Math.max(0,numeroSeguro_(f[SC_COL.SALDO])),fechaEntrega:fechaISO_(f[SC_COL.FECHA_ENTREGA]),fechaEnvio:fechaISO_(f[SC_COL.FECHA_ENVIO]),claveShalom:normalizarNoAplica_(f[SC_COL.CLAVE_SHALOM])?'':String(f[SC_COL.CLAVE_SHALOM]||''),estado:f[SC_COL.ESTADO]||'Por llamar',motivo:normalizarNoAplica_(f[SC_COL.MOTIVO])?'':String(f[SC_COL.MOTIVO]||''),comentario:f[SC_COL.COMENTARIO]||'',intentosLlamada:numeroSeguro_(m[2]),ultimaLlamada:apiFechaHoraISO_(m[3]),proximaLlamada:apiFechaHoraISO_(m[4]),atendiendoPor:m[5]||'',atendiendoDesde:apiFechaHoraISO_(m[6]),confirmadoEn:apiFechaHoraISO_(m[7]),esperandoAdelantoDesde:apiFechaHoraISO_(m[8]),cerrado:apiBooleano_(m[9]),actualizadoPor:m[10]||'',actualizadoEn:apiFechaHoraISO_(m[11]),repetidoAuto:apiBooleano_(m[12])||normalizarTexto_(f[SC_COL.ESTADO])==='repetido'};}

function v45ProcesarVencimientosSiToca_(){const props=PropertiesService.getScriptProperties(),now=Date.now(),last=Number(props.getProperty('SC_V45_LAST_EXPIRY_CHECK')||0);if(now-last<15*60000)return;props.setProperty('SC_V45_LAST_EXPIRY_CHECK',String(now));try{v45ProcesarVencimientos_();}catch(e){console.error(e);}}
function v45ProcesarVencimientos_(){const cfg=leerConfigWebV45_(),hoja=apiObtenerHoja_(),rows=leerGestion_(hoja).filas,meta=v45MetaMap_(),baseCfg=leerConfiguracion_(hoja);rows.forEach(function(r){const p=String(r.datos[SC_COL.PEDIDO]||''),m=meta.has(p)?meta.get(p):null;if(!m)return;const state=normalizarTexto_(r.datos[SC_COL.ESTADO]),start=aFecha_(m.datos[8]);if(state==='esperando adelanto'&&start&&numeroSeguro_(r.datos[SC_COL.ADELANTO])<=0&&Date.now()-start.getTime()>=cfg.diasEsperaAdelanto*86400000){const f=r.datos.slice();f[SC_COL.ESTADO]='Cancelado';f[SC_COL.MOTIVO]='No realizo adelanto dentro de '+cfg.diasEsperaAdelanto+' dias';const proc=recalcularFilaGestion_(f,baseCfg);hoja.getRange(r.fila,1,1,SC_CONFIG.COLUMNAS_GESTION).setValues([proc]);m.datos[9]=true;m.datos[10]='SISTEMA';m.datos[11]=new Date();v45GuardarMeta_({hoja:v45Aux_(SC_WEB45.HOJA_META),fila:m.fila,datos:m.datos});apiRegistrarAuditoria_(null,'CANCELACION_AUTOMATICA',p,'PEDIDO',f[SC_COL.MOTIVO]);}});}

// =============================================================================
// HISTORIAL / AUDITORIA
// =============================================================================

function apiRegistrarLlamada_(pedido,tipo,intento,resultado,antes,despues,proxima,user,comentario){v45Aux_(SC_WEB45.HOJA_LLAMADAS).appendRow([Utilities.getUuid(),new Date(),pedido,tipo,intento||'',resultado||'',antes||'',despues||'',proxima||'',user.usuario,user.nombre,comentario||'']);}
function apiListarHistorialLlamadas_(pedido,limit){const sh=v45Aux_(SC_WEB45.HOJA_LLAMADAS);if(sh.getLastRow()<2)return[];const lim=Math.min(500,Math.max(1,Math.floor(numeroSeguro_(limit)||100))),d=sh.getRange(2,1,sh.getLastRow()-1,12).getValues(),out=[];for(let i=d.length-1;i>=0&&out.length<lim;i--){const f=d[i];if(pedido&&String(f[2])!==String(pedido))continue;out.push({id:f[0],fecha:apiFechaHoraISO_(f[1]),pedido:f[2],tipo:f[3],intento:f[4],resultado:f[5],estadoAntes:f[6],estadoDespues:f[7],proximaLlamada:apiFechaHoraISO_(f[8]),usuario:f[9],nombreUsuario:f[10],comentario:f[11]||''});}return out;}
function apiRegistrarAuditoria_(user,accion,pedido,entidad,detalle){try{v45Aux_(SC_WEB45.HOJA_AUDITORIA).appendRow([Utilities.getUuid(),new Date(),user?user.usuario:'SISTEMA',user?user.rol:'SYSTEM',accion||'',pedido||'',entidad||'',String(detalle||'').substring(0,5000),'WEB']);}catch(e){console.error(e);}}
function apiListarAuditoria_(p){const sh=v45Aux_(SC_WEB45.HOJA_AUDITORIA);if(sh.getLastRow()<2)return[];const lim=Math.min(500,Math.max(10,Math.floor(numeroSeguro_(p.limit)||200))),pedido=String(p.pedido||'').trim(),q=normalizarTexto_(p.q||''),d=sh.getRange(2,1,sh.getLastRow()-1,9).getValues(),out=[];for(let i=d.length-1;i>=0&&out.length<lim;i--){const f=d[i];if(pedido&&String(f[5])!==pedido)continue;if(q&&normalizarTexto_(f.join(' ')).indexOf(q)<0)continue;out.push({id:f[0],fecha:apiFechaHoraISO_(f[1]),usuario:f[2],rol:f[3],accion:f[4],pedido:f[5],entidad:f[6],detalle:f[7],origen:f[8]});}return out;}

// =============================================================================
// DASHBOARD, PUBLICIDAD Y CONFIGURACION
// =============================================================================

function apiDashboardOperativo_(){v45ProcesarVencimientosSiToca_();const hoja=apiObtenerHoja_(),meta=v45MetaMap_(),estados={},zonas={LIMA:0,PROVINCIA:0};let vencidas=0,llamadasHoy=0,esperando7=0,atendiendo=0;const hoy=inicioDia_(new Date()).getTime(),cfg=leerConfigWebV45_();leerGestion_(hoja).filas.forEach(function(r){const p=String(r.datos[SC_COL.PEDIDO]||''),m=meta.has(p)?meta.get(p).datos:v45MetaDefault_(p),o=apiFilaAOrdenV45_(r.datos,m);estados[o.estado]=(estados[o.estado]||0)+1;zonas[o.zona]=(zonas[o.zona]||0)+1;const prox=aFecha_(o.proximaLlamada);if(prox&&prox.getTime()<Date.now()&&normalizarTexto_(o.estado)==='volver a llamar')vencidas++;const ul=aFecha_(o.ultimaLlamada);if(ul&&inicioDia_(ul).getTime()===hoy)llamadasHoy++;if(o.atendiendoPor)atendiendo++;const ea=aFecha_(o.esperandoAdelantoDesde);if(ea&&normalizarTexto_(o.estado)==='esperando adelanto'&&Date.now()-ea.getTime()>=(cfg.diasEsperaAdelanto-1)*86400000)esperando7++;});return{total:Object.values(estados).reduce(function(a,b){return a+b;},0),estados:estados,zonas:zonas,volverALlamarVencidas:vencidas,llamadasHoy:llamadasHoy,esperandoAdelantoProximosAVencer:esperando7,atendiendoAhora:atendiendo,maxIntentos:cfg.maxIntentos};}
function apiDashboardAdmin_(p){const libro=obtenerLibro_(),resumen=libro.getSheetByName(SC_CONFIG.HOJA_RESUMEN);if(resumen){if(p.desde)resumen.getRange(SC_RESUMEN.DESDE).setValue(apiFechaParaCelda_(p.desde));if(p.hasta)resumen.getRange(SC_RESUMEN.HASTA).setValue(apiFechaParaCelda_(p.hasta));if(p.plataforma)resumen.getRange(SC_RESUMEN.PLATAFORMA).setValue(normalizarFiltroPlataforma_(p.plataforma));if(p.desde||p.hasta)resumen.getRange(SC_RESUMEN.PERIODO).setValue('PERSONALIZADO');actualizarResumenVentasCore_(libro);}return{operativo:apiDashboardOperativo_(p),financiero:apiLeerResumenV45_(),config:apiLeerConfigCompletaV45_()};}
function apiLeerResumenV45_(){const sh=obtenerLibro_().getSheetByName(SC_CONFIG.HOJA_RESUMEN);if(!sh)return null;const real=sh.getRange('B7:B13').getValues().flat(),proy=sh.getRange('B18:B24').getValues().flat();return{periodo:sh.getRange(SC_RESUMEN.PERIODO).getValue()||'',plataforma:normalizarFiltroPlataforma_(sh.getRange(SC_RESUMEN.PLATAFORMA).getValue()),desde:fechaISO_(sh.getRange(SC_RESUMEN.DESDE).getValue()),hasta:fechaISO_(sh.getRange(SC_RESUMEN.HASTA).getValue()),real:apiValoresResumenV45_(real),proyeccion:apiValoresResumenV45_(proy),updatedAt:apiFechaHoraISO_(sh.getRange(SC_RESUMEN.ACTUALIZADO).getValue())};}
function apiValoresResumenV45_(v){return{unidades:numeroSeguro_(v[0]),ingresos:numeroSeguro_(v[1]),publicidad:numeroSeguro_(v[2]),costoProduccion:numeroSeguro_(v[3]),fleteCourier:numeroSeguro_(v[4]),fleteShalom:numeroSeguro_(v[5]),ganancia:numeroSeguro_(v[6])};}

function apiListarGastos_(p){const sh=obtenerLibro_().getSheetByName(SC_CONFIG.HOJA_GASTOS);if(!sh||sh.getLastRow()<2)return[];const last=ultimaFilaConDatosEnColumnas_(sh,1,6);if(last<2)return[];const desde=aFecha_(p.desde),hasta=aFecha_(p.hasta),out=[];sh.getRange(2,1,last-1,6).getValues().forEach(function(f,i){if(!(f[0]||f[1]||f[2]||f[3]||f[5]))return;const d=aFecha_(f[0]);if(desde&&(!d||d<inicioDia_(desde)))return;if(hasta&&(!d||d>finDia_(hasta)))return;out.push({id:String(i+2),fecha:fechaISO_(f[0]),fbDolares:numeroSeguro_(f[1]),fbSoles:numeroSeguro_(f[2]),tiktokSoles:numeroSeguro_(f[3]),totalSoles:numeroSeguro_(f[4]),observacion:f[5]||''});});return out.reverse();}
function apiGuardarGasto_(p,user){const fecha=apiFechaParaCelda_(p.fecha);if(!aFecha_(fecha))throw new Error('Fecha obligatoria.');const sh=obtenerLibro_().getSheetByName(SC_CONFIG.HOJA_GASTOS);if(!sh)throw new Error('No existe GASTOS PUBLICIDAD.');let row=Math.floor(numeroSeguro_(p.id));if(row<2)row=Math.max(2,ultimaFilaConDatosEnColumnas_(sh,1,6)+1);const usd=Math.max(0,numeroSeguro_(p.fbDolares)),fb=Math.max(0,numeroSeguro_(p.fbSoles)),tt=Math.max(0,numeroSeguro_(p.tiktokSoles)),total=Math.round((fb+tt)*100)/100;sh.getRange(row,1,1,6).setValues([[fecha,usd,fb,tt,total,String(p.observacion||'').trim()]]);try{actualizarResumenVentasCore_(obtenerLibro_());}catch(e){}apiRegistrarAuditoria_(user,'GUARDAR_PUBLICIDAD','', 'PUBLICIDAD',fechaISO_(fecha)+' total S/'+total);return{id:String(row),fecha:fechaISO_(fecha),fbDolares:usd,fbSoles:fb,tiktokSoles:tt,totalSoles:total,observacion:String(p.observacion||'').trim()};}
function apiEliminarGasto_(id,user){const sh=obtenerLibro_().getSheetByName(SC_CONFIG.HOJA_GASTOS),row=Math.floor(numeroSeguro_(id));if(!sh||row<2||row>sh.getLastRow())throw new Error('Gasto no encontrado.');sh.getRange(row,1,1,6).clearContent();try{actualizarResumenVentasCore_(obtenerLibro_());}catch(e){}apiRegistrarAuditoria_(user,'ELIMINAR_PUBLICIDAD','', 'PUBLICIDAD',String(id));}

function apiLeerConfigCompletaV45_(){const base=leerConfiguracion_(apiObtenerHoja_()),web=leerConfigWebV45_();return Object.assign({},base,web);}
function apiActualizarConfiguracionV45_(p,user){
  const aux=v45Aux_(SC_WEB45.HOJA_CONFIG_WEB),keys={maxIntentos:'MAX_INTENTOS_NO_RESPONDE',diasEsperaAdelanto:'DIAS_ESPERA_ADELANTO',minutosBloqueo:'MINUTOS_BLOQUEO_ATENCION',horasSesion:'HORAS_SESION'};
  if(aux.getLastRow()>=2){const data=aux.getRange(2,1,aux.getLastRow()-1,2).getValues();data.forEach(function(f,i){Object.keys(keys).forEach(function(k){if(keys[k]===String(f[0])&&p[k]!==undefined)aux.getRange(i+2,2).setValue(Math.max(0,numeroSeguro_(p[k])));});});}
  // Configuracion comercial: si existe CONFIGURACION V4 previa, la reutilizamos sin tocar GESTION PEDIDOS.
  const libro=obtenerLibro_(),cfg=libro.getSheetByName('CONFIGURACION');
  const commercial={precio1:'PRECIO_1_UNIDAD',precio2:'PRECIO_2_UNIDADES',precio3:'PRECIO_3_UNIDADES',precioExtra:'PRECIO_UNIDAD_EXTRA',costoUnitario:'COSTO_UNITARIO',fleteLima:'FLETE_LIMA',fleteProvincia:'FLETE_PROVINCIA',producto:'PRODUCTO',um:'UM'};
  if(cfg&&cfg.getLastRow()>=2){const data=cfg.getRange(2,1,cfg.getLastRow()-1,2).getValues();data.forEach(function(f,i){Object.keys(commercial).forEach(function(k){if(commercial[k]===String(f[0])&&p[k]!==undefined)cfg.getRange(i+2,2).setValue(['producto','um'].indexOf(k)>=0?String(p[k]):Math.max(0,numeroSeguro_(p[k])));});});}
  apiRegistrarAuditoria_(user,'ACTUALIZAR_CONFIG','', 'CONFIGURACION','Configuracion actualizada');
  return apiLeerConfigCompletaV45_();
}
function apiForzarSincronizacion_(user){const lock=LockService.getDocumentLock();if(!lock.tryLock(60000))throw new Error('Otra sincronizacion esta activa.');try{sincronizarPedidosCore_(obtenerLibro_());v45ProcesarVencimientos_();actualizarResumenVentasCore_(obtenerLibro_());apiRegistrarAuditoria_(user,'SINCRONIZACION_MANUAL','', 'SISTEMA','Sincronizacion manual');}finally{lock.releaseLock();}}

// =============================================================================
// UTILIDADES
// =============================================================================

function v45Aux_(name){return obtenerHojaAuxV45_(name);}
function apiObtenerHoja_(){const sh=obtenerLibro_().getSheetByName(SC_CONFIG.HOJA_GESTION);if(!sh)throw new Error('No existe '+SC_CONFIG.HOJA_GESTION+'.');return sh;}
function apiParametros_(e){const p=Object.assign({},(e&&e.parameter)||{});if(e&&e.postData&&e.postData.contents){const t=String(e.postData.contents||'').trim();if(t){try{return Object.assign(p,JSON.parse(t));}catch(err){if(String(e.postData.type||'').indexOf('application/json')>=0)throw new Error('El JSON enviado no es valido.');}}}return p;}
function apiJson_(payload){return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);}
function apiFechaParaCelda_(v){if(v===undefined||v===null||v==='')return '';return aFecha_(v)||'';}
function apiFechaHoraISO_(v){const f=aFecha_(v);return f?f.toISOString():'';}
function apiBooleano_(v){if(v===true||v===1)return true;const t=normalizarTexto_(v);return t==='true'||t==='si'||t==='1';}
function apiError_(code,message){const e=new Error(message);e.code=code;return e;}
function apiNormalizarUsuario_(v){return String(v||'').trim().toLowerCase().replace(/\s+/g,'');}
function apiGenerarSalt_(){return Utilities.getUuid().replace(/-/g,'')+Utilities.getUuid().replace(/-/g,'').substring(0,12);}
function apiGenerarToken_(){return Utilities.getUuid().replace(/-/g,'')+Utilities.getUuid().replace(/-/g,'')+new Date().getTime();}
function apiHashPassword_(p,s){return apiHashSimple_(String(s)+'|'+String(p));}
function apiHashSimple_(t){const b=Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,String(t),Utilities.Charset.UTF_8);return b.map(function(x){const v=x<0?x+256:x;return('0'+v.toString(16)).slice(-2);}).join('');}

/** Ejecuta esto despues de configurarBaseWebV45 para comprobar backend sin tocar pedidos. */
function pruebaBackendV45(){const aux=obtenerLibroAuxV45_();const u=v45Aux_(SC_WEB45.HOJA_USUARIOS),m=v45Aux_(SC_WEB45.HOJA_META);console.log('API V4.5 OK');console.log('AUX='+aux.getId());console.log('USUARIOS filas='+u.getLastRow());console.log('META filas='+m.getLastRow());return true;}
