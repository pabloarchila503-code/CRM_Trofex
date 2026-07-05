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

// ============================================================
// MÓDULO: VALES DE ARTE (Diseño <-> Tiendas)
// ============================================================
// IDs de las carpetas raíz de Drive donde viven las subcarpetas de cada tienda.
// IMPORTANTE: reemplaza VALES_DESCARGA_FOLDER_ID por el ID real de tu carpeta
// "Vales de Descarga" (el enlace que compartiste apuntaba a la misma carpeta
// que "Vales de Carga", así que por ahora es un valor de ejemplo).
const VALES_CARGA_FOLDER_ID = "1biBNC5T018q_2AYMFixiiAdxsYK_g72Z";
const VALES_DESCARGA_FOLDER_ID = "PEGA_AQUI_EL_ID_REAL_DE_VALES_DE_DESCARGA";

// Catálogos fijos usados por el frontend
const VALES_PRODUCTOS = ["Medalla Fundida", "Pin Fundido", "Plasma Metal", "Vidrio", "Fotograbado", "Producto especial", "Protextil"];
const VALES_PROCESOS = ["en tiempo", "tarde", "Entregado"];

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

  // Configurar hoja Prospecciones si no existe o si tiene el formato viejo
  let prospeccionesSheet = ss.getSheetByName("Prospecciones");
  let needsRecreate = false;
  if (prospeccionesSheet) {
    // Verificar si tiene el formato viejo (ej. si la segunda columna no es "Mes")
    if (prospeccionesSheet.getLastColumn() > 0) {
      const col2Header = prospeccionesSheet.getRange(1, 2).getValue();
      if (col2Header !== "Mes") {
        needsRecreate = true;
      }
    }
  } else {
    needsRecreate = true;
  }

  if (needsRecreate) {
    if (prospeccionesSheet) {
      try {
        ss.deleteSheet(prospeccionesSheet);
      } catch (e) {
        // En caso de que sea la única hoja, limpiarla en su lugar
        prospeccionesSheet.clear();
      }
    }
    prospeccionesSheet = ss.getSheetByName("Prospecciones") || ss.insertSheet("Prospecciones");
    const headers = ["Numeración", "Mes", "Tienda", "Prospectados", "Contactados", "Cotizados", "Cerrados", "Perdidos"];
    prospeccionesSheet.appendRow(headers);
    prospeccionesSheet.getRange("A1:H1").setFontWeight("bold").setBackground("#f1f5f9");
    
    // Pre-sembrar datos de prueba realistas para 14 tiendas y 12 meses (168 filas)
    const stores = ['CB', 'CHM', 'CHQ', 'ESC', 'HH', 'JT', 'MZ', 'PT', 'PTB', 'SJ', 'SMA', 'VN', 'XL', 'Z3'];
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const rows = [];
    let num = 1;
    
    for (let s = 0; s < stores.length; s++) {
      const store = stores[s];
      for (let m = 0; m < months.length; m++) {
        const month = months[m];
        
        // Generar valores determinísticos/aleatorios agradables
        const seed = (s * 12 + m) * 31;
        const prospectados = 20 + (seed % 30);
        const contactados = Math.floor(prospectados * 0.75);
        const cotizados = Math.floor(contactados * 0.6);
        const cerrados = Math.floor(cotizados * 0.5) + 1;
        const perdidos = Math.floor((prospectados - cerrados) * 0.25);
        
        rows.push([num++, month, store, prospectados, contactados, cotizados, cerrados, perdidos]);
      }
    }
    
    prospeccionesSheet.getRange(2, 1, rows.length, 8).setValues(rows);
  }

  // Configurar hoja Analisis8020 si no existe
  let analisisSheet = ss.getSheetByName("Analisis8020");
  if (!analisisSheet) {
    analisisSheet = ss.insertSheet("Analisis8020");
    analisisSheet.appendRow([
      "Numeración", 
      "Orden", 
      "Cliente", 
      "Total", 
      "Etapa", 
      "Tienda", 
      "Fecha"
    ]);
    analisisSheet.getRange("A1:G1").setFontWeight("bold").setBackground("#f1f5f9");
  }
  
  return sheet;
}

