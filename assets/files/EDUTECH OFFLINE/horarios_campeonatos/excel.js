const REQUIRED_SHEETS = [
  "CONFIG",
  "CATEGORIAS",
  "TECNICOS",
  "EQUIPOS",
  "HORARIOS"
];

const REQUIRED_COLUMNS = {
  CONFIG: ["torneo", "lugar", "fecha", "notas"],
  CATEGORIAS: ["categoria_id", "categoria_nombre", "modalidad", "observaciones"],
  TECNICOS: ["tecnico_id", "tecnico_nombre", "telefono", "observaciones"],
  EQUIPOS: ["equipo_id", "equipo_nombre", "categoria_id", "tecnico_id", "grupo", "observaciones"],
  HORARIOS: ["slot_id", "hora", "cancha", "disponible", "observaciones"]
};

const OPTIONAL_SHEETS = ["PROGRAMACION_EJEMPLO", "README"];

function normalizeKey(value) {
  return String(value ?? "").trim().toLowerCase();
}

function toSafeText(value) {
  return String(value ?? "").trim();
}

function normalizeBooleanLike(value) {
  const v = normalizeKey(value);
  return v === "si" || v === "sí" || v === "true" || v === "1" || v === "yes";
}

function normalizeTime(value) {
  const raw = toSafeText(value);
  if (!raw) return "";
  const clean = raw.replace(/\./g, ":");
  const match = clean.match(/^(\d{1,2}):(\d{1,2})$/);
  if (!match) return raw;
  const hh = match[1].padStart(2, "0");
  const mm = match[2].padStart(2, "0");
  return `${hh}:${mm}`;
}

function normalizeDate(value) {
  if (value == null || value === "") return "";
  if (typeof value === "number" && window.XLSX?.SSF) {
    const parsed = window.XLSX.SSF.parse_date_code(value);
    if (parsed) {
      const yyyy = String(parsed.y).padStart(4, "0");
      const mm = String(parsed.m).padStart(2, "0");
      const dd = String(parsed.d).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    }
  }
  const text = toSafeText(value);
  const m = text.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (m) {
    return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
  }
  return text;
}

function sheetToRows(sheet) {
  if (!sheet) return [];
  return window.XLSX.utils.sheet_to_json(sheet, { defval: "", raw: true });
}

function filterMeaningfulRows(rows) {
  return rows.filter((row) => Object.values(row).some((value) => String(value ?? "").trim() !== ""));
}

function normalizeRows(rows, mapping) {
  return rows.map((row) => {
    const out = {};
    for (const [target, source] of Object.entries(mapping)) {
      out[target] = row[source] ?? "";
    }
    return out;
  });
}

function findHeaderMap(rows, requiredColumns) {
  if (!rows.length) return null;
  const first = rows[0];
  const keys = Object.keys(first);
  const keyMap = {};
  for (const key of keys) {
    keyMap[normalizeKey(key)] = key;
  }
  const map = {};
  for (const col of requiredColumns) {
    const source = keyMap[col];
    if (!source) return null;
    map[col] = source;
  }
  return map;
}

export function createSampleWorkbook() {
  const wb = window.XLSX.utils.book_new();
  const config = [{ torneo: "Festival de Escuelas", lugar: "Cancha Principal", fecha: "2026-04-10", notas: "Jornada de prueba" }];
  const categorias = [
    { categoria_id: "CAT001", categoria_nombre: "Babies 2019 F5", modalidad: "Fútbol 5", observaciones: "-" },
    { categoria_id: "CAT002", categoria_nombre: "Preinfantil 2017 F5", modalidad: "Fútbol 5", observaciones: "-" }
  ];
  const tecnicos = [
    { tecnico_id: "TEC001", tecnico_nombre: "Juan Pérez", telefono: "3001111111", observaciones: "-" },
    { tecnico_id: "TEC002", tecnico_nombre: "Carlos Gómez", telefono: "3002222222", observaciones: "-" },
    { tecnico_id: "TEC003", tecnico_nombre: "Luis Rojas", telefono: "3003333333", observaciones: "-" }
  ];
  const equipos = [
    { equipo_id: "EQ001", equipo_nombre: "Leones", categoria_id: "CAT001", tecnico_id: "TEC001", grupo: "A", observaciones: "-" },
    { equipo_id: "EQ002", equipo_nombre: "Tigres", categoria_id: "CAT001", tecnico_id: "TEC001", grupo: "A", observaciones: "-" },
    { equipo_id: "EQ003", equipo_nombre: "Halcones", categoria_id: "CAT001", tecnico_id: "TEC002", grupo: "A", observaciones: "-" },
    { equipo_id: "EQ004", equipo_nombre: "Pumas", categoria_id: "CAT001", tecnico_id: "TEC003", grupo: "A", observaciones: "-" },
    { equipo_id: "EQ005", equipo_nombre: "Águilas", categoria_id: "CAT002", tecnico_id: "TEC002", grupo: "A", observaciones: "-" },
    { equipo_id: "EQ006", equipo_nombre: "Dragones", categoria_id: "CAT002", tecnico_id: "TEC003", grupo: "A", observaciones: "-" },
    { equipo_id: "EQ007", equipo_nombre: "Titanes", categoria_id: "CAT002", tecnico_id: "TEC001", grupo: "A", observaciones: "-" }
  ];
  const horarios = [
    { slot_id: "H001", hora: "08:00", cancha: "Cancha 1", disponible: "SI", observaciones: "-" },
    { slot_id: "H002", hora: "09:00", cancha: "Cancha 1", disponible: "SI", observaciones: "-" },
    { slot_id: "H003", hora: "10:00", cancha: "Cancha 1", disponible: "SI", observaciones: "-" },
    { slot_id: "H004", hora: "11:00", cancha: "Cancha 1", disponible: "SI", observaciones: "-" },
    { slot_id: "H005", hora: "08:00", cancha: "Cancha 2", disponible: "SI", observaciones: "-" },
    { slot_id: "H006", hora: "09:00", cancha: "Cancha 2", disponible: "SI", observaciones: "-" },
    { slot_id: "H007", hora: "10:00", cancha: "Cancha 2", disponible: "SI", observaciones: "-" },
    { slot_id: "H008", hora: "11:00", cancha: "Cancha 2", disponible: "SI", observaciones: "-" }
  ];

  window.XLSX.utils.book_append_sheet(wb, window.XLSX.utils.json_to_sheet(config), "CONFIG");
  window.XLSX.utils.book_append_sheet(wb, window.XLSX.utils.json_to_sheet(categorias), "CATEGORIAS");
  window.XLSX.utils.book_append_sheet(wb, window.XLSX.utils.json_to_sheet(tecnicos), "TECNICOS");
  window.XLSX.utils.book_append_sheet(wb, window.XLSX.utils.json_to_sheet(equipos), "EQUIPOS");
  window.XLSX.utils.book_append_sheet(wb, window.XLSX.utils.json_to_sheet(horarios), "HORARIOS");
  return wb;
}

