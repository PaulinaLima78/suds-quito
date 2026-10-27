// ---------------------------------------------------------------------------
// SUDS Quito · Presupuesto referencial por tipo de SUDS
// © 2026 Paulina Lima. Todos los derechos reservados.
//
// Cantidades derivadas de la geometría del SUDS dimensionado. Precios
// referenciales para anteproyecto: no incluyen utilidad del contratista ni
// IVA. Se agrega un % de imprevistos (CONTINGENCY).
//
// v2.0: la excavación de biorretención, pavimento y cisterna se calcula con
// la geometría real (antes se usaba el volumen de agua, que subestima la
// excavación y los materiales).
// ---------------------------------------------------------------------------
import { UNIT_PRICES as P, CONTINGENCY } from "../data/prices.js";
import { PAVEMENT } from "./hydrology.js";

export function calcBudget(items, contingency = CONTINGENCY) {
  const clean = items.map((i) => ({ ...i, qty: Math.max(Number(i.qty) || 0, 0) }));
  const subtotal = clean.reduce((s, i) => s + i.qty * i.p, 0);
  return { items: clean, subtotal, contingency, total: subtotal * (1 + contingency) };
}

export function budgetBioretention(r) {
  const area = r.areaM2;
  const side = Math.sqrt(area); // planta cuadrada equivalente
  const perimeter = 4 * side;
  const excavation = area * (r.pondingDepth + r.mediaDepth + r.gravelDepth);
  return calcBudget([
    { desc: "Excavación a mano (tierra)",          qty: excavation,                     unit: "m³", p: P.bio_excavacion },
    { desc: "Arena gruesa para filtros (50% del sustrato)", qty: area * r.mediaDepth * 0.5, unit: "m³", p: P.bio_arena },
    { desc: "Grava para drenaje (capa inferior)",  qty: area * r.gravelDepth,           unit: "m³", p: P.bio_grava },
    { desc: "Abono orgánico (sustrato)",           qty: area * 40,                      unit: "Kg", p: P.bio_abono },
    { desc: "Geotextil 2000 NT",                   qty: area + perimeter * (r.mediaDepth + r.gravelDepth), unit: "m²", p: P.bio_geotextil },
    { desc: "Tubería PVC perforada Ø110mm (dren)", qty: side,                           unit: "m",  p: P.bio_dren },
    { desc: "Plantas / jardinería",                qty: area,                           unit: "m²", p: P.bio_plantas },
    { desc: "Desalojo de material (5 km)",         qty: excavation,                     unit: "m³", p: P.bio_desalojo },
  ]);
}

export function budgetTrench(r) {
  const vol = r.width * r.depth * r.length;
  return calcBudget([
    { desc: "Excavación de zanja a mano (h=0-2m)", qty: vol,                                unit: "m³", p: P.zanja_excavacion },
    { desc: "Arena en zanja de infiltración",       qty: vol * 0.3,                          unit: "m³", p: P.zanja_arena },
    { desc: "Grava en zanja de infiltración",       qty: vol * 0.7,                          unit: "m³", p: P.zanja_grava },
    { desc: "Geotextil 2000 NT",                    qty: 2 * (r.width + r.depth) * r.length, unit: "m²", p: P.zanja_geotextil },
    { desc: "Desalojo de material (5 km)",          qty: vol,                                unit: "m³", p: P.zanja_desalojo },
  ]);
}

export function budgetPermeable(r) {
  const area = r.areaPavement;
  const baseVol = area * r.baseDepth;
  const excavation = area * (r.baseDepth + PAVEMENT.blockThickness);
  return calcBudget([
    { desc: "Excavación a mano (tierra)",  qty: excavation, unit: "m³", p: P.pav_excavacion },
    { desc: "Adoquín ecológico e=10cm (inc. cama de arena)", qty: area, unit: "m²", p: P.pav_adoquin },
    { desc: "Base de grava para drenaje",  qty: baseVol,    unit: "m³", p: P.pav_base_grava },
    { desc: "Geotextil 2000 NT",           qty: area,       unit: "m²", p: P.pav_geotextil },
    { desc: "Desalojo de material (5 km)", qty: excavation, unit: "m³", p: P.pav_desalojo },
  ]);
}

export function budgetCistern(r) {
  const wall = 0.15;      // espesor de muros y fondo (m)
  const workSpace = 0.30; // sobreancho de excavación (m)
  const radius = r.diameter / 2;
  const wallArea = 2 * Math.PI * radius * r.heightAssumed;
  const baseArea = Math.PI * radius ** 2;
  const concVol = (wallArea + baseArea) * wall;
  const excavation = Math.PI * (radius + wall + workSpace) ** 2 * (r.heightAssumed + wall);
  return calcBudget([
    { desc: "Excavación en pozo (h=0-2m)",    qty: excavation,          unit: "m³", p: P.cist_excavacion },
    { desc: "Hormigón simple f'c=210 kg/cm2", qty: concVol,             unit: "m³", p: P.cist_hormigon },
    { desc: "Impermeabilización de cisterna", qty: wallArea + baseArea, unit: "m²", p: P.cist_impermeab },
    { desc: "Encofrado/desencofrado",         qty: wallArea,            unit: "m²", p: P.cist_encofrado },
    { desc: "Desalojo de material (5 km)",    qty: excavation,          unit: "m³", p: P.cist_desalojo },
  ]);
}

export function budgetChamber(r) {
  const vol = r.grossVolumeM3;
  const shell = 2 * ((r.length + r.width) * r.depth + r.length * r.width);
  return calcBudget([
    { desc: "Excavación en pozo (h=0-2m)",    qty: vol,   unit: "m³", p: P.dep_excavacion },
    { desc: "Grava en zanja de infiltración", qty: vol,   unit: "m³", p: P.dep_grava },
    { desc: "Geotextil 2000 NT",              qty: shell, unit: "m²", p: P.dep_geotextil },
    { desc: "Desalojo de material (5 km)",    qty: vol,   unit: "m³", p: P.dep_desalojo },
  ]);
}
