import { describe, expect, it } from "vitest";
import {
  computeSale,
  fillTemplate,
  pickLoyaltyRule,
  segmentFor,
  whatsappNumber,
} from "../src/lib/domain";

describe("pickLoyaltyRule", () => {
  const rules = [
    { id: 1, name: "3ra", visits_required: 3, discount_pct: 20, active: 1 },
    { id: 2, name: "3ra vip", visits_required: 3, discount_pct: 30, active: 1 },
    { id: 3, name: "5ta", visits_required: 5, discount_pct: 50, active: 0 },
  ];
  it("aplica en la visita exacta y elige el mayor descuento", () => {
    expect(pickLoyaltyRule(rules, 3)?.id).toBe(2);
    expect(pickLoyaltyRule(rules, 2)).toBeNull();
  });
  it("ignora reglas inactivas", () => {
    expect(pickLoyaltyRule(rules, 5)).toBeNull();
  });
});

describe("computeSale", () => {
  it("descuenta solo el servicio y calcula comisión por %", () => {
    const t = computeSale({
      servicePrice: 10000,
      products: [{ unitPrice: 5000, qty: 2 }],
      discountPct: 20,
      barberCommissionPct: 50,
      serviceFixedCommission: null,
    });
    expect(t).toEqual({
      serviceGross: 10000,
      discountAmount: 2000,
      serviceNet: 8000,
      productsTotal: 10000,
      total: 18000,
      commission: 4000,
    });
  });
  it("la tasa fija por servicio pisa al porcentaje", () => {
    const t = computeSale({
      servicePrice: 10000,
      products: [],
      discountPct: 0,
      barberCommissionPct: 50,
      serviceFixedCommission: 3500,
    });
    expect(t.commission).toBe(3500);
  });
});

describe("segmentFor", () => {
  it("clasifica según visitas y días", () => {
    expect(segmentFor(2, 1)).toBe("fiel");
    expect(segmentFor(1, 15)).toBe("regular");
    expect(segmentFor(0, 25)).toBe("regular");
    expect(segmentFor(0, 26)).toBe("otro");
    expect(segmentFor(0, 31)).toBe("riesgo");
    expect(segmentFor(0, null)).toBe("otro");
  });
});

describe("whatsapp", () => {
  it("normaliza números argentinos", () => {
    expect(whatsappNumber("11 2345-6789", "549")).toBe("5491123456789");
    expect(whatsappNumber("011 2345-6789", "549")).toBe("5491123456789");
    expect(whatsappNumber("+54 9 11 2345 6789", "549")).toBe("5491123456789");
    expect(whatsappNumber("+54 11 2345 6789", "549")).toBe("5491123456789");
  });
  it("completa plantillas", () => {
    expect(fillTemplate("Hola {nombre}, {x}", { nombre: "Juan" })).toBe(
      "Hola Juan, {x}",
    );
  });
});