/**
 * Crea la hoja 'Vales' si no existe, con sus encabezados.
 */
function setupValesSheet() {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName("Vales");
  if (!sheet) {
    sheet = ss.insertSheet("Vales");
    sheet.appendRow([
      "No", "Tienda", "NoVale", "Producto", "FechaIngreso", "FechaSalida",
      "Proceso", "ArchivoCargaUrl", "ArchivoCargaId", "ArchivoDescargaUrl", "ArchivoDescargaId"
    ]);
    sheet.getRange("A1:K1").setFontWeight("bold").setBackground("#f1f5f9");
  }
  return sheet;
}

/**
 * Busca (o crea si no existe) la subcarpeta de una tienda dentro de una
 * carpeta padre de Drive (Vales de Carga o Vales de Descarga).
 */
function getOrCreateStoreSubfolder_(parentFolderId, storeCode) {
  const parent = DriveApp.getFolderById(parentFolderId);
  const existing = parent.getFoldersByName(storeCode);
  if (existing.hasNext()) {
    return existing.next();
  }
  return parent.createFolder(storeCode);
}

/**
 * Devuelve el listado de Vales, filtrado por rol:
 * - Admin y Diseño ven todos los vales.
 * - Una tienda solo ve los vales que ella misma solicitó.
 */
function obtenerVales(rol, tienda) {
  const sheet = setupValesSheet();
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const all = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const obj = {};
    headers.forEach((h, idx) => {
      let v = row[idx];
      if ((h === "FechaIngreso" || h === "FechaSalida") && v instanceof Date) {
        v = Utilities.formatDate(v, Session.getScriptTimeZone() || "GMT-6", "yyyy-MM-dd");
      }
      obj[h] = v;
    });
    all.push(obj);
  }

  const rolNorm = String(rol || "").trim().toLowerCase();
  if (rolNorm === "admin" || rolNorm === "diseno" || rolNorm === "diseño") {
    return { status: "success", productos: VALES_PRODUCTOS, procesos: VALES_PROCESOS, datos: all };
  }

  const tiendaNorm = String(tienda || "").trim().toUpperCase();
  const filtrados = all.filter(v => String(v.Tienda || "").trim().toUpperCase() === tiendaNorm);
  return { status: "success", productos: VALES_PRODUCTOS, procesos: VALES_PROCESOS, datos: filtrados };
}

/**
 * Crea un nuevo Vale de Arte solicitado por una tienda (o por el Admin/Diseño en su nombre).
 */
function crearVale(datos) {
  try {
    const sheet = setupValesSheet();
    const lastRow = sheet.getLastRow();
    const numero = lastRow; // fila 1 es encabezado, así que lastRow ya es el consecutivo correcto
    const noVale = "VAL-" + String(numero).padStart(3, "0");
    const tz = Session.getScriptTimeZone() || "GMT-6";
    const fechaIngreso = datos.fechaIngreso || Utilities.formatDate(new Date(), tz, "yyyy-MM-dd");

    sheet.appendRow([
      numero,
      datos.tienda,
      noVale,
      datos.producto,
      fechaIngreso,
      datos.fechaSalida || "",
      "en tiempo",
      "", "", "", ""
    ]);

    return { status: "success", message: "Vale " + noVale + " creado correctamente.", noVale: noVale };
  } catch (e) {
    return { status: "error", message: e.toString() };
  }
}

/**
 * Actualiza el estado de Proceso de un vale (en tiempo / tarde / Entregado).
 */
function actualizarProcesoVale(noVale, proceso) {
  try {
    const sheet = setupValesSheet();
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const colNoVale = headers.indexOf("NoVale");
    const colProceso = headers.indexOf("Proceso") + 1;

    for (let i = 1; i < data.length; i++) {
      if (String(data[i][colNoVale]).trim() === String(noVale).trim()) {
        sheet.getRange(i + 1, colProceso).setValue(proceso);
        return { status: "success", message: "Proceso actualizado." };
      }
    }
    return { status: "error", message: "Vale no encontrado: " + noVale };
  } catch (e) {
    return { status: "error", message: e.toString() };
  }
}

