// ============================================================
// MÓDULO: VALES DE ARTE (Diseño <-> Tiendas) - CONFIGURACIÓN
// ============================================================
const VALES_CARGA_FOLDER_ID = "1biBNC5T018q_2AYMFixiiAdxsYK_g72Z";
const VALES_DESCARGA_FOLDER_ID = "1AEgVPJKB2vvU-XGtsb768BfnvOr5g7nh";
const VALES_PRODUCTOS = ["Medalla Fundida", "Pin Fundido", "Plasma Metal", "Vidrio", "Fotograbado", "Producto especial", "Protextil"];
const VALES_PROCESOS = ["en tiempo", "tarde", "Entregado", "Modificación 1", "Modificación 2", "Modificación 3", "Autorizado", "Congelado"];

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  try {
    let params;
    // Primero verificar si hay un payload codificado
    if (e.parameter && e.parameter.payload) {
      try {
        params = JSON.parse(e.parameter.payload);
      } catch (err) {
        params = e.parameter;
      }
    } else if (e.postData && e.postData.contents) {
      try {
        params = JSON.parse(e.postData.contents);
      } catch (err) {
        params = e.parameter;
      }
    } else {
      params = e.parameter;
    }

    const action = params.action || params.type;
    let result = { status: 'error', message: 'Acción no reconocida' };

    if (action === 'getData' || action === 'obtener_datos') {
      result = getInitialData();
    } else if (action === 'login') {
      result = handleLogin(params);
    } else if (action === 'saveManualData') {
      result = handleSaveManualData(params);
    } else if (action === 'uploadExcel') {
      result = handleExcelUpload(params);
    } 
    // 👇👇 LÓGICA DE GOOGLE DRIVE (GENERAL) 👇👇
    else if (action === 'uploadFile') {
      var folderName = params.folderName;
      var fileName = params.fileName;
      var mimeType = params.mimeType;
      var fileData = params.fileData; // Archivo en base64
      
      var mainFolderId = '18_lVSz2vKLXr1p8FXAOW28N4y2ojxq98'; 
      var mainFolder = DriveApp.getFolderById(mainFolderId);
      
      var subFolders = mainFolder.getFoldersByName(folderName);
      var targetFolder;
      if (subFolders.hasNext()) {
        targetFolder = subFolders.next();
      } else {
        targetFolder = mainFolder.createFolder(folderName);
      }
      
      var decodedData = Utilities.base64Decode(fileData);
      var blob = Utilities.newBlob(decodedData, mimeType, fileName);
      var newFile = targetFolder.createFile(blob);
      
      result = { status: 'success', fileUrl: newFile.getUrl() };
    }
    // 👇👇 LÓGICA DE VALES DE ARTE 👇👇
    else if (action === 'vales') {
      result = obtenerVales(params.rol, params.tienda);
    } else if (action === 'crearVale') {
      result = crearVale(params.datos);
    } else if (action === 'actualizarProcesoVale') {
      result = actualizarProcesoVale(params.noVale, params.proceso);
    } else if (action === 'editarVale') {
      result = editarVale(params.noVale, params.proceso, params.fechaSalida);
    } else if (action === 'eliminarVale') {
      result = eliminarVale(params.noVale);
    } else if (action === 'solicitarModificacion') {
      result = solicitarModificacion(params.noVale);
    } else if (action === 'subirArchivoVale') {
      result = subirArchivoVale(params.datos);
    } else if (action === 'saveCalendarEvent') {
      result = saveCalendarEvent(params.datos);
    } else if (action === 'getCalendarEvents') {
      result = getCalendarEvents();
    } else if (action === 'saveNotification') {
      result = saveNotification(params.datos);
    } else if (action === 'getNotifications') {
      result = getNotifications();
    } else if (action === 'subirArchivoOrden') {
      result = subirArchivoOrden(params.datos);
    } else if (action === 'saveOrden') {
      result = saveOrden(params.datos);
    } else if (action === 'getOrdenes') {
      result = getOrdenes();
    } else if (action === 'eliminarOrden') {
      result = eliminarOrden(params.noOrden);
    } else if (action === 'updateOrdenEstado') {
      result = updateOrdenEstado(params.noOrden, params.estado);
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ──────────────────────────────────────────────
// OBTENER TODOS LOS DATOS (getData)
// ──────────────────────────────────────────────
function getInitialData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Leer Prospecciones
  const prospeccionesSheet = ss.getSheetByName('Prospecciones');
  let prospecciones = [];
  if (prospeccionesSheet) {
    const data = prospeccionesSheet.getDataRange().getValues();
    if (data.length > 1) {
      const headers = data[0];
      for (let i = 1; i < data.length; i++) {
        let row = {};
        for (let j = 0; j < headers.length; j++) {
          row[headers[j]] = data[i][j];
        }
        prospecciones.push(row);
      }
    }
  }

  // Leer Deals
  const dealsSheet = ss.getSheetByName('Deals');
  let deals = [];
  if (dealsSheet) {
    const data = dealsSheet.getDataRange().getValues();
    if (data.length > 1) {
      const headers = data[0];
      for (let i = 1; i < data.length; i++) {
        let row = {};
        for (let j = 0; j < headers.length; j++) {
          row[headers[j]] = data[i][j];
        }
        deals.push(row);
      }
    }
  }

  // Leer Ventas y Metas (Reconstruir Array de 12 meses)
  const ventasMetasSheet = ss.getSheetByName('Ventas_Metas');
  let ventasMetas = [];
  
  const TIENDAS = ['CB', 'CHM', 'CHQ', 'ESC', 'HH', 'JT', 'MZ', 'PT', 'PTB', 'SJ', 'SMA', 'VN', 'XL', 'Z3'];
  for (let i = 0; i < 12; i++) {
    ventasMetas.push(TIENDAS.map(t => ({ store: t, venta: 0, meta: 0 })));
  }

  if (ventasMetasSheet) {
    const data = ventasMetasSheet.getDataRange().getValues();
    if (data.length > 1) {
      for (let i = 1; i < data.length; i++) {
        let monthIdx = parseInt(data[i][0]);
        let tienda = data[i][1];
        let venta = parseFloat(data[i][2]);
        let meta = parseFloat(data[i][3]);

        if (!isNaN(monthIdx) && monthIdx >= 0 && monthIdx < 12) {
          let storeObj = ventasMetas[monthIdx].find(s => s.store === tienda);
          if (storeObj) {
            storeObj.venta = venta;
            storeObj.meta = meta;
          } else {
            ventasMetas[monthIdx].push({ store: tienda, venta: venta, meta: meta });
          }
        }
      }
    }
  }

  // Leer Analisis8020
  const analisis8020Sheet = ss.getSheetByName('Analisis8020');
  let analisis8020 = [];
  if (analisis8020Sheet) {
    const data = analisis8020Sheet.getDataRange().getValues();
    if (data.length > 1) {
      const headers = data[0];
      for (let i = 1; i < data.length; i++) {
        let row = {};
        for (let j = 0; j < headers.length; j++) {
          row[headers[j]] = data[i][j];
        }
        analisis8020.push(row);
      }
    }
  }

  // Leer Proyecto
  const proyectoSheet = ss.getSheetByName('Proyecto');
  let proyecto = [];
  if (proyectoSheet) {
    const data = proyectoSheet.getDataRange().getValues();
    if (data.length > 1) {
      const headers = data[0];
      for (let i = 1; i < data.length; i++) {
        let row = {};
        for (let j = 0; j < headers.length; j++) {
          row[headers[j]] = data[i][j];
        }
        proyecto.push(row);
      }
    }
  }

  // Leer Carreras
  const carrerasSheet = ss.getSheetByName('Carreras');
  let carreras = [];
  if (carrerasSheet) {
    const data = carrerasSheet.getDataRange().getValues();
    if (data.length > 1) {
      const headers = data[0];
      for (let i = 1; i < data.length; i++) {
        let row = {};
        for (let j = 0; j < headers.length; j++) {
          row[headers[j]] = data[i][j];
        }
        carreras.push(row);
      }
    }
  }

  // Leer Tendencias_Data
  const tendenciasSheet = ss.getSheetByName('Tendencias_Data');
  let tendenciasData = [];
  if (tendenciasSheet) {
    const data = tendenciasSheet.getDataRange().getValues();
    if (data.length > 1) {
      const headers = data[0];
      for (let i = 1; i < data.length; i++) {
        let row = {};
        for (let j = 0; j < headers.length; j++) {
          row[headers[j]] = data[i][j];
        }
        // Validar que la fila no esté vacía
        if (row[headers[0]] !== "") {
          tendenciasData.push(row);
        }
      }
    }
  }

  return {
    status: 'success',
    prospecciones: prospecciones,
    deals: deals,
    ventas_metas: ventasMetas,
    analisis8020: analisis8020,
    proyecto: proyecto,
    carreras: carreras,
    tendencias: tendenciasData
  };
}

// ──────────────────────────────────────────────
// INICIO DE SESIÓN
// ──────────────────────────────────────────────
function handleLogin(params) {
  const email = params.email;
  const password = params.password;

  if (!email || !password) {
    return { status: 'error', message: 'Faltan credenciales' };
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Usuarios');
  if (!sheet) return { status: 'error', message: 'No se encontró la hoja Usuarios' };

  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    let rowEmail = data[i][0]; // Col A: Email
    let rowPass = data[i][1];  // Col B: Password
    let rowRole = data[i][2];  // Col C: Role
    let rowStore = data[i][3]; // Col D: Store
    let rowName = data[i][4];  // Col E: Nombre

    if (String(rowEmail).trim().toLowerCase() === String(email).trim().toLowerCase() && String(rowPass).trim() === String(password).trim()) {
      return {
        status: 'success',
        user: {
          email: String(rowEmail).trim(),
          role: String(rowRole).trim(),
          store: String(rowStore).trim(),
          name: rowName ? String(rowName).trim() : ''
        }
      };
    }
  }

  return { status: 'error', message: 'Credenciales inválidas' };
}

// ──────────────────────────────────────────────
// GUARDADO MANUAL DE DATOS (Botón Agregar Datos)
// ──────────────────────────────────────────────
function handleSaveManualData(params) {
  const tipo = params.tipo;
  const dataPayload = params.data; 
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(tipo);
  
  if (!sheet) {
    sheet = ss.insertSheet(tipo);
  }

  if (tipo === 'Ventas_Metas') {
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['MesIndex', 'Tienda', 'Venta', 'Meta']);
    }

    const monthIdx = dataPayload.monthIdx;
    const storeItems = dataPayload.data;
    const allData = sheet.getDataRange().getValues();

    storeItems.forEach(item => {
      let found = false;
      for (let i = 1; i < allData.length; i++) {
        if (allData[i][0] == monthIdx && allData[i][1] == item.store) {
          sheet.getRange(i + 1, 3).setValue(item.venta);
          sheet.getRange(i + 1, 4).setValue(item.meta);
          found = true;
          break;
        }
      }
      if (!found) {
        sheet.appendRow([monthIdx, item.store, item.venta, item.meta]);
      }
    });

  } else {
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['Numeración', 'Mes', 'Tienda', 'Prospectados', 'Contactados', 'Cotizados', 'Cerrados', 'Perdidos']);
    }

    const mes = dataPayload.mes;
    const tienda = dataPayload.tienda;
    const allData = sheet.getDataRange().getValues();
    let found = false;

    for (let i = 1; i < allData.length; i++) {
      if (allData[i][1] == mes && allData[i][2] == tienda) {
        sheet.getRange(i + 1, 4).setValue(dataPayload.prospectados);
        sheet.getRange(i + 1, 5).setValue(dataPayload.contactados);
        sheet.getRange(i + 1, 6).setValue(dataPayload.cotizados);
        sheet.getRange(i + 1, 7).setValue(dataPayload.cerrados);
        sheet.getRange(i + 1, 8).setValue(dataPayload.perdidos);
        found = true;
        break;
      }
    }

    if (!found) {
      const nextId = allData.length;
      sheet.appendRow([
        nextId,
        mes,
        tienda,
        dataPayload.prospectados,
        dataPayload.contactados,
        dataPayload.cotizados,
        dataPayload.cerrados,
        dataPayload.perdidos
      ]);
    }
  }

  return { status: 'success', message: 'Datos guardados correctamente en ' + tipo };
}

