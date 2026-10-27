// Pruebas automáticas del núcleo de cálculo · ejecutar con `npm test`
import { describe, it, expect } from "vitest";
import {
  runoffVolumeL, runoffDepthCN, designRunoff,
  sizeBioretention, sizePermeablePavement, sizeInfiltrationTrench,
  checkInfiltrationChamber, sizeCistern,
  drawdownHours, assessDrawdown, infiltrationArea,
  gumbelReducedVariate, gumbelFromQuantiles,
} from "./hydrology.js";
import { budgetBioretention, budgetCistern, budgetPermeable, calcBudget } from "./budget.js";
import { idwRainfall, virtualStation, monthsMissing, designRain, haversineKm } from "./climate.js";
import { computeCase } from "./compute.js";
import { readUrlState, buildQuery } from "./urlState.js";
import { STATIONS } from "../data/stations.js";
import { SURFACES } from "../data/catalogs.js";

const techo = SURFACES[0];
const byId = (id) => STATIONS.find((s) => s.id === id);

describe("escorrentía", () => {
  it("1 mm sobre 1 m² con C=1 es 1 litro", () => {
    expect(runoffVolumeL(1, 1, 1)).toBe(1);
  });
  it("caso de referencia: 20.1 mm × 80 m² × 0.9 = 1447.2 L", () => {
    expect(runoffVolumeL(20.1, 80, 0.9)).toBeCloseTo(1447.2, 6);
  });
  it("NRCS CN: sin escorrentía si P ≤ Ia", () => {
    // CN 74 → S = 89.2 mm, Ia = 17.8 mm
    expect(runoffDepthCN(15, 74)).toBe(0);
    expect(runoffDepthCN(30, 74)).toBeGreaterThan(0);
  });
  it("NRCS CN 98 con 20 mm ≈ 14.9 mm", () => {
    expect(runoffDepthCN(20, 98)).toBeCloseTo(14.9, 1);
  });
  it("NRCS CN nunca supera la lluvia", () => {
    [5, 20, 60, 200].forEach((p) => expect(runoffDepthCN(p, 99)).toBeLessThanOrEqual(p));
  });
  it("designRunoff con método 'coef' coincide con v1", () => {
    expect(designRunoff("coef", 20.1, 80, techo).volL).toBeCloseTo(1447.2, 6);
  });
});

describe("dimensionamiento (mismos resultados que v1)", () => {
  const volL = 1447.2;
  it("biorretención: A = V / (0.20 + 0.45·0.30)", () => {
    const r = sizeBioretention(volL, 80);
    expect(r.areaM2).toBeCloseTo(1.4472 / 0.335, 6);
    expect(r.pctOfAportante).toBeCloseTo((1.4472 / 0.335 / 80) * 100, 6);
  });
  it("pavimento permeable: espesor limitado a 15–60 cm", () => {
    const r = sizePermeablePavement(volL, 80);
    expect(r.baseDepth).toBe(0.15);
    expect(r.coverage).toBe(100);
    const big = sizePermeablePavement(100000, 20);
    expect(big.baseDepth).toBe(0.6);
    expect(big.coverage).toBeLessThan(100);
  });
  it("zanja: L = V / (a·p·0.35)", () => {
    const r = sizeInfiltrationTrench(volL, 1, 1.5);
    expect(r.length).toBeCloseTo(1.4472 / (1 * 1.5 * 0.35), 6);
  });
  it("depósito: verifica cobertura", () => {
    const r = checkInfiltrationChamber(volL, 5, 3, 2);
    expect(r.captureVolumeM3).toBeCloseTo(10.5, 6);
    expect(r.sufficient).toBe(true);
  });
  it("cisterna: V × 1.1 y diámetro para h = 1.5 m", () => {
    const r = sizeCistern(volL, 16);
    expect(r.volumeM3).toBeCloseTo(1.59192, 5);
    expect(Math.PI / 4 * r.diameter ** 2 * 1.5).toBeCloseTo(r.volumeM3, 6);
    expect(r.emptyByHours).toBe(12);
  });
});

describe("presupuesto", () => {
  it("total = subtotal × 1.20", () => {
    const b = calcBudget([{ qty: 10, p: 2 }]);
    expect(b.subtotal).toBe(20);
    expect(b.total).toBeCloseTo(24, 9);
  });
  it("biorretención: la excavación usa la geometría, no el volumen de agua", () => {
    const r = sizeBioretention(1447.2, 80);
    const b = budgetBioretention(r);
    const exc = b.items[0].qty;
    expect(exc).toBeCloseTo(r.areaM2 * 0.8, 6);
    expect(exc).toBeGreaterThan(r.volumeM3);
  });
  it("cisterna: la excavación es mayor que el volumen útil", () => {
    const r = sizeCistern(1447.2, 16);
    expect(budgetCistern(r).items[0].qty).toBeGreaterThan(r.volumeM3);
  });
  it("pavimento: excava base + adoquín", () => {
    const r = sizePermeablePavement(1447.2, 80);
    expect(budgetPermeable(r).items[0].qty).toBeCloseTo(80 * (0.15 + 0.14), 6);
  });
  it("no hay cantidades negativas ni NaN", () => {
    const res = computeCase({
      station: byId("inaquito"), rainMm: 18.3, area: 120, surface: techo, method: "coef",
      pavementArea: 120, trench: { width: 1, depth: 1.5 }, chamber: { length: 5, width: 3, depth: 2 }, soilK: 3.4,
    });
    Object.values(res.budgets).forEach((b) =>
      b.items.forEach((i) => {
        expect(Number.isFinite(i.qty)).toBe(true);
        expect(i.qty).toBeGreaterThanOrEqual(0);
      })
    );
  });
});