/**
 * Sube un archivo real a Google Drive dentro de la subcarpeta de la tienda
 * correspondiente (dentro de "Vales de Carga" o "Vales de Descarga"),
 * y guarda el link resultante en la hoja 'Vales'.
 *
 * datos = { noVale, tipo: 'carga'|'descarga', base64, mimeType, fileName }
 */
function subirArchivoVale(datos) {
  try {
    const noVale = datos.noVale;
    const tipo = datos.tipo === "descarga" ? "descarga" : "carga";
    const base64Data = datos.base64;
    const mimeType = datos.mimeType || "application/octet-stream";
    const fileName = datos.fileName || ("vale_" + noVale);

    if (!base64Data) throw new Error("No se recibió el contenido del archivo.");

    const sheet = setupValesSheet();
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const colNoVale = headers.indexOf("NoVale");
    const colTienda = headers.indexOf("Tienda");

    let rowIdx = -1;
    let tienda = "";
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][colNoVale]).trim() === String(noVale).trim()) {
        rowIdx = i + 1; // fila física 1-indexed
        tienda = data[i][colTienda];
        break;
      }
    }
    if (rowIdx === -1) throw new Error("Vale no encontrado: " + noVale);

    const parentFolderId = tipo === "carga" ? VALES_CARGA_FOLDER_ID : VALES_DESCARGA_FOLDER_ID;
    const subfolder = getOrCreateStoreSubfolder_(parentFolderId, tienda);

    const bytes = Utilities.base64Decode(base64Data);
    const blob = Utilities.newBlob(bytes, mimeType, fileName);
    const file = subfolder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    const url = file.getUrl();

    const urlCol = headers.indexOf(tipo === "carga" ? "ArchivoCargaUrl" : "ArchivoDescargaUrl") + 1;
    const idCol = headers.indexOf(tipo === "carga" ? "ArchivoCargaId" : "ArchivoDescargaId") + 1;
    sheet.getRange(rowIdx, urlCol).setValue(url);
    sheet.getRange(rowIdx, idCol).setValue(file.getId());

    return {
      status: "success",
      message: "Archivo \"" + fileName + "\" subido correctamente a Vales de " + (tipo === "carga" ? "Carga" : "Descarga") + "/" + tienda,
      url: url,
      fileId: file.getId()
    };
  } catch (e) {
    return { status: "error", message: e.toString() };
  }
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

    // Ruteo para el módulo de Vales de Arte (?action=vales&rol=...&tienda=...)
    if (e && e.parameter && e.parameter.action === "vales") {
      const resultado = obtenerVales(e.parameter.rol, e.parameter.tienda);
      return ContentService.createTextOutput(JSON.stringify(resultado))
        .setMimeType(ContentService.MimeType.JSON);
    }

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

    // Ruteo para el módulo de Vales de Arte
    if (params.action === "crearVale") {
      return ContentService.createTextOutput(JSON.stringify(crearVale(params.datos)))
        .setMimeType(ContentService.MimeType.JSON);
    }
    if (params.action === "actualizarProcesoVale") {
      return ContentService.createTextOutput(JSON.stringify(actualizarProcesoVale(params.noVale, params.proceso)))
        .setMimeType(ContentService.MimeType.JSON);
    }
    if (params.action === "subirArchivoVale") {
      return ContentService.createTextOutput(JSON.stringify(subirArchivoVale(params.datos)))
        .setMimeType(ContentService.MimeType.JSON);
    }

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
  if (!sheet) return { rol: userInfo.rol, tienda: userInfo.tienda, data: [] };
  
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return { rol: userInfo.rol, tienda: userInfo.tienda, data: [] };
  
  const headers = data[0];
  const allRecords = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const obj = { id: i + 1 }; // Fila física (1-indexed)
    headers.forEach((header, index) => {
      obj[header] = row[index];
    });
    allRecords.push(obj);
  }
  
  let filteredData = [];
  if (String(userInfo.rol).trim().toLowerCase() === "administrador") {
    filteredData = allRecords;
  } else {
    const userTiendaLower = (userInfo.tienda || "").trim().toLowerCase();
    if (userTiendaLower && userTiendaLower !== "todos" && userTiendaLower !== "desconocido") {
      filteredData = allRecords.filter(function(record) {
        const recordTiendaLower = (record.Tienda || "").trim().toLowerCase();
        return recordTiendaLower === userTiendaLower;
      });
    } else {
      filteredData = [];
    }
  }
  
  return {
    rol: userInfo.rol,
    tienda: userInfo.tienda,
    data: filteredData,
    datos: filteredData
  };
}