// ──────────────────────────────────────────────
// CARGA MASIVA DE EXCEL (80/20)
// ──────────────────────────────────────────────
function handleExcelUpload(params) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Deals');
  if (!sheet) return { status: 'error', message: 'Hoja Deals no encontrada' };

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['id', 'title', 'customer_id', 'owner_id', 'stage_id', 'amount', 'currency', 'status', 'store_code', 'created_at', 'closed_at']);
  }

  const rows = params.data;
  rows.forEach(r => {
    sheet.appendRow([
      r.id || ('d' + new Date().getTime()),
      r.title || 'Oportunidad Masiva',
      r.customer_id || '',
      r.owner_id || '',
      r.stage_id || 's1',
      r.amount || 0,
      r.currency || 'GTQ',
      r.status || 'open',
      r.store_code || 'CB',
      r.created_at || new Date().toISOString(),
      r.closed_at || ''
    ]);
  });

  return { status: 'success', message: 'Excel importado correctamente' };
}

// ============================================================
// FUNCIONES DEL MÓDULO VALES DE ARTE
// ============================================================
/**
 * Crea la hoja 'Vales' si no existe, con sus encabezados, o asegura que tenga las columnas requeridas.
 */
function setupValesSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName("Vales");
  const requiredHeaders = [
    "No", "Tienda", "NoVale", "Producto", "FechaIngreso", "FechaSalida",
    "Proceso", "ArchivoCargaUrl", "ArchivoCargaId", "ArchivoDescargaUrl", "ArchivoDescargaId",
    "ArchivoCarga2Url", "ArchivoCarga2Id", "ArchivoDescarga2Url", "ArchivoDescarga2Id",
    "ArchivoCarga3Url", "ArchivoCarga3Id", "ArchivoDescarga3Url", "ArchivoDescarga3Id",
    "ArchivoOrdenTrabajoUrl", "ArchivoOrdenTrabajoId", "FechaUltimaModificacion"
  ];
  if (!sheet) {
    sheet = ss.insertSheet("Vales");
    sheet.appendRow(requiredHeaders);
    sheet.getRange(1, 1, 1, requiredHeaders.length).setFontWeight("bold").setBackground("#f1f5f9");
  } else {
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn() || 1).getValues()[0];
    requiredHeaders.forEach(h => {
      if (headers.indexOf(h) === -1) {
        sheet.getRange(1, sheet.getLastColumn() + 1).setValue(h).setFontWeight("bold").setBackground("#f1f5f9");
      }
    });
  }
  return sheet;
}