export function downloadWorkbook(wb, fileName) {
  window.XLSX.writeFile(wb, fileName);
}

export async function readExcelFile(file) {
  const arrayBuffer = await file.arrayBuffer();
  return window.XLSX.read(arrayBuffer, { type: "array" });
}

export function parseWorkbook(workbook) {
  const warnings = [];
  const errors = [];

  for (const name of REQUIRED_SHEETS) {
    if (!workbook.SheetNames.includes(name)) {
      errors.push(`Falta la hoja requerida: ${name}`);
    }
  }
  if (errors.length) {
    return { errors, warnings, data: null };
  }

  const raw = {};
  for (const name of REQUIRED_SHEETS) {
    raw[name] = filterMeaningfulRows(sheetToRows(workbook.Sheets[name]));
  }
  for (const opt of OPTIONAL_SHEETS) {
    if (workbook.SheetNames.includes(opt)) {
      warnings.push(`Hoja opcional detectada: ${opt}`);
    }
  }

  const normalized = {};
  for (const [sheetName, cols] of Object.entries(REQUIRED_COLUMNS)) {
    if (sheetName === "PARTIDOS_REALIZADOS") continue;
    const map = findHeaderMap(raw[sheetName], cols);
    if (!map) {
      errors.push(`La hoja ${sheetName} no tiene todas las columnas requeridas.`);
      continue;
    }
    normalized[sheetName] = normalizeRows(raw[sheetName], map);
  }
  if (errors.length) {
    return { errors, warnings, data: null };
  }

  const configRow = normalized.CONFIG[0] || {};
  const config = {
    torneo: toSafeText(configRow.torneo),
    lugar: toSafeText(configRow.lugar),
    fecha: normalizeDate(configRow.fecha),
    notas: toSafeText(configRow.notas)
  };

  const categorias = normalized.CATEGORIAS.map((row) => ({
    categoria_id: toSafeText(row.categoria_id),
    categoria_nombre: toSafeText(row.categoria_nombre),
    modalidad: toSafeText(row.modalidad),
    observaciones: toSafeText(row.observaciones)
  }));

  const tecnicos = normalized.TECNICOS.map((row) => ({
    tecnico_id: toSafeText(row.tecnico_id),
    tecnico_nombre: toSafeText(row.tecnico_nombre),
    telefono: toSafeText(row.telefono),
    observaciones: toSafeText(row.observaciones)
  }));

  const equipos = normalized.EQUIPOS.map((row) => ({
    equipo_id: toSafeText(row.equipo_id),
    equipo_nombre: toSafeText(row.equipo_nombre),
    categoria_id: toSafeText(row.categoria_id),
    tecnico_id: toSafeText(row.tecnico_id),
    grupo: toSafeText(row.grupo),
    observaciones: toSafeText(row.observaciones)
  }));

  const horarios = normalized.HORARIOS.map((row) => ({
    slot_id: toSafeText(row.slot_id),
    hora: normalizeTime(row.hora),
    cancha: toSafeText(row.cancha),
    disponible: normalizeBooleanLike(row.disponible),
    observaciones: toSafeText(row.observaciones)
  }));

  return {
    errors,
    warnings,
    data: { config, categorias, tecnicos, equipos, horarios }
  };
}

export { REQUIRED_SHEETS, REQUIRED_COLUMNS };
