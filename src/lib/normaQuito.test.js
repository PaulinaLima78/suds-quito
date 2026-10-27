// Pruebas del tanque de retención según el estándar municipal · `npm test`
import { describe, it, expect } from "vitest";
import {
  idfIntensity, nearestIdfStation, suggestIdfStation, weightedC, tabla1Volume, retentionVolume,
  diametersFor, emptying, sizeNormTank, budgetNormTank,
} from "./normaQuito.js";
import { IDF_STATIONS } from "../data/normaQuito.js";

const st = (id) => IDF_STATIONS.find((s) => s.id === id);

describe("IDF EMAAP-Q", () => {
  it("Iñaquito, TR 5, 30 min ≈ 48.9 mm/h", () => {
    expect(idfIntensity(st("inaquito"), 5, 30)).toBeCloseTo(48.9, 0);
  });
  it("la intensidad crece con TR y baja con la duración", () => {
    IDF_STATIONS.forEach((s) => {
      expect(idfIntensity(s, 10, 30)).toBeGreaterThan(idfIntensity(s, 5, 30));
      expect(idfIntensity(s, 5, 60)).toBeLessThan(idfIntensity(s, 5, 30));
    });
  });
  it("las 6 estaciones dan valores plausibles (TR5, 30 min: 20–120 mm/h)", () => {
    IDF_STATIONS.forEach((s) => {
      const i = idfIntensity(s, 5, 30);
      expect(i).toBeGreaterThan(20);
      expect(i).toBeLessThan(120);
    });
  });
  it("estación IDF más cercana: sur → Izobamba, centro → Observatorio", () => {
    expect(nearestIdfStation(-0.36, -78.55).id).toBe("izobamba");
    expect(nearestIdfStation(-0.21, -78.50).id).toBe("observatorio");
  });
  it("sugerencia según el estándar: Solanda → Izobamba, Cumbayá → La Tola, Carcelén → Aeropuerto, Centro → Observatorio", () => {
    expect(suggestIdfStation(-0.2817, -78.5307).id).toBe("izobamba");
    expect(suggestIdfStation(-0.2134, -78.4300).id).toBe("la_tola");
    expect(suggestIdfStation(-0.0950, -78.4750).id).toBe("aeropuerto");
    expect(suggestIdfStation(-0.2200, -78.5130).id).toBe("observatorio");
  });
});

describe("tabla 1 y fórmula de volumen", () => {
  it("volúmenes mínimos por área de aporte", () => {
    expect(tabla1Volume(120)).toBe(5);
    expect(tabla1Volume(500)).toBe(5);
    expect(tabla1Volume(501)).toBe(10);
    expect(tabla1Volume(1200)).toBe(10);
    expect(tabla1Volume(1800)).toBe(15);
    expect(tabla1Volume(2500)).toBe(20);
    expect(tabla1Volume(2501)).toBeNull();
  });
  it("C ponderado", () => {
    expect(weightedC(100, 0.3, 300, 0.8)).toBeCloseTo(0.675, 9);
  });
  it("V = ΔC·I·A(ha)/6·T_RET", () => {
    // ΔC 0.5, I 48.9, 500 m² = 0.05 ha, 30 min → 6.11 m³
    expect(retentionVolume(0.8, 0.3, 48.9, 500, 30)).toBeCloseTo(6.1125, 4);
  });
  it("el orden de magnitud es coherente con la Tabla 1 (lote 500 m² urbanizado ≈ 5 m³)", () => {
    const v = retentionVolume(0.8, 0.3, idfIntensity(st("inaquito"), 5, 30), 500, 30);
    expect(v).toBeGreaterThan(3);
    expect(v).toBeLessThan(10);
  });
  it("sin cambio de cobertura, ΔC = 0 → V calculado 0 y rige el mínimo", () => {
    expect(retentionVolume(0.5, 0.5, 50, 1000, 30)).toBe(0);
  });
});

describe("diámetros y vaciado", () => {
  it("tablas 5 y 6", () => {
    expect(diametersFor(5)).toMatchObject({ descarga: 50, desborde: 63 });
    expect(diametersFor(12)).toMatchObject({ descarga: 50, desborde: 63 });
    expect(diametersFor(20)).toMatchObject({ descarga: 63, desborde: 90 });
    expect(diametersFor(21)).toBeNull();
  });
  it("vaciado por orificio: T = 2V/Qv", () => {
    const { qv, minutes } = emptying(5, 50, 1);
    expect(qv).toBeCloseTo(0.6 * Math.PI * 0.05 ** 2 / 4 * Math.sqrt(2 * 9.77 * 1), 9);
    expect(minutes).toBeCloseTo((2 * 5) / qv / 60, 9);
  });
});

describe("caso completo", () => {
  const base = {
    area: 300, impFinal: 240, impInitial: 0, coverFinal: "pasto100_plano", coverInitial: "pasto100_plano",
    imperviousType: "techo", ocupacion: "residencial", idfId: "inaquito", duration: 30, tret: 30, usefulHeight: 1,
  };
  it("lote pequeño residencial: rige el mínimo de 5 m³", () => {
    const r = sizeNormTank(base);
    expect(r.tr).toBe(5);
    expect(r.vTable).toBe(5);
    expect(r.vDesign).toBeGreaterThanOrEqual(5);
    expect(r.totalHeight).toBeCloseTo(0.4 + 1 + 0.5, 9);
    expect(r.diam.descarga).toBe(50);
    expect(r.reusoObligatorio).toBe(false);
  });
  it("duración menor a 30 min se corrige con aviso", () => {
    const r = sizeNormTank({ ...base, duration: 10 });
    expect(r.duration).toBe(30);
    expect(r.warnings.length).toBeGreaterThan(0);
  });
  it("lote grande: sin tabla, pide memoria de cálculo", () => {
    const r = sizeNormTank({ ...base, area: 6000, impFinal: 5000, tret: 45 });
    expect(r.bigLot).toBe(true);
    expect(r.vTable).toBeNull();
    expect(r.vDesign).toBeCloseTo(r.vCalc, 9);
    expect(r.diam).toBeNull();
  });
  it("ocupación comercial mayor usa TR 10 y C de la columna 10", () => {
    const r = sizeNormTank({ ...base, ocupacion: "centro_comercial" });
    expect(r.tr).toBe(10);
    expect(r.cImp).toBe(0.83);
  });
  it("reúso obligatorio > 12 pisos o > 2500 m² útiles", () => {
    expect(sizeNormTank({ ...base, pisos: 13 }).reusoObligatorio).toBe(true);
    expect(sizeNormTank({ ...base, areaUtil: 3000 }).reusoObligatorio).toBe(true);
  });
  it("presupuesto sin valores negativos", () => {
    budgetNormTank(sizeNormTank(base)).items.forEach((i) => expect(i.qty).toBeGreaterThan(0));
  });
});