/**
 * Limpia el ID de la carpeta en caso de que el usuario haya pegado la URL completa en lugar de solo el ID.
 */
function cleanFolderId_(idOrUrl) {
  let str = String(idOrUrl || "").trim();
  if (str.includes("folders/")) {
    str = str.split("folders/")[1].split("?")[0].split("/")[0];
  }
  return str;
}

/**
 * Busca (o crea si no existe) la subcarpeta de una tienda dentro de una
 * carpeta padre de Drive (Vales de Carga o Vales de Descarga).
 */
function getOrCreateStoreSubfolder_(parentFolderId, storeCode) {
  const cleanId = cleanFolderId_(parentFolderId);
  const parent = DriveApp.getFolderById(cleanId);
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
    const noVale = (datos.noVale && String(datos.noVale).trim()) ? String(datos.noVale).trim() : ("VAL-" + String(numero).padStart(3, "0"));
    const tz = Session.getScriptTimeZone() || "GMT-6";
    const fechaIngreso = datos.fechaIngreso || Utilities.formatDate(new Date(), tz, "yyyy-MM-dd");

    const row = [
      numero,
      datos.tienda,
      noVale,
      datos.producto,
      fechaIngreso,
      datos.fechaSalida || "",
      "en tiempo",
      "", "", "", "", // Carga 1 & Descarga 1
      "", "", "", "", // Carga 2 & Descarga 2
      "", "", "", "", // Carga 3 & Descarga 3
      "", "", ""      // Orden de Trabajo & FechaUltimaModificacion
    ];
    sheet.appendRow(row);

    return { status: "success", message: "Vale " + noVale + " creado correctamente.", noVale: noVale };
  } catch (e) {
    return { status: "error", message: e.toString() };
  }
}

