// ---------------------------------------------------------------------------
// SUDS Quito · Catálogos de superficies, tipos de SUDS y suelos
// © 2026 Paulina Lima. Todos los derechos reservados.
// ---------------------------------------------------------------------------

// runoffCoef: coeficiente de escorrentía volumétrico (C).
// cn: número de curva NRCS (TR-55), condición hidrológica normal, grupo C/D.
export const SURFACES = [
  { id: "techo", label: "Techo / cubierta", runoffCoef: 0.9, cn: 98 },
  { id: "pavimento", label: "Pavimento / vereda existente", runoffCoef: 0.85, cn: 96 },
  { id: "patio_tierra", label: "Patio o jardín (suelo desnudo)", runoffCoef: 0.3, cn: 79 },
  { id: "patio_cesped", label: "Patio con césped", runoffCoef: 0.2, cn: 74 },
];

export const SUDS_TYPES = [
  { id: "biorretencion", label: "Jardín de lluvia / Biorretención", infiltrates: true },
  { id: "permeable", label: "Pavimento permeable", infiltrates: true },
  { id: "zanja", label: "Zanja de infiltración", infiltrates: true },
  { id: "deposito", label: "Depósito de infiltración (bajo parqueadero)", infiltrates: true },
  { id: "cisterna", label: "Cisterna / tanque de detención", infiltrates: false },
  { id: "retencion_norma", label: "Tanque de retención (norma Quito)", infiltrates: false, norma: true },
];

// Conductividad hidráulica saturada típica (mm/h) por textura de suelo.
// Fuente: Rawls, Brakensiek y Miller (1983), tabla de parámetros Green-Ampt
// reproducida en Chow, Maidment y Mays (1988) — Applied Hydrology, tabla 4.3.1.
// Son valores de referencia: el diseño final requiere ensayo de infiltración
// en sitio (en Quito son frecuentes la cangahua y suelos volcánicos compactos).
export const SOILS = [
  { id: "desconocido", label: "No lo sé (asumir franco)", k: 3.4 },
  { id: "arena", label: "Arena", k: 117.8, granular: true },
  { id: "arena_franca", label: "Arena franca", k: 29.9, granular: true },
  { id: "franco_arenoso", label: "Franco arenoso", k: 10.9, granular: true },
  { id: "franco_limoso", label: "Franco limoso", k: 6.5 },
  { id: "franco", label: "Franco", k: 3.4 },
  { id: "franco_arcilloso", label: "Franco arcilloso", k: 1.0 },
  { id: "arcilla", label: "Arcilla / cangahua compacta", k: 0.3 },
  { id: "medido", label: "Medido en sitio (ensayo)", k: null },
];

// Escenarios de lluvia de diseño.
export const SCENARIOS = [
  { id: "p90", field: "p90Duracion", label: "P90" },
  { id: "p95", field: "p95Extremos", label: "P95" },
  { id: "tr2", field: "tr2_mm", label: "TR 2 años" },
  { id: "tr5", field: "tr5_mm", label: "TR 5 años" },
  { id: "tr10", field: "tr10_mm", label: "TR 10 años" },
  { id: "tr25", field: "tr25_mm", label: "TR 25 años" },
];

export const RUNOFF_METHODS = [
  { id: "coef", label: "Coeficiente de escorrentía (C)" },
  { id: "cn", label: "Número de curva NRCS (CN)" },
];
