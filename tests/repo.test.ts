import { beforeEach, describe, expect, it } from "vitest";
import { openDb, type DB } from "../src/lib/db";
import * as repo from "../src/lib/repo";
import type { PaymentMethod } from "../src/lib/domain";

let db: DB;
let barber: number, corte: number, cera: number, client: number;

beforeEach(() => {
  db = openDb(":memory:");
  barber = repo.saveBarber(db, { name: "Leo", commission_pct: 50 });
  corte = repo.saveService(db, { name: "Corte", price: 10000, fixed_commission: null });
  cera = repo.saveProduct(db, { name: "Cera", price: 6000, stock: 2, min_stock: 1 });
  client = repo.createClient(db, {
    dni: "30.123.456",
    first_name: "Juan",
    last_name: "Pérez",
    phone: "11 2345-6789",
  });
});

const sale = (day: string, extra: Partial<repo.SaleRequest & { paymentMethod: PaymentMethod }> = {}) =>
  repo.registerSale(
    db,
    {
      clientId: client,
      barberId: barber,
      serviceId: corte,
      items: [],
      paymentMethod: "efectivo",
      ...extra,
    },
    `${day} 12:00:00`,
  );

describe("flujo de caja", () => {
  it("exige caja abierta para cobrar", () => {
    expect(() => sale("2026-10-01")).toThrow(/Abrí la caja/);
  });

  it("busca por DNI y por teléfono", () => {
    expect(repo.searchClients(db, "30123456")).toHaveLength(1);
    expect(repo.searchClients(db, "1123456789")).toHaveLength(1);
    expect(repo.searchClients(db, "99999999")).toHaveLength(0);
  });

  it("busca por nombre o apellido sin importar acentos ni mayúsculas", () => {
    expect(repo.searchClients(db, "jua")).toHaveLength(1);
    expect(repo.searchClients(db, "PEREZ")).toHaveLength(1);
    expect(repo.searchClients(db, "pérez juan")).toHaveLength(1);
    expect(repo.searchClients(db, "Pedro")).toHaveLength(0);
  });

  it("el alta de cliente nuevo exige DNI", () => {
    expect(() =>
      repo.createClient(db, { first_name: "Ana", last_name: "Paz", phone: "11 5555-5555" }),
    ).toThrow(/DNI/);
  });

  it("aplica el descuento en la 3.ª visita del mes y cuenta visitas", () => {
    repo.openCash(db, 5000, "2026-10-01 09:00:00");
    expect(sale("2026-10-01").rule).toBeNull();
    expect(sale("2026-10-08").rule).toBeNull();
    const third = sale("2026-10-15");
    expect(third.visitNumber).toBe(3);
    expect(third.totals.discountAmount).toBe(2000);
    expect(third.totals.commission).toBe(4000);
    expect(repo.getClient(db, client, "2026-10-20 10:00:00")?.visits_month).toBe(3);
    // En noviembre el contador arranca de nuevo
    expect(sale("2026-11-02").visitNumber).toBe(1);
  });

  it("descuenta stock, bloquea sin stock y la anulación lo devuelve", () => {
    repo.openCash(db, 0);
    const s = sale("2026-10-01", { items: [{ productId: cera, qty: 2 }] });
    expect(s.totals.total).toBe(22000);
    expect(repo.listProducts(db)[0].stock).toBe(0);
    expect(() => sale("2026-10-02", { items: [{ productId: cera, qty: 1 }] })).toThrow(
      /Stock insuficiente/,
    );
    repo.voidSale(db, s.saleId);
    expect(repo.listProducts(db)[0].stock).toBe(2);
  });

  it("arqueo: esperado = inicial + efectivo", () => {
    repo.openCash(db, 5000);
    sale("2026-10-01");
    sale("2026-10-01", { paymentMethod: "tarjeta" });
    const b = repo.cashBreakdown(db, repo.getOpenCashSession(db)!.id);
    expect(b).toMatchObject({ efectivo: 10000, tarjeta: 10000, total: 20000, count: 2 });
    const closed = repo.closeCash(db, 14000, "faltante");
    expect(closed.expected).toBe(15000);
    expect(repo.getOpenCashSession(db)).toBeNull();
  });

  it("liquida comisiones por rango", () => {
    repo.openCash(db, 0);
    sale("2026-10-01");
    sale("2026-10-09");
    const r = repo.commissionReport(db, "2026-10-01", "2026-10-07");
    expect(r.lines[0]).toMatchObject({ cuts: 1, commission: 5000 });
    expect(r.detail).toHaveLength(1);
  });

  it("segmenta clientes", () => {
    repo.openCash(db, 0);
    sale("2026-09-01");
    expect(repo.getClient(db, client, "2026-10-05 10:00:00")?.segment).toBe("riesgo");
    expect(repo.getClient(db, client, "2026-09-20 10:00:00")?.segment).toBe("regular");
  });
});
