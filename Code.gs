/**
 * Code.gs - Google Apps Script Backend for Trofex CRM Operational Checklist
 * =========================================================================
 * Sincroniza las tareas operativas de las 14 tiendas y guarda registros en 
 * la hoja 'BD_OPERACIONES' en Google Sheets.
 */

// ID de la hoja de cálculo (deja en blanco si está vinculado directamente al Spreadsheet)
const SPREADSHEET_ID = "";

// Configuración de roles y correos de la empresa
const USUARIOS_CONFIG = {
  "admin@tuempresa.com": "Admin",
  "margarita.cb@tuempresa.com": "CB",
  "sucely.chm@tuempresa.com": "CHM",
  "ingrid.chq@tuempresa.com": "CHQ",
  "carlos.esc@tuempresa.com": "ESC",
  "hugo.hh@tuempresa.com": "HH",
  "jose.jt@tuempresa.com": "JT",
  "maria.mz@tuempresa.com": "MZ",
  "pedro.pt@tuempresa.com": "PT",
  "pablo.ptb@tuempresa.com": "PTB",
  "sofia.sj@tuempresa.com": "SJ",
  "santiago.sma@tuempresa.com": "SMA",
  "valeria.vn@tuempresa.com": "VN",
  "xavier.xl@tuempresa.com": "XL",
  "zoila.z3@tuempresa.com": "Z3"
};