/**
 * Elimina un vale de la hoja 'Vales' por su número de vale.
 */
function eliminarVale(noVale) {
  try {
    const sheet = setupValesSheet();
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const colNoVale = headers.indexOf("NoVale");

    for (let i = 1; i < data.length; i++) {
      if (String(data[i][colNoVale]).trim() === String(noVale).trim()) {
        sheet.deleteRow(i + 1);
        return { status: "success", message: "Vale " + noVale + " eliminado correctamente." };
      }
    }
    return { status: "error", message: "Vale no encontrado: " + noVale };
  } catch (e) {
    return { status: "error", message: e.toString() };
  }
}

/**
 * Actualiza el estado de Proceso de un vale (en tiempo / tarde / Entregado / Modificaciones / Autorizado / Congelado).
 */
function actualizarProcesoVale(noVale, proceso) {
  try {
    const sheet = setupValesSheet();
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const colNoVale = headers.indexOf("NoVale");
    const colProceso = headers.indexOf("Proceso") + 1;
    const colFechaUltModif = headers.indexOf("FechaUltimaModificacion") + 1;

    for (let i = 1; i < data.length; i++) {
      if (String(data[i][colNoVale]).trim() === String(noVale).trim()) {
        sheet.getRange(i + 1, colProceso).setValue(proceso);
        if (proceso === "Modificación 3" && colFechaUltModif > 0) {
          sheet.getRange(i + 1, colFechaUltModif).setValue(new Date().toISOString());
        }
        return { status: "success", message: "Proceso actualizado." };
      }
    }
    return { status: "error", message: "Vale no encontrado: " + noVale };
  } catch (e) {
    return { status: "error", message: e.toString() };
  }
}

/**
 * Edita el estado (proceso) y la fecha de salida de un vale existente.
 */