/**
 * Guarda o actualiza los totales mensuales agregados de una sucursal.
 * Seguridad crítica: Si el usuario es vendedor, se ignora la tienda enviada por el cliente y se fuerza la suya.
 */
function guardarValoresMensuales(datos) {
  try {
    setupDatabase();
    const userInfo = getUsuarioRolYTienda();
    
    let tiendaFinal = datos.tienda;
    if (String(userInfo.rol).trim().toLowerCase() !== "administrador") {
      // Forzar tienda asignada por seguridad
      tiendaFinal = userInfo.tienda;
    }
    
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName("Prospecciones");
    if (!sheet) throw new Error("La hoja 'Prospecciones' no existe.");
    
    const mesTarget = String(datos.mes).trim();
    const storeTarget = String(tiendaFinal).trim();
    
    const sheetData = sheet.getDataRange().getValues();
    let rowIdx = -1;
    
    // Buscar la fila correspondiente a esta sucursal y mes
    for (let i = 1; i < sheetData.length; i++) {
      const rowMes = String(sheetData[i][1]).trim(); // Columna Mes
      const rowTienda = String(sheetData[i][2]).trim(); // Columna Tienda
      if (rowMes.toLowerCase() === mesTarget.toLowerCase() && rowTienda.toLowerCase() === storeTarget.toLowerCase()) {
        rowIdx = i + 1; // Fila física (1-indexed)
        break;
      }
    }
    
    const prospectados = parseInt(datos.prospectados) || 0;
    const contactados = parseInt(datos.contactados) || 0;
    const cotizados = parseInt(datos.cotizados) || 0;
    const cerrados = parseInt(datos.cerrados) || 0;
    const perdidos = parseInt(datos.perdidos) || 0;
    
    if (rowIdx !== -1) {
      // Actualizar fila existente (Mes, Tienda, Prospectados, Contactados, Cotizados, Cerrados, Perdidos)
      sheet.getRange(rowIdx, 2, 1, 7).setValues([[
        mesTarget,
        storeTarget,
        prospectados,
        contactados,
        cotizados,
        cerrados,
        perdidos
      ]]);
    } else {
      // Si por alguna razón no existía la fila, se agrega
      const nextNum = sheet.getLastRow();
      sheet.appendRow([
        nextNum,
        mesTarget,
        storeTarget,
        prospectados,
        contactados,
        cotizados,
        cerrados,
        perdidos
      ]);
    }
    
    return {
      status: "success",
      message: "Totales mensuales guardados con éxito.",
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
 *
 * NOTA ESPECÍFICA PARA EL MÓDULO DE VALES DE ARTE (subida real a Drive):
 * Como la app se usa vía GitHub Pages (fuera de google.com), el módulo de Vales llama
 * a este backend con fetch() normal (no con google.script.run). Para que la subida real
 * de archivos a Drive funcione para TODAS las tiendas (que no tienen sesión de Google propia),
 * este despliegue debe configurarse como:
 *   - Ejecutar como (Execute as): "Yo" (tu propia cuenta, la dueña de las carpetas de Drive).
 *   - Quién tiene acceso (Who has access): "Cualquier usuario" (Anyone).
 * Así el script sube los archivos usando TU permiso de Drive, sin pedirle login de Google a cada tienda.
 * No olvides reemplazar VALES_DESCARGA_FOLDER_ID (arriba en este archivo) por el ID real de tu carpeta.
 */

/**
 * Obtiene todos los registros del Análisis 80/20.
 * Aislamiento estricto: el Admin recibe todo, las tiendas solo sus propios registros.
 */
function obtenerDatos8020() {
  setupDatabase();
  const userInfo = getUsuarioRolYTienda();
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName("Analisis8020");
  if (!sheet) return { rol: userInfo.rol, tienda: userInfo.tienda, datos: [] };
  
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return { rol: userInfo.rol, tienda: userInfo.tienda, datos: [] };
  
  const headers = data[0];
  const allRecords = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const obj = { id: i + 1 }; // ID es la fila física (1-indexed)
    headers.forEach((header, index) => {
      let val = row[index];
      if (header === "Fecha" && val instanceof Date) {
        val = Utilities.formatDate(val, Session.getScriptTimeZone() || "GMT-6", "yyyy-MM-dd");
      }
      obj[header] = val;
    });
    allRecords.push(obj);
  }
  
  let filteredData = [];
  if (String(userInfo.rol).trim().toLowerCase() === "administrador") {
    filteredData = allRecords;
  } else {
    const userTiendaLower = (userInfo.tienda || "").trim().toLowerCase();
    if (userTiendaLower && userTiendaLower !== "todos" && userTiendaLower !== "desconocido") {
      filteredData = allRecords.filter(function(record) {
        const recordTiendaLower = (record.Tienda || "").trim().toLowerCase();
        return recordTiendaLower === userTiendaLower;
      });
    } else {
      filteredData = [];
    }
  }
  
  return {
    rol: userInfo.rol,
    tienda: userInfo.tienda,
    datos: filteredData
  };
}

/**
 * Agrega un registro de venta a la hoja 'Analisis8020'.
 * Solo las tiendas (vendedores) pueden realizar esta acción.
 */
function guardarRegistro8020(registro) {
  try {
    setupDatabase();
    const userInfo = getUsuarioRolYTienda();
    
    if (String(userInfo.rol).trim().toLowerCase() === "administrador") {
      throw new Error("Permiso denegado. El Administrador no puede agregar nuevos registros.");
    }
    
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName("Analisis8020");
    if (!sheet) throw new Error("La hoja 'Analisis8020' no existe.");
    
    if (!registro.orden || !registro.cliente || !registro.total || !registro.etapa) {
      throw new Error("Faltan campos obligatorios para guardar el registro.");
    }
    
    const fechaServidor = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || "GMT-6", "yyyy-MM-dd");
    
    sheet.appendRow([
      "=ROW()-1", // Numeración
      registro.orden,
      registro.cliente,
      parseFloat(registro.total) || 0,
      registro.etapa,
      userInfo.tienda,
      fechaServidor
    ]);
    
    return {
      status: "success",
      message: "Registro guardado exitosamente.",
      response: obtenerDatos8020()
    };
  } catch (e) {
    return {
      status: "error",
      message: e.toString()
    };
  }
}

/**
 * Modifica un registro de venta en la hoja 'Analisis8020'.
 * Las tiendas solo pueden modificar sus propios registros.
 */
function editarRegistro8020(id, registro) {
  try {
    setupDatabase();
    const userInfo = getUsuarioRolYTienda();
    const rowNum = parseInt(id);
    if (isNaN(rowNum) || rowNum < 2) {
      throw new Error("ID de registro inválido.");
    }
    
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName("Analisis8020");
    if (!sheet) throw new Error("La hoja 'Analisis8020' no existe.");
    
    const originalTienda = String(sheet.getRange(rowNum, 6).getValue()).trim(); // Columna Tienda (index 6)
    if (String(userInfo.rol).trim().toLowerCase() !== "administrador" && originalTienda !== userInfo.tienda) {
      throw new Error("No tienes permisos para editar este registro.");
    }
    
    if (!registro.orden || !registro.cliente || !registro.total || !registro.etapa) {
      throw new Error("Faltan campos obligatorios para actualizar el registro.");
    }
    
    // Columnas a sobrescribir: Orden, Cliente, Total, Etapa (Columnas 2 a 5)
    sheet.getRange(rowNum, 2).setValue(registro.orden);
    sheet.getRange(rowNum, 3).setValue(registro.cliente);
    sheet.getRange(rowNum, 4).setValue(parseFloat(registro.total) || 0);
    sheet.getRange(rowNum, 5).setValue(registro.etapa);
    
    return {
      status: "success",
      message: "Registro actualizado con éxito.",
      response: obtenerDatos8020()
    };
  } catch (e) {
    return {
      status: "error",
      message: e.toString()
    };
  }
}