function getSpreadsheet() {
  if (SPREADSHEET_ID) {
    return SpreadsheetApp.openById(SPREADSHEET_ID);
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

/**
 * Configura la hoja de cálculo inicial si no existe
 */
function setupDatabase() {
  const ss = getSpreadsheet();
  
  // Configurar hoja BD_OPERACIONES
  let sheet = ss.getSheetByName("BD_OPERACIONES");
  if (!sheet) {
    sheet = ss.insertSheet("BD_OPERACIONES");
    // Escribir encabezados
    sheet.appendRow([
      "Fecha", 
      "Codigo", 
      "Tienda", 
      "Tareas_Asignadas", 
      "Tareas_Completadas", 
      "Cumplimiento_Pct", 
      "Estado",
      "Detalle_Tareas"
    ]);
    // Formatear cabecera
    sheet.getRange("A1:H1").setFontWeight("bold").setBackground("#f1f5f9");
  }
  
  // Configurar hoja BD_Historico_Operaciones
  let histSheet = ss.getSheetByName("BD_Historico_Operaciones");
  if (!histSheet) {
    histSheet = ss.insertSheet("BD_Historico_Operaciones");
    histSheet.appendRow([
      "Fecha", 
      "Codigo", 
      "Tienda", 
      "Tareas_Asignadas", 
      "Tareas_Completadas", 
      "Cumplimiento_Pct", 
      "Estado",
      "Detalle_Tareas"
    ]);
    histSheet.getRange("A1:H1").setFontWeight("bold").setBackground("#f1f5f9");
    
    // Insertar registros iniciales de muestra
    let tz = "GMT-6";
    try {
      tz = Session.getScriptTimeZone() || "GMT-6";
    } catch(e) {}
    
    const todayStr = Utilities.formatDate(new Date(), tz, "yyyy-MM-dd");
    const yesterdayStr = Utilities.formatDate(new Date(Date.now() - 86400000), tz, "yyyy-MM-dd");
    
    histSheet.appendRow([yesterdayStr, "CB", "TX.CB", 13, 8, 0.62, "ACEPTABLE", "{}"]);
    histSheet.appendRow([yesterdayStr, "CHM", "TX.CHM", 13, 5, 0.38, "CRÍTICO", "{}"]);
    histSheet.appendRow([yesterdayStr, "CHQ", "TX.CHQ", 13, 11, 0.85, "ÓPTIMO", "{}"]);
    histSheet.appendRow([todayStr, "CB", "TX.CB", 13, 9, 0.69, "ACEPTABLE", "{}"]);
    histSheet.appendRow([todayStr, "CHM", "TX.CHM", 13, 10, 0.77, "ACEPTABLE", "{}"]);
    histSheet.appendRow([todayStr, "CHQ", "TX.CHQ", 13, 3, 0.23, "CRÍTICO", "{}"]);
  }

  // Configurar hoja Prospecciones si no existe
  let prospeccionesSheet = ss.getSheetByName("Prospecciones");
  if (!prospeccionesSheet) {
    prospeccionesSheet = ss.insertSheet("Prospecciones");
    prospeccionesSheet.appendRow([
      "Numeración", 
      "Empresa", 
      "Cliente", 
      "Teléfono", 
      "Email", 
      "Etapa", 
      "Monto", 
      "Fecha",
      "Tienda"
    ]);
    prospeccionesSheet.getRange("A1:I1").setFontWeight("bold").setBackground("#f1f5f9");
  }
  
  return sheet;
}

/**
 * Obtiene los datos de cumplimiento históricos de forma segura
 * filtrados por el rol de usuario del servidor.
 */
function obtenerDatosRendimientoSeguro() {
  const email = Session.getActiveUser().getEmail();
  const rol = USUARIOS_CONFIG[email];
  
  if (!rol) {
    throw new Error("Usuario no autorizado en el sistema.");
  }
  
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName("BD_Historico_Operaciones"); // Hoja de origen de datos
  
  // Garantizar que la base de datos esté configurada
  if (!sheet) {
    setupDatabase();
    sheet = ss.getSheetByName("BD_Historico_Operaciones");
  }
  
  const data = sheet.getDataRange().getValues();
  const registrosFiltrados = [];
  
  // Asumiendo que la Columna 2 (Índice 1) es el Código de la Tienda (ej. "CB")
  for (let i = 1; i < data.length; i++) {
    const fila = data[i];
    const tiendaFila = fila[1]; 
    
    if (rol === "Admin") {
      // El Administrador recibe todos los datos
      registrosFiltrados.push(fila);
    } else if (tiendaFila === rol) {
      // El asesor solo recibe los datos que coinciden exactamente con su tienda
      registrosFiltrados.push(fila);
    }
  }
  
  return {
    rol: rol,
    tienda: rol === "Admin" ? "Todos" : rol,
    datos: registrosFiltrados
  };
}

/**
 * Maneja las peticiones GET (Lectura de datos)
 */
// Mapeo de correos electrónicos de asesores a sus respectivas tiendas (o rol administrador)
const EMAIL_TO_STORE = {
  "admin@trofex.com": "admin",
  "cb@trofex.com": "CB",
  "chm@trofex.com": "CHM",
  "chq@trofex.com": "CHQ",
  "esc@trofex.com": "ESC",
  "hh@trofex.com": "HH",
  "jt@trofex.com": "JT",
  "mz@trofex.com": "MZ",
  "pt@trofex.com": "PT",
  "ptb@trofex.com": "PTB",
  "sj@trofex.com": "SJ",
  "sma@trofex.com": "SMA",
  "vn@trofex.com": "VN",
  "xl@trofex.com": "XL",
  "z3@trofex.com": "Z3"
};

function getStoreCodeFromEmail(email) {
  if (!email) return null;
  const normalizedEmail = email.trim().toLowerCase();
  return EMAIL_TO_STORE[normalizedEmail] || null;
}

/**
 * Maneja las peticiones GET (Lectura de datos con filtrado seguro por rol)
 */
function doGet(e) {
  try {
    setupDatabase();
    
    // 1. Obtener email del usuario activo de la sesión de Google
    let activeEmail = Session.getActiveUser().getEmail();
    
    // Fallback a getEffectiveUser si getActiveUser es vacío
    if (!activeEmail) {
      activeEmail = Session.getEffectiveUser().getEmail();
    }
    
    // Soporte de depuración: permitir simulación vía query parameter si la sesión de Google no devuelve email
    // (Útil para pruebas desde desarrollo local en localhost)
    if (!activeEmail && e && e.parameter && e.parameter.email) {
      activeEmail = e.parameter.email;
    }
    
    // 2. Determinar el rol/tienda asociado al email
    const userStore = getStoreCodeFromEmail(activeEmail);
    
    let isFiltered = false;
    let storeToFilter = "";
    
    if (userStore) {
      if (userStore === "admin") {
        isFiltered = false;
      } else {
        isFiltered = true;
        storeToFilter = userStore;
      }
    } else {
      // Si hay un email pero no está registrado en el mapa, acceso restringido (vacío)
      if (activeEmail) {
        isFiltered = true;
        storeToFilter = "NONE";
      } else {
        // Si no hay email alguno (ej. desarrollo local), mostrar todo para desarrollo fluido
        isFiltered = false;
      }
    }
    
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName("BD_OPERACIONES");
    const data = sheet.getDataRange().getValues();
    
    const headers = data[0];
    const rows = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const storeCodeInRow = row[1]; // Columna 'Codigo'
      
      // Filtrar en el servidor si corresponde
      if (isFiltered && storeCodeInRow !== storeToFilter) {
        continue;
      }
      
      const obj = {};
      headers.forEach((header, index) => {
        let val = row[index];
        // Formatear fechas a string ISO corto
        if (header === "Fecha" && val instanceof Date) {
          val = Utilities.formatDate(val, Session.getScriptTimeZone(), "yyyy-MM-dd");
        } else if (header === "Cumplimiento_Pct") {
          // Convertir decimal de Sheets a porcentaje entero
          val = Math.round(val * 100);
        }
        obj[header] = val;
      });
      rows.push(obj);
    }
    
    // Devolver JSON estructurado
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      emailAccess: activeEmail || "local-guest",
      storeAccess: userStore || "all",
      records: rows
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Maneja las peticiones POST (Escritura y guardado de checklist)
 */
function doPost(e) {
  try {
    setupDatabase();
    const params = JSON.parse(e.postData.contents);
    
    const fecha = params.fecha || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
    const codigo = params.codigo; // ej. "CB"
    const tienda = "TX." + codigo; // ej. "TX.CB"
    const tareasAsignadas = parseInt(params.tareas_asignadas) || 7;
    const tareasCompletadas = parseInt(params.tareas_completadas) || 0;
    const detalleTareas = JSON.stringify(params.detalle_tareas || {});
    
    // Calcular porcentaje de cumplimiento
    const cumplimientoPct = Math.round((tareasCompletadas / tareasAsignadas) * 100);
    // Establecer estado (CRÍTICO si < 80, ÓPTIMO si >= 80)
    const estado = cumplimientoPct >= 80 ? "ÓPTIMO" : "CRÍTICO";
    
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName("BD_OPERACIONES");
    const data = sheet.getDataRange().getValues();
    
    let rowIdx = -1;
    // Buscar si ya existe un registro para esta tienda y esta fecha para sobrescribir
    for (let i = 1; i < data.length; i++) {
      const rFecha = data[i][0] instanceof Date 
        ? Utilities.formatDate(data[i][0], Session.getScriptTimeZone(), "yyyy-MM-dd")
        : String(data[i][0]);
        
      if (rFecha === fecha && data[i][1] === codigo) {
        rowIdx = i + 1; // 1-indexed row number
        break;
      }
    }
    
    if (rowIdx !== -1) {
      // Sobrescribir fila existente
      sheet.getRange(rowIdx, 3).setValue(tienda);
      sheet.getRange(rowIdx, 4).setValue(tareasAsignadas);
      sheet.getRange(rowIdx, 5).setValue(tareasCompletadas);
      sheet.getRange(rowIdx, 6).setValue(cumplimientoPct / 100); // Guardar como decimal para formato porcentaje en Sheets
      sheet.getRange(rowIdx, 7).setValue(estado);
      sheet.getRange(rowIdx, 8).setValue(detalleTareas);
    } else {
      // Append nuevo registro
      sheet.appendRow([
        fecha,
        codigo,
        tienda,
        tareasAsignadas,
        tareasCompletadas,
        cumplimientoPct / 100,
        estado,
        detalleTareas
      ]);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Registro guardado correctamente.",
      cumplimiento_pct: cumplimientoPct,
      estado: estado
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Obtiene los eventos de calendario de forma segura
 * filtrados por el rol de usuario del servidor.
 */
function obtenerEventosCalendario() {
  setupDatabase();
  let email = "";
  try {
    email = Session.getActiveUser().getEmail() || Session.getEffectiveUser().getEmail();
  } catch (e) {
    email = "admin@tuempresa.com"; // Fallback para pruebas locales
  }
  
  const rol = USUARIOS_CONFIG[email] || "Admin";
  
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName("BD_Calendario_Eventos");
  if (!sheet) {
    setupDatabase();
    sheet = ss.getSheetByName("BD_Calendario_Eventos");
  }
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const records = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const tiendaRow = row[6]; // Columna 'Tienda' (index 6)
    const replicadoGlobal = row[8] === true || row[8] === "true" || row[8] === 1; // Columna 'Replicado_Global' (index 8)
    
    const obj = {};
    headers.forEach((header, index) => {
      let val = row[index];
      if (header === "Fecha" && val instanceof Date) {
        val = Utilities.formatDate(val, Session.getScriptTimeZone() || "GMT-6", "yyyy-MM-dd");
      }
      obj[header] = val;
    });
    
    if (rol === "Admin") {
      records.push(obj);
    } else if (tiendaRow === rol || replicadoGlobal) {
      records.push(obj);
    }
  }
  
  return records;
}

/**
 * Guarda un evento de calendario de forma segura.
 * Duplica el evento para las 14 tiendas si es administrador y solicita replicación global.
 */
function guardarEventoCalendario(evento) {
  setupDatabase();
  let email = "";
  try {
    email = Session.getActiveUser().getEmail() || Session.getEffectiveUser().getEmail();
  } catch (e) {
    email = "admin@tuempresa.com"; // Fallback para pruebas locales
  }
  
  const rol = USUARIOS_CONFIG[email] || "Admin";
  
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName("BD_Calendario_Eventos");
  
  const eventId = "E" + Date.now();
  const userTienda = rol === "Admin" ? "Todos" : rol;
  const replicarGlobal = (evento.replicarGlobal === true || evento.replicarGlobal === "true") && rol === "Admin";
  
  const storesToSave = replicarGlobal 
    ? ["CB", "CHM", "CHQ", "ESC", "HH", "JT", "MZ", "PT", "PTB", "SJ", "SMA", "VN", "XL", "Z3"]
    : [userTienda];
  
  storesToSave.forEach(store => {
    sheet.appendRow([
      eventId + "_" + store, // ID Único
      evento.fecha,
      evento.titulo,
      evento.hora,
      evento.prioridad,
      evento.descripcion,
      store,
      email,
      replicarGlobal
    ]);
  });
  
  return { status: "success", eventId: eventId, replicado: replicarGlobal };
}

/**
 * Almacena de forma segura las actividades del cronograma semanal en BD_Historial_Cronograma.
 */
function guardarProgresoCronograma(progreso) {
  setupDatabase();
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName("BD_Historial_Cronograma");
  
  const data = sheet.getDataRange().getValues();
  let rowIdx = -1;
  
  for (let i = 1; i < data.length; i++) {
    const rFecha = data[i][0] instanceof Date 
      ? Utilities.formatDate(data[i][0], Session.getScriptTimeZone() || "GMT-6", "yyyy-MM-dd")
      : String(data[i][0]);
      
    if (rFecha === progreso.fecha && data[i][2] === progreso.codigo) {
      rowIdx = i + 1;
      break;
    }
  }
  
  const rowData = [
    progreso.fecha,
    progreso.diaSemana,
    progreso.codigo,
    parseInt(progreso.tareasAsignadas) || 0,
    parseInt(progreso.tareasCompletadas) || 0,
    parseFloat(progreso.cumplimientoPct) / 100,
    progreso.estado,
    JSON.stringify(progreso.detalleTareas || {})
  ];
  
  if (rowIdx !== -1) {
    for (let col = 1; col <= rowData.length; col++) {
      sheet.getRange(rowIdx, col).setValue(rowData[col - 1]);
    }
  } else {
    sheet.appendRow(rowData);
  }
  
  return { status: "success", message: "Progreso de cronograma registrado exitosamente." };
}

/**
 * Obtiene el rol comercial y el código de tienda a partir del correo activo.
 */
function getUsuarioRolYTienda() {
  let email = "";
  try {
    email = Session.getActiveUser().getEmail() || Session.getEffectiveUser().getEmail();
  } catch (e) {
    email = "";
  }
  
  if (!email) {
    // Fallback restrictivo por seguridad: si no se obtiene email, no dar permisos de Admin
    return { rol: "Vendedor", tienda: "DESCONOCIDO", email: "desconocido" };
  }
  
  const normalizedEmail = email.trim().toLowerCase();
  
  // Buscar en USUARIOS_CONFIG o EMAIL_TO_STORE
  let configVal = USUARIOS_CONFIG[email] || USUARIOS_CONFIG[normalizedEmail] || EMAIL_TO_STORE[normalizedEmail];
  
  // Búsqueda inteligente en la parte local del correo si no está mapeado explícitamente
  if (!configVal) {
    const localPart = normalizedEmail.split('@')[0];
    const parts = localPart.split('.');
    for (const part of parts) {
      const upperPart = part.toUpperCase();
      if (['CB', 'CHM', 'CHQ', 'ESC', 'HH', 'JT', 'MZ', 'PT', 'PTB', 'SJ', 'SMA', 'VN', 'XL', 'Z3'].includes(upperPart)) {
        configVal = upperPart;
        break;
      }
    }
    if (!configVal) {
      const upperLocal = localPart.toUpperCase();
      if (['CB', 'CHM', 'CHQ', 'ESC', 'HH', 'JT', 'MZ', 'PT', 'PTB', 'SJ', 'SMA', 'VN', 'XL', 'Z3'].includes(upperLocal)) {
        configVal = upperLocal;
      }
    }
  }
  
  // Determinar rol final
  if (configVal === "Admin" || configVal === "admin" || normalizedEmail.includes("admin") || normalizedEmail === "admin@trofex.com" || normalizedEmail === "admin@tuempresa.com") {
    return { rol: "Administrador", tienda: "Todos", email: email };
  } else if (configVal) {
    return { rol: "Vendedor", tienda: configVal, email: email };
  }
  
  // Por seguridad crítica de aislamiento, si no coincide con ningún mapeo, tratar como Vendedor restrictivo
  return { rol: "Vendedor", tienda: "DESCONOCIDO", email: email };
}

/**
 * Obtiene todas las prospecciones registradas en la hoja 'Prospecciones' con filtrado de seguridad por rol.
 * Si es Administrador, envía todos los registros. Si es vendedor, filtra por tienda.
 * Retorna un objeto con los datos, el rol y la tienda activa del usuario.
 */
function obtenerProspecciones() {
  setupDatabase();
  const userInfo = getUsuarioRolYTienda();
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName("Prospecciones");
  if (!sheet) return { rol: userInfo.rol, tienda: userInfo.tienda, data: [], resumenGrafica: { Prospectado: 0, Cotizado: 0, Seguimiento: 0, Cerrado: 0 } };
  
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return { rol: userInfo.rol, tienda: userInfo.tienda, data: [], resumenGrafica: { Prospectado: 0, Cotizado: 0, Seguimiento: 0, Cerrado: 0 } };
  
  const headers = data[0];
  const allRecords = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const obj = { id: i + 1 }; // El ID es el número de fila física (1-indexed)
    headers.forEach((header, index) => {
      let val = row[index];
      // Si la fecha es objeto Date, formatear a string ISO corto yyyy-MM-dd
      if (header === "Fecha" && val instanceof Date) {
        val = Utilities.formatDate(val, Session.getScriptTimeZone() || "GMT-6", "yyyy-MM-dd");
      }
      obj[header] = val;
    });
    allRecords.push(obj);
  }
  
  // Lógica de aislamiento estricta en servidor usando filter()
  let filteredData = [];
  if (String(userInfo.rol).trim().toLowerCase() === "administrador") {
    filteredData = allRecords;
  } else {
    // Si es vendedor, solo puede ver las prospecciones de su tienda específica
    const userTiendaLower = (userInfo.tienda || "").trim().toLowerCase();
    if (userTiendaLower && userTiendaLower !== "todos" && userTiendaLower !== "desconocido") {
      filteredData = allRecords.filter(function(record) {
        const recordTiendaLower = (record.Tienda || "").trim().toLowerCase();
        return recordTiendaLower === userTiendaLower;
      });
    } else {
      filteredData = []; // Tienda desconocida o restrictiva: no retorna nada
    }
  }

  // Resumen calculado para alimentar la Gráfica de Cono (Embudo de prospectos)
  const resumenGrafica = {
    Prospectado: 0,
    Cotizado: 0,
    Seguimiento: 0,
    Cerrado: 0
  };

  filteredData.forEach(function(record) {
    const etapa = (record.Etapa || "").trim().toLowerCase();
    if (etapa === "prospectado") {
      resumenGrafica.Prospectado++;
    } else if (etapa === "cotizado") {
      resumenGrafica.Cotizado++;
    } else if (etapa === "seguimiento" || etapa === "contactado") {
      resumenGrafica.Seguimiento++;
    } else if (etapa === "cerrado") {
      resumenGrafica.Cerrado++;
    }
  });
  
  return {
    rol: userInfo.rol,
    tienda: userInfo.tienda,
    data: filteredData,
    resumenGrafica: resumenGrafica
  };
}

/**
 * Agrega una nueva prospección a la hoja 'Prospecciones'.
 * Bloquea la acción si la intenta realizar un Administrador, ya que solo los vendedores agregan datos.
 */
function agregarProspeccion(prospecto) {
  try {
    setupDatabase();
    const userInfo = getUsuarioRolYTienda();
    
    if (String(userInfo.rol).trim().toLowerCase() === "administrador") {
      throw new Error("Permiso denegado. El Administrador no agrega nuevas prospecciones.");
    }
    
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName("Prospecciones");
    if (!sheet) throw new Error("La hoja 'Prospecciones' no existe.");
    
    // Validaciones básicas en el servidor
    if (!prospecto.empresa || !prospecto.cliente || !prospecto.etapa) {
      throw new Error("Faltan campos obligatorios para guardar la prospección.");
    }
    
    // Inyectar automáticamente la fecha actual del servidor en la zona horaria indicada
    const fechaServidor = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || "GMT-6", "yyyy-MM-dd");
    
    // Si la etapa no es Cotizado, el monto es 0 por seguridad
    const montoFinal = (String(prospecto.etapa).trim().toLowerCase() === "cotizado") ? (parseFloat(prospecto.monto) || 0) : 0;
    
    // Insertar nueva fila al final
    sheet.appendRow([
      "=ROW()-1", // Numeración automática basada en fila
      prospecto.empresa,
      prospecto.cliente,
      prospecto.telefono || "",
      prospecto.email || "",
      prospecto.etapa,
      montoFinal,
      fechaServidor, // Fecha automática del servidor
      userInfo.tienda // Sucursal automática del usuario
    ]);
    
    return {
      status: "success",
      message: "Guardado exitoso.",
      response: obtenerProspecciones()
    };
  } catch (e) {
    return {
      status: "error",
      message: "Error al guardar: " + e.toString()
    };
  }
}

/**
 * Sobrescribe una prospección existente identificada por su ID (número de fila).
 * Si es Administrador, edita pero preserva intacta la tienda original.
 */
function editarProspeccion(id, prospecto) {
  try {
    setupDatabase();
    const userInfo = getUsuarioRolYTienda();
    const rowNum = parseInt(id);
    if (isNaN(rowNum) || rowNum < 2) {
      throw new Error("ID de prospección inválido.");
    }
    
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName("Prospecciones");
    if (!sheet) throw new Error("La hoja 'Prospecciones' no existe.");
    
    // Validar propiedad de la tienda original
    const originalTienda = String(sheet.getRange(rowNum, 9).getValue()).trim();
    if (String(userInfo.rol).trim().toLowerCase() !== "administrador" && originalTienda !== userInfo.tienda) {
      throw new Error("No tienes permisos para editar esta prospección.");
    }
    
    // Validaciones básicas en el servidor
    if (!prospecto.empresa || !prospecto.cliente || !prospecto.etapa) {
      throw new Error("Faltan campos obligatorios para actualizar la prospección.");
    }
    
    // Si la etapa no es Cotizado, forzar monto a 0 por seguridad
    const montoFinal = (String(prospecto.etapa).trim().toLowerCase() === "cotizado") ? (parseFloat(prospecto.monto) || 0) : 0;
    
    // Sobrescribir los datos de la fila (de la columna 2 a la 8 para mantener la numeración en col 1 y la tienda en col 9)
    const values = [[
      prospecto.empresa,
      prospecto.cliente,
      prospecto.telefono || "",
      prospecto.email || "",
      prospecto.etapa,
      montoFinal,
      prospecto.fecha // Preservar la fecha original que está bloqueada
    ]];
    
    sheet.getRange(rowNum, 2, 1, 7).setValues(values);
    
    return {
      status: "success",
      message: "Guardado exitoso.",
      response: obtenerProspecciones()
    };
  } catch (e) {
    return {
      status: "error",
      message: "Error al guardar: " + e.toString()
    };
  }
}

/**
 * Elimina una prospección de la hoja 'Prospecciones' dado su ID (número de fila).
 * Seguridad estricta: Bloquea la acción si el usuario no es Administrador.
 */
function eliminarProspeccion(id) {
  try {
    setupDatabase();
    const userInfo = getUsuarioRolYTienda();
    
    // Bloquear si el rol no es Administrador (Seguridad crítica del servidor)
    if (String(userInfo.rol).trim().toLowerCase() !== "administrador") {
      throw new Error("Permiso denegado. Solo el Administrador tiene autorización para eliminar en la base de datos.");
    }
    
    const rowNum = parseInt(id);
    if (isNaN(rowNum) || rowNum < 2) {
      throw new Error("ID de prospección inválido.");
    }
    
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName("Prospecciones");
    if (!sheet) throw new Error("La hoja 'Prospecciones' no existe.");
    
    sheet.deleteRow(rowNum);
    
    return {
      status: "success",
      message: "Eliminado correctamente.",
      response: obtenerProspecciones()
    };
  } catch (e) {
    return {
      status: "error",
      message: "Error: " + e.toString()
    };
  }
}

/**
 * INSTRUCCIONES DE CONFIGURACIÓN Y DESPLIEGUE EN GOOGLE APPS SCRIPT:
 * =================================================================
 * Para asegurar una auditoría clara y registrar qué asesor (CB, CHQ, JT, etc.) realiza cada cambio:
 * 
 * 1. En el editor de Google Apps Script, haz clic en "Implementar" (Deploy) > "Nueva implementación" (New deployment).
 * 2. Selecciona el tipo de implementación "Aplicación web" (Web app) haciendo clic en el engranaje.
 * 3. En la configuración:
 *    - Ejecutar como (Execute as): Selecciona "El usuario que accede a la aplicación web" (User accessing the web app).
 *    - Quién tiene acceso (Who has access): Selecciona "Cualquiera con cuenta de Google" (Anyone with Google account).
 * 4. Haz clic en "Implementar".
 * 5. Google solicitará otorgar permisos de acceso a la hoja de cálculo.
 * 
 * Al ejecutar la aplicación de esta manera:
 * - Cada llamada a `google.script.run` se ejecutará utilizando la identidad de Google del usuario logueado en su navegador.
 * - En el historial de revisiones de Google Sheets, cada celda modificada o fila agregada mostrará el correo
 *   electrónico real del vendedor que realizó la acción, en lugar de la cuenta del creador/desarrollador.
 * 
 * ACTUALIZACIÓN OBLIGATORIA DEL LINK DE PRODUCCIÓN:
 * Para actualizar tu URL pública y aplicar los cambios del backend, haz clic en Implementar > Gestionar implementaciones,
 * edita el despliegue actual con el ícono del lápiz, selecciona "Nueva versión" y haz clic en Implementar.
 */