function editarVale(noVale, proceso, fechaSalida) {
  try {
    const sheet = setupValesSheet();
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const colNoVale = headers.indexOf("NoVale");
    const colProceso = headers.indexOf("Proceso") + 1;
    const colFechaSalida = headers.indexOf("FechaSalida") + 1;
    const colFechaUltModif = headers.indexOf("FechaUltimaModificacion") + 1;

    for (let i = 1; i < data.length; i++) {
      if (String(data[i][colNoVale]).trim() === String(noVale).trim()) {
        if (proceso) {
          sheet.getRange(i + 1, colProceso).setValue(proceso);
          if (proceso === "Modificación 3" && colFechaUltModif > 0) {
            sheet.getRange(i + 1, colFechaUltModif).setValue(new Date().toISOString());
          }
        }
        if (fechaSalida !== undefined) sheet.getRange(i + 1, colFechaSalida).setValue(fechaSalida);
        return { status: "success", message: "Vale actualizado correctamente." };
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
 * y guarda el link en la columna de modificación / etapa que corresponda.
 */
function subirArchivoVale(datos) {
  try {
    const noVale = datos.noVale;
    const tipo = datos.tipo || "carga"; // carga, descarga, carga2, descarga2, carga3, descarga3, orden_trabajo
    const base64Data = datos.base64;
    const mimeType = datos.mimeType || "application/octet-stream";
    const fileName = datos.fileName || ("vale_" + noVale + "_" + tipo);

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

    const isCarga = (tipo === "carga" || tipo === "carga2" || tipo === "carga3" || tipo === "orden_trabajo");
    const rawParentId = isCarga ? VALES_CARGA_FOLDER_ID : VALES_DESCARGA_FOLDER_ID;
    const parentFolderId = cleanFolderId_(rawParentId);
    const subfolder = getOrCreateStoreSubfolder_(parentFolderId, tienda);

    let targetFolder = subfolder;
    if (isCarga) {
      const valeFolderName = String(noVale).trim();
      const subfolders = subfolder.getFoldersByName(valeFolderName);
      if (subfolders.hasNext()) {
        targetFolder = subfolders.next();
      } else {
        targetFolder = subfolder.createFolder(valeFolderName);
      }
    }

    const bytes = Utilities.base64Decode(base64Data);
    const blob = Utilities.newBlob(bytes, mimeType, fileName);
    const file = targetFolder.createFile(blob);
    const url = isCarga ? targetFolder.getUrl() : file.getUrl();

    let urlColName = "ArchivoCargaUrl";
    let idColName = "ArchivoCargaId";
    if (tipo === "descarga") { urlColName = "ArchivoDescargaUrl"; idColName = "ArchivoDescargaId"; }
    else if (tipo === "carga2") { urlColName = "ArchivoCarga2Url"; idColName = "ArchivoCarga2Id"; }
    else if (tipo === "descarga2") { urlColName = "ArchivoDescarga2Url"; idColName = "ArchivoDescarga2Id"; }
    else if (tipo === "carga3") { urlColName = "ArchivoCarga3Url"; idColName = "ArchivoCarga3Id"; }
    else if (tipo === "descarga3") { urlColName = "ArchivoDescarga3Url"; idColName = "ArchivoDescarga3Id"; }
    else if (tipo === "orden_trabajo") { urlColName = "ArchivoOrdenTrabajoUrl"; idColName = "ArchivoOrdenTrabajoId"; }

    const urlCol = headers.indexOf(urlColName) + 1;
    const idCol = headers.indexOf(idColName) + 1;
    if (urlCol > 0) sheet.getRange(rowIdx, urlCol).setValue(url);
    if (idCol > 0) sheet.getRange(rowIdx, idCol).setValue(file.getId());

    // Si sube la 3ra modificación, actualizar fecha de última modificación para regla de congelamiento
    if (tipo === "descarga3" || tipo === "carga3") {
      const colFechaUltModif = headers.indexOf("FechaUltimaModificacion") + 1;
      if (colFechaUltModif > 0) sheet.getRange(rowIdx, colFechaUltModif).setValue(new Date().toISOString());
    }

    return {
      status: "success",
      message: "Archivo \"" + fileName + "\" subido correctamente a Vales (" + tipo + ") / " + tienda,
      url: url,
      fileId: file.getId()
    };
  } catch (e) {
    return { status: "error", message: e.toString() };
  }
}

/**
 * Transita el vale al siguiente estado de Modificación (1, 2 o 3) y habilita la subida correspondiente sin borrar las anteriores.
 */
function solicitarModificacion(noVale) {
  try {
    const sheet = setupValesSheet();
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const colNoVale = headers.indexOf("NoVale");
    const colProceso = headers.indexOf("Proceso") + 1;
    const colFechaUltModif = headers.indexOf("FechaUltimaModificacion") + 1;

    for (let i = 1; i < data.length; i++) {
      if (String(data[i][colNoVale]).trim() === String(noVale).trim()) {
        const currentProceso = String(data[i][colProceso - 1] || "");
        let nextProceso = "Modificación 1";
        if (currentProceso === "Modificación 1") nextProceso = "Modificación 2";
        else if (currentProceso === "Modificación 2") nextProceso = "Modificación 3";
        else if (currentProceso === "Modificación 3") nextProceso = "Modificación 3"; // Ya en la tercera

        sheet.getRange(i + 1, colProceso).setValue(nextProceso);
        if (nextProceso === "Modificación 3" && colFechaUltModif > 0) {
          sheet.getRange(i + 1, colFechaUltModif).setValue(new Date().toISOString());
        }

        return { status: "success", message: "Vale " + noVale + " en " + nextProceso + ". Subidas habilitadas." };
      }
    }
    return { status: "error", message: "Vale no encontrado: " + noVale };
  } catch (e) {
    return { status: "error", message: e.toString() };
  }
}

// ──────────────────────────────────────────────────────────────────
// MÓDULO: EVENTOS DE CALENDARIO
// ──────────────────────────────────────────────────────────────────
function setupCalendarSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('CalendarioEventos');
  if (!sheet) {
    sheet = ss.insertSheet('CalendarioEventos');
    sheet.appendRow(['id', 'fecha', 'titulo', 'horaInicio', 'horaFin', 'prioridad', 'descripcion', 'tienda', 'replicarGlobal', 'creadoPor', 'creadoEn']);
    sheet.getRange(1, 1, 1, 11).setFontWeight('bold').setBackground('#4f46e5').setFontColor('#ffffff');
  }
  return sheet;
}

function saveCalendarEvent(datos) {
  try {
    const sheet = setupCalendarSheet();
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const colId = headers.indexOf('id');
    
    // Check if event with this id already exists (update)
    let existingRow = -1;
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][colId]) === String(datos.id)) {
        existingRow = i + 1;
        break;
      }
    }
    
    const rowData = [
      datos.id,
      datos.fecha,
      datos.titulo,
      datos.horaInicio || '',
      datos.horaFin || '',
      datos.prioridad,
      datos.descripcion || '',
      datos.tienda,
      datos.replicarGlobal ? 'SI' : 'NO',
      datos.creadoPor || '',
      datos.creadoEn || new Date().toISOString()
    ];
    
    if (existingRow > 0) {
      sheet.getRange(existingRow, 1, 1, rowData.length).setValues([rowData]);
      return { status: 'success', message: 'Evento actualizado: ' + datos.titulo };
    } else {
      sheet.appendRow(rowData);
      return { status: 'success', message: 'Evento guardado: ' + datos.titulo };
    }
  } catch (e) {
    return { status: 'error', message: e.toString() };
  }
}

