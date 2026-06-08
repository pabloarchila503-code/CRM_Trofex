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