describe("infiltración", () => {
  it("tiempo de vaciado con factor de seguridad 2", () => {
    // 1 m³ sobre 1 m² con k = 10 mm/h → k_diseño = 0.005 m/h → 200 h
    expect(drawdownHours(1, 1, 10)).toBeCloseTo(200, 6);
  });
  it("suelo impermeable → nunca se vacía", () => {
    expect(drawdownHours(1, 1, 0)).toBe(Infinity);
    expect(assessDrawdown(Infinity, 0, 16).level).toBe("malo");
  });
  it("clasificación por umbrales 48/72 h", () => {
    expect(assessDrawdown(24, 10, 16).level).toBe("ok");
    expect(assessDrawdown(60, 10, 16).level).toBe("limite");
    expect(assessDrawdown(100, 10, 16).level).toBe("malo");
    expect(assessDrawdown(10, 10, 16).beforeNextEvent).toBe(true);
  });
  it("zanja: fondo + paredes hasta media altura", () => {
    const inf = infiltrationArea("zanja", { length: 10, width: 1, depth: 2, volumeM3: 3 });
    expect(inf.area).toBe(10 + 2 * 10 * 1);
  });
});

describe("Gumbel: la tabla de cada estación es coherente", () => {
  it("variable reducida TR2 ≈ 0.3665", () => {
    expect(gumbelReducedVariate(2)).toBeCloseTo(0.3665, 4);
  });
  STATIONS.forEach((s) => {
    it(`${s.code} ${s.name}: TR10 y TR25 se deducen de TR2 y TR5`, () => {
      const { u, beta } = gumbelFromQuantiles(s.tr2_mm, 2, s.tr5_mm, 5);
      expect(u + beta * gumbelReducedVariate(10)).toBeCloseTo(s.tr10_mm, 0);
      expect(Math.abs(u + beta * gumbelReducedVariate(25) - s.tr25_mm)).toBeLessThan(0.3);
    });
    it(`${s.code}: intensidad TR = lluvia / 2 h`, () => {
      expect(Math.abs(s.int_tr2 - s.tr2_mm / 2)).toBeLessThan(0.11);
    });
  });
});

describe("interpolación IDW", () => {
  it("en una estación devuelve el valor de esa estación", () => {
    const s = byId("inaquito");
    const r = idwRainfall(s.lat, s.lon, STATIONS, "p90Duracion");
    expect(r.method).toBe("nearest_station");
    expect(r.value).toBe(s.p90Duracion);
  });
  it("entre estaciones queda dentro del rango de las 4 más cercanas", () => {
    const r = idwRainfall(-0.19, -78.5, STATIONS, "p90Duracion");
    const vals = r.stations.map((x) => x.value);
    expect(r.value).toBeGreaterThanOrEqual(Math.min(...vals));
    expect(r.value).toBeLessThanOrEqual(Math.max(...vals));
    expect(r.stations.reduce((a, x) => a + x.weight, 0)).toBeCloseTo(1, 9);
  });
  it("estación virtual tiene todos los campos de diseño", () => {
    const v = virtualStation(-0.19, -78.5, STATIONS);
    ["p90Duracion", "p95Extremos", "tr2_mm", "tr25_mm", "dryHours"].forEach((f) =>
      expect(Number.isFinite(v[f])).toBe(true)
    );
    expect(v.climatologia).toHaveLength(12);
    expect(v.reliable).toBe(true);
  });
  it("punto lejano (Guayaquil) se marca como poco fiable", () => {
    expect(virtualStation(-2.19, -79.88, STATIONS).reliable).toBe(false);
  });
  it("haversine Iñaquito–Cumbayá ≈ 7.5 km", () => {
    expect(haversineKm(-0.178354, -78.48768, -0.213443, -78.42996)).toBeCloseTo(7.5, 0);
  });
});

describe("datos", () => {
  it("Rumihurco 2024 tiene 3 meses sin registro", () => {
    expect(monthsMissing(byId("rumihurco").nino2024)).toBe(3);
  });
  it("estaciones del norte rotuladas como Norte", () => {
    ["rumihurco", "collaloma_medio", "colinas_alto"].forEach((id) =>
      expect(byId(id).zona.startsWith("Norte")).toBe(true)
    );
  });
  it("designRain respeta el valor personalizado", () => {
    expect(designRain(byId("cumbaya"), "custom", "60")).toBe(60);
    expect(designRain(byId("cumbaya"), "tr10", "")).toBe(46.2);
  });
});

describe("enlace compartible", () => {
  it("ida y vuelta", () => {
    const q = buildQuery({ stationId: "cumbaya", area: "80", scenario: "p95" }, { scenario: "p90" });
    expect(readUrlState(q)).toEqual({ stationId: "cumbaya", area: "80", scenario: "p95" });
  });
  it("omite valores por defecto", () => {
    expect(buildQuery({ scenario: "p90" }, { scenario: "p90" })).toBe("");
  });
});