function getCalendarEvents() {
  try {
    const sheet = setupCalendarSheet();
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return { status: 'success', eventos: [] };
    const headers = data[0];
    const eventos = [];
    for (let i = 1; i < data.length; i++) {
      const row = {};
      for (let j = 0; j < headers.length; j++) {
        let val = data[i][j];
        if (val instanceof Date) {
          if (headers[j] === 'fecha') {
            const yyyy = val.getFullYear();
            const mm = String(val.getMonth() + 1).padStart(2, '0');
            const dd = String(val.getDate()).padStart(2, '0');
            val = `${yyyy}-${mm}-${dd}`;
          } else {
            val = val.toISOString();
          }
        } else if (typeof val === 'string' && headers[j] === 'fecha' && val.includes('T')) {
          val = val.substring(0, 10);
        }
        row[headers[j]] = val;
      }
      row.replicarGlobal = row.replicarGlobal === 'SI';
      eventos.push(row);
    }
    return { status: 'success', eventos };
  } catch (e) {
    return { status: 'error', message: e.toString() };
  }
}

// ──────────────────────────────────────────────────────────────────
// MÓDULO: NOTIFICACIONES PERSISTENTES
// ──────────────────────────────────────────────────────────────────
function setupNotifSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Notificaciones');
  if (!sheet) {
    sheet = ss.insertSheet('Notificaciones');
    sheet.appendRow(['id', 'type', 'mensaje', 'hora', 'read', 'creadoEn']);
    sheet.getRange(1, 1, 1, 6).setFontWeight('bold').setBackground('#1e293b').setFontColor('#ffffff');
  }
  return sheet;
}

function saveNotification(datos) {
  try {
    const sheet = setupNotifSheet();
    sheet.appendRow([
      datos.id,
      datos.type,
      datos.mensaje,
      datos.hora,
      datos.read ? 'SI' : 'NO',
      new Date().toISOString()
    ]);
    // Keep only last 200 notifications
    const lastRow = sheet.getLastRow();
    if (lastRow > 201) {
      sheet.deleteRows(2, lastRow - 201);
    }
    return { status: 'success', message: 'Notificación guardada' };
  } catch (e) {
    return { status: 'error', message: e.toString() };
  }
}

function getNotifications() {
  try {
    const sheet = setupNotifSheet();
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return { status: 'success', notificaciones: [] };
    const headers = data[0];
    const notificaciones = [];
    for (let i = data.length - 1; i >= 1; i--) {
      const row = {};
      for (let j = 0; j < headers.length; j++) {
        row[headers[j]] = data[i][j];
      }
      row.read = row.read === 'SI';
      notificaciones.push(row);
    }
    return { status: 'success', notificaciones };
  } catch (e) {
    return { status: 'error', message: e.toString() };
  }
}

