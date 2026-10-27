// ---------------------------------------------------------------------------
// SUDS Quito · Cálculo completo de un caso (función pura, sin interfaz)
// © 2026 Paulina Lima. Todos los derechos reservados.
// ---------------------------------------------------------------------------
import {
  designRunoff,
  sizeBioretention,
  sizePermeablePavement,
  sizeInfiltrationTrench,
  checkInfiltrationChamber,
  sizeCistern,
  infiltrationArea,
  drawdownHours,
  assessDrawdown,
} from "./hydrology.js";
import {
  budgetBioretention,
  budgetPermeable,
  budgetTrench,
  budgetChamber,
  budgetCistern,
} from "./budget.js";

/**
 * @param {object} c
 * @param {object} c.station  estación (real o virtual)
 * @param {number} c.rainMm   lluvia de diseño (mm)
 * @param {number} c.area     área aportante (m²)
 * @param {object} c.surface  superficie (SURFACES)
 * @param {string} c.method   "coef" | "cn"
 * @param {number} c.pavementArea  área de pavimento permeable (m²)
 * @param {{width:number, depth:number}} c.trench
 * @param {{length:number, width:number, depth:number}} c.chamber
 * @param {number|null} c.soilK  conductividad del suelo (mm/h)
 */
export function computeCase(c) {
  const { station, rainMm, area, surface, method } = c;
  if (!station || !(area > 0)) return null;

  const runoff = designRunoff(method, rainMm, area, surface);
  const volL = runoff.volL;
  const pavementArea = c.pavementArea > 0 ? c.pavementArea : area;

  const sizing = {
    biorretencion: sizeBioretention(volL, area),
    permeable: sizePermeablePavement(volL, pavementArea, area),
    zanja: sizeInfiltrationTrench(volL, c.trench.width, c.trench.depth),
    deposito: checkInfiltrationChamber(volL, c.chamber.length, c.chamber.width, c.chamber.depth),
    cisterna: sizeCistern(volL, station.dryHours),
  };

  const budgets = {
    biorretencion: budgetBioretention(sizing.biorretencion),
    permeable: budgetPermeable(sizing.permeable),
    zanja: budgetTrench(sizing.zanja),
    deposito: budgetChamber(sizing.deposito),
    cisterna: budgetCistern(sizing.cisterna),
  };

  const drawdown = {};
  if (c.soilK > 0) {
    ["biorretencion", "permeable", "zanja", "deposito"].forEach((id) => {
      const inf = infiltrationArea(id, sizing[id]);
      const hours = drawdownHours(inf.stored, inf.area, c.soilK);
      drawdown[id] = { ...assessDrawdown(hours, c.soilK, station.dryHours), area: inf.area, stored: inf.stored };
    });
  }

  return { volL, runoff, sizing, budgets, drawdown };
}
