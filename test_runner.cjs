const fs = require('fs');
const path = require('path');

// 1. Leer el archivo Code.gs
const codeGsPath = path.join(__dirname, 'Code.gs');
let code = fs.readFileSync(codeGsPath, 'utf8');

// 2. Mockear el entorno global de Google Apps Script
let mockEmail = 'admin@tuempresa.com';

const Session = {
  getActiveUser: () => ({
    getEmail: () => mockEmail
  }),
  getEffectiveUser: () => ({
    getEmail: () => mockEmail
  }),
  getScriptTimeZone: () => 'GMT-6'
};

const Utilities = {
  formatDate: (date, tz, format) => {
    return date.toISOString().split('T')[0];
  }
};

// Datos simulados de la hoja BD_Historico_Operaciones
const mockSheetData = [
  ["Fecha", "Codigo", "Tienda", "Tareas_Asignadas", "Tareas_Completadas", "Cumplimiento_Pct", "Estado", "Detalle_Tareas"],
  ["2026-06-06", "CB", "TX.CB", 13, 8, 0.62, "ACEPTABLE", "{}"],
  ["2026-06-06", "CHM", "TX.CHM", 13, 5, 0.38, "CRÍTICO", "{}"],
  ["2026-06-06", "CHQ", "TX.CHQ", 13, 11, 0.85, "ÓPTIMO", "{}"],
  ["2026-06-07", "CB", "TX.CB", 13, 9, 0.69, "ACEPTABLE", "{}"],
  ["2026-06-07", "CHM", "TX.CHM", 13, 10, 0.77, "ACEPTABLE", "{}"],
  ["2026-06-07", "CHQ", "TX.CHQ", 13, 3, 0.23, "CRÍTICO", "{}"]
];

const mockSheet = {
  getDataRange: () => ({
    getValues: () => mockSheetData
  }),
  appendRow: (row) => {
    mockSheetData.push(row);
  },
  getRange: () => ({
    setFontWeight: () => ({ setBackground: () => {} })
  })
};

const mockSpreadsheet = {
  getSheetByName: (name) => {
    if (name === 'BD_Historico_Operaciones') {
      return mockSheet;
    }
    return null;
  },
  insertSheet: (name) => {
    return mockSheet;
  }
};

const SpreadsheetApp = {
  getActiveSpreadsheet: () => mockSpreadsheet,
  openById: () => mockSpreadsheet
};

// 3. Evaluar el código de Code.gs
const sandbox = {
  Session,
  Utilities,
  SpreadsheetApp,
  console,
  Date,
  Math,
  JSON
};

// Crear contexto de evaluación y extraer variables globales y funciones
const runInContext = (codeStr, context) => {
  const keys = Object.keys(context);
  const values = keys.map(k => context[k]);
  // Añadir retorno explícito de la función y de la constante a probar
  const fn = new Function(...keys, codeStr + '\nreturn { USUARIOS_CONFIG, obtenerDatosRendimientoSeguro, setupDatabase };');
  return fn(...values);
};

const exported = runInContext(code, sandbox);
const { obtenerDatosRendimientoSeguro, USUARIOS_CONFIG } = exported;

console.log("==========================================================");
console.log("EJECUCIÓN DE PRUEBA: OBTENER DATOS DE RENDIMIENTO SEGURO");
console.log("==========================================================\n");

// Caso de Prueba 1: Usuario Administrador
mockEmail = 'admin@tuempresa.com';
console.log(`--- Caso 1: Usuario Administrador (${mockEmail}) ---`);
try {
  const result = obtenerDatosRendimientoSeguro();
  console.log("Rol obtenido:", result.rol);
  console.log("Tienda asignada:", result.tienda);
  console.log("Cantidad de registros filtrados devueltos:", result.datos.length);
  console.log("Registros:", JSON.stringify(result.datos, null, 2));
} catch (e) {
  console.error("Error:", e.message);
}
console.log("\n----------------------------------------------------------\n");

// Caso de Prueba 2: Asesor de Tienda (CHQ)
mockEmail = 'ingrid.chq@tuempresa.com';
console.log(`--- Caso 2: Asesor de Tienda CHQ (${mockEmail}) ---`);
try {
  const result = obtenerDatosRendimientoSeguro();
  console.log("Rol obtenido:", result.rol);
  console.log("Tienda asignada:", result.tienda);
  console.log("Cantidad de registros filtrados devueltos:", result.datos.length);
  console.log("Registros:", JSON.stringify(result.datos, null, 2));
} catch (e) {
  console.error("Error:", e.message);
}
console.log("\n----------------------------------------------------------\n");

// Caso de Prueba 3: Usuario No Autorizado
mockEmail = 'desconocido@gmail.com';
console.log(`--- Caso 3: Intento de acceso de usuario no autorizado (${mockEmail}) ---`);
try {
  const result = obtenerDatosRendimientoSeguro();
} catch (e) {
  console.log("Acceso bloqueado con éxito - Mensaje recibido:", e.message);
}
console.log("\n==========================================================");