// ──────────────────────────────────────────────────────────────────
// MÓDULO: ARCHIVOS DE ÓRDENES DE TRABAJO
// ──────────────────────────────────────────────────────────────────
// Dedicated folder: CRM > Ordenes (created by user)
const ORDENES_FOLDER_ID = '17oCaQxmzLJZIU_YP1PrXUv4MziXl4tgA';

/**
 * Sube un archivo a la carpeta de Órdenes en Drive.
 * datos.tipoArchivo: 'orden' | 'vale'  (subcarpeta dentro de la orden)
 */
function subirArchivoOrden(datos) {
  try {
    const noOrden = datos.noOrden;
    const tipoArchivo = datos.tipoArchivo === 'vale' ? 'vale' : 'orden';
    const base64Data = datos.base64;
    const mimeType = datos.mimeType || 'application/octet-stream';
    const fileName = datos.fileName || (tipoArchivo + '_' + noOrden);

    if (!base64Data) throw new Error('No se recibió el contenido del archivo.');

    const ordenesFolder = DriveApp.getFolderById(ORDENES_FOLDER_ID);

    // Subcarpeta por número de orden
    const safeOrdenName = noOrden.replace(/\//g, '_').replace(/\s/g, '_');
    let ordenFolder;
    const subFolders = ordenesFolder.getFoldersByName(safeOrdenName);
    if (subFolders.hasNext()) {
      ordenFolder = subFolders.next();
    } else {
      ordenFolder = ordenesFolder.createFolder(safeOrdenName);
    }

    // Subcarpeta por tipo: orden/ o vale/
    let tipoFolder;
    const tipoFolders = ordenFolder.getFoldersByName(tipoArchivo);
    if (tipoFolders.hasNext()) {
      tipoFolder = tipoFolders.next();
    } else {
      tipoFolder = ordenFolder.createFolder(tipoArchivo);
    }

    const bytes = Utilities.base64Decode(base64Data);
    const blob = Utilities.newBlob(bytes, mimeType, fileName);
    const file = tipoFolder.createFile(blob);

    // Escribir inmediatamente la URL y el ID en la hoja OrdenesWork
    try {
      const sheet = setupOrdenesWorkSheet();
      const data = sheet.getDataRange().getValues();
      const headers = data[0];
      const colNumero = headers.indexOf('numero');
      const colId = headers.indexOf('id');
      const urlCol = headers.indexOf(tipoArchivo === 'vale' ? 'archivoValeUrl' : 'archivoOrdenUrl') + 1;
      const idCol = headers.indexOf(tipoArchivo === 'vale' ? 'archivoValeId' : 'archivoOrdenId') + 1;

      for (let i = 1; i < data.length; i++) {
        if (String(data[i][colNumero]).trim() === String(noOrden).trim() || String(data[i][colId]).trim() === String(noOrden).trim()) {
          sheet.getRange(i + 1, urlCol).setValue(file.getUrl());
          sheet.getRange(i + 1, idCol).setValue(file.getId());
          break;
        }
      }
    } catch (sheetErr) {
      // Si falla escribir en la celda no detenemos la respuesta del subida a Drive
    }

    return {
      status: 'success',
      message: 'Archivo "' + fileName + '" subido a Órdenes/' + safeOrdenName + '/' + tipoArchivo,
      url: file.getUrl(),
      fileId: file.getId(),
      fileName: fileName,
      tipoArchivo: tipoArchivo
    };
  } catch (e) {
    return { status: 'error', message: e.toString() };
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// MÓDULO: ÓRDENES DE TRABAJO — Persistencia en Google Sheets
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Hoja: OrdenesWork
 * Columnas: id, numero, tiendas, fechaSalidaProduccion, fechaEntregaCliente,
 *           transporte, estado, notas, archivoOrdenUrl, archivoOrdenId,
 *           archivoValeUrl, archivoValeId, creadoPor, creadoEn
 */
function setupOrdenesWorkSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('OrdenesWork');
  if (!sheet) {
    sheet = ss.insertSheet('OrdenesWork');
    sheet.appendRow([
      'id', 'numero', 'tiendas', 'fechaSalidaProduccion', 'fechaEntregaCliente',
      'transporte', 'estado', 'notas',
      'archivoOrdenUrl', 'archivoOrdenId',
      'archivoValeUrl', 'archivoValeId',
      'creadoPor', 'creadoEn'
    ]);
    sheet.getRange(1, 1, 1, 14).setFontWeight('bold')
      .setBackground('#1e293b').setFontColor('#ffffff');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function saveOrden(datos) {
  try {
    const sheet = setupOrdenesWorkSheet();
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const colId = headers.indexOf('id');

    let existingRow = -1;
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][colId]) === String(datos.id)) {
        existingRow = i + 1;
        break;
      }
    }

    const tiendas = Array.isArray(datos.tiendas) ? datos.tiendas.join(', ') : (datos.tiendas || '');

    const rowData = [
      datos.id,
      datos.numero,
      tiendas,
      datos.fechaSalidaProduccion || '',
      datos.fechaEntregaCliente || '',
      datos.transporte || '',
      datos.estado || 'Pendiente',
      datos.notas || '',
      datos.archivoOrdenUrl || '',
      datos.archivoOrdenId || '',
      datos.archivoValeUrl || '',
      datos.archivoValeId || '',
      datos.creadoPor || '',
      datos.creadoEn || new Date().toISOString()
    ];

    if (existingRow > 0) {
      // Update: preserve file URLs if not provided in update
      const existing = data[existingRow - 1];
      const colOrdenUrl = headers.indexOf('archivoOrdenUrl');
      const colValeUrl = headers.indexOf('archivoValeUrl');
      if (!datos.archivoOrdenUrl && existing[colOrdenUrl]) rowData[8] = existing[colOrdenUrl];
      if (!datos.archivoOrdenId && existing[headers.indexOf('archivoOrdenId')]) rowData[9] = existing[headers.indexOf('archivoOrdenId')];
      if (!datos.archivoValeUrl && existing[colValeUrl]) rowData[10] = existing[colValeUrl];
      if (!datos.archivoValeId && existing[headers.indexOf('archivoValeId')]) rowData[11] = existing[headers.indexOf('archivoValeId')];
      sheet.getRange(existingRow, 1, 1, rowData.length).setValues([rowData]);
      return { status: 'success', message: 'Orden actualizada: ' + datos.numero };
    } else {
      sheet.appendRow(rowData);
      return { status: 'success', message: 'Orden guardada: ' + datos.numero };
    }
  } catch (e) {
    return { status: 'error', message: e.toString() };
  }
}

function getOrdenes() {
  try {
    const sheet = setupOrdenesWorkSheet();
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return { status: 'success', ordenes: [] };
    const headers = data[0];
    const ordenes = [];
    for (let i = 1; i < data.length; i++) {
      if (!data[i][0]) continue; // skip empty rows
      const row = {};
      for (let j = 0; j < headers.length; j++) {
        let val = data[i][j];
        if (val instanceof Date) {
          if (headers[j] === 'fechaSalidaProduccion' || headers[j] === 'fechaEntregaCliente') {
            const yyyy = val.getFullYear();
            const mm = String(val.getMonth() + 1).padStart(2, '0');
            const dd = String(val.getDate()).padStart(2, '0');
            val = `${yyyy}-${mm}-${dd}`;
          } else {
            val = val.toISOString();
          }
        } else if (typeof val === 'string' && (headers[j] === 'fechaSalidaProduccion' || headers[j] === 'fechaEntregaCliente') && val.includes('T')) {
          val = val.substring(0, 10);
        }
        row[headers[j]] = val;
      }
      // Parse tiendas back to array
      row.tiendas = row.tiendas ? String(row.tiendas).split(',').map(s => s.trim()).filter(Boolean) : [];
      ordenes.push(row);
    }
    return { status: 'success', ordenes };
  } catch (e) {
    return { status: 'error', message: e.toString() };
  }
}

function eliminarOrden(noOrden) {
  try {
    const sheet = setupOrdenesWorkSheet();
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const colId = headers.indexOf('id');
    const colNumero = headers.indexOf('numero');

    for (let i = 1; i < data.length; i++) {
      if (String(data[i][colId]) === String(noOrden) || String(data[i][colNumero]) === String(noOrden)) {
        sheet.deleteRow(i + 1);
        return { status: 'success', message: 'Orden eliminada: ' + noOrden };
      }
    }
    return { status: 'error', message: 'Orden no encontrada: ' + noOrden };
  } catch (e) {
    return { status: 'error', message: e.toString() };
  }
}

function updateOrdenEstado(noOrden, estado) {
  try {
    const sheet = setupOrdenesWorkSheet();
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const colId = headers.indexOf('id');
    const colNumero = headers.indexOf('numero');
    const colEstado = headers.indexOf('estado') + 1;

    for (let i = 1; i < data.length; i++) {
      if (String(data[i][colId]) === String(noOrden) || String(data[i][colNumero]) === String(noOrden)) {
        sheet.getRange(i + 1, colEstado).setValue(estado);
        return { status: 'success', message: 'Estado actualizado a: ' + estado };
      }
    }
    return { status: 'error', message: 'Orden no encontrada: ' + noOrden };
  } catch (e) {
    return { status: 'error', message: e.toString() };
  }
}
