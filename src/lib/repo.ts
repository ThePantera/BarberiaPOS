import type { DB } from "./db";
import { DEFAULT_SETTINGS, normalizeText } from "./db";
import {
  computeSale,
  digitsOnly,
  expectedCash,
  pickLoyaltyRule,
  segmentFor,
  type LoyaltyRule,
  type PaymentMethod,
  type Segment,
} from "./domain";
import { daysBetween, localDateTime } from "./time";

export class BusinessError extends Error {}

// ---------- Tipos ----------

export type Barber = {
  id: number;
  name: string;
  phone: string | null;
  commission_pct: number;
  active: number;
  created_at: string;
};
export type Service = {
  id: number;
  name: string;
  price: number;
  fixed_commission: number | null;
  active: number;
};
export type Product = {
  id: number;
  name: string;
  price: number;
  stock: number;
  min_stock: number;
  active: number;
};
export type Client = {
  id: number;
  dni: string | null;
  first_name: string;
  last_name: string;
  phone: string;
  notes: string | null;
  created_at: string;
};
export type CashSession = {
  id: number;
  opened_at: string;
  opening_cash: number;
  closed_at: string | null;
  expected_cash: number | null;
  counted_cash: number | null;
  notes: string | null;
};
export type SaleRow = {
  id: number;
  created_at: string;
  client_id: number;
  client_name: string;
  barber_name: string;
  service_name: string;
  service_price: number;
  discount_pct: number;
  discount_amount: number;
  products_total: number;
  total: number;
  payment_method: PaymentMethod;
  commission: number;
};

// ---------- Configuración ----------

export function getSettings(db: DB): Record<string, string> {
  const rows = db.prepare("SELECT key, value FROM settings").all() as {
    key: string;
    value: string;
  }[];
  const out = { ...DEFAULT_SETTINGS };
  for (const r of rows) out[r.key] = r.value;
  return out;
}

export function setSettings(db: DB, values: Record<string, string>) {
  const stmt = db.prepare(
    "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
  );
  db.transaction(() => {
    for (const [k, v] of Object.entries(values)) stmt.run(k, v);
  })();
}

// ---------- Barberos ----------

export function listBarbers(db: DB, onlyActive = false): Barber[] {
  return db
    .prepare(
      `SELECT * FROM barbers ${onlyActive ? "WHERE active = 1" : ""} ORDER BY active DESC, name`,
    )
    .all() as Barber[];
}

export function saveBarber(
  db: DB,
  b: { id?: number; name: string; phone?: string | null; commission_pct: number },
) {
  if (!b.name.trim()) throw new BusinessError("El nombre es obligatorio.");
  if (!(b.commission_pct >= 0 && b.commission_pct <= 100))
    throw new BusinessError("La comisión debe estar entre 0 y 100%.");
  if (b.id) {
    db.prepare(
      "UPDATE barbers SET name = ?, phone = ?, commission_pct = ? WHERE id = ?",
    ).run(b.name.trim(), b.phone || null, b.commission_pct, b.id);
    return b.id;
  }
  return Number(
    db
      .prepare(
        "INSERT INTO barbers (name, phone, commission_pct, created_at) VALUES (?, ?, ?, ?)",
      )
      .run(b.name.trim(), b.phone || null, b.commission_pct, localDateTime())
      .lastInsertRowid,
  );
}

export function setActive(
  db: DB,
  table: "barbers" | "services" | "products" | "loyalty_rules",
  id: number,
  active: boolean,
) {
  db.prepare(`UPDATE ${table} SET active = ? WHERE id = ?`).run(
    active ? 1 : 0,
    id,
  );
}

// ---------- Catálogo ----------

export function listServices(db: DB, onlyActive = false): Service[] {
  return db
    .prepare(
      `SELECT * FROM services ${onlyActive ? "WHERE active = 1" : ""} ORDER BY active DESC, name`,
    )
    .all() as Service[];
}

export function saveService(
  db: DB,
  s: { id?: number; name: string; price: number; fixed_commission: number | null },
) {
  if (!s.name.trim()) throw new BusinessError("El nombre es obligatorio.");
  if (!(s.price >= 0)) throw new BusinessError("Precio inválido.");
  if (s.id) {
    db.prepare(
      "UPDATE services SET name = ?, price = ?, fixed_commission = ? WHERE id = ?",
    ).run(s.name.trim(), Math.round(s.price), s.fixed_commission, s.id);
    return s.id;
  }
  return Number(
    db
      .prepare(
        "INSERT INTO services (name, price, fixed_commission) VALUES (?, ?, ?)",
      )
      .run(s.name.trim(), Math.round(s.price), s.fixed_commission)
      .lastInsertRowid,
  );
}

export function listProducts(db: DB, onlyActive = false): Product[] {
  return db
    .prepare(
      `SELECT * FROM products ${onlyActive ? "WHERE active = 1" : ""} ORDER BY active DESC, name`,
    )
    .all() as Product[];
}

export function saveProduct(
  db: DB,
  p: { id?: number; name: string; price: number; stock: number; min_stock: number },
) {
  if (!p.name.trim()) throw new BusinessError("El nombre es obligatorio.");
  if (!(p.price >= 0)) throw new BusinessError("Precio inválido.");
  if (p.id) {
    db.prepare(
      "UPDATE products SET name = ?, price = ?, stock = ?, min_stock = ? WHERE id = ?",
    ).run(p.name.trim(), Math.round(p.price), p.stock, p.min_stock, p.id);
    return p.id;
  }
  return Number(
    db
      .prepare(
        "INSERT INTO products (name, price, stock, min_stock) VALUES (?, ?, ?, ?)",
      )
      .run(p.name.trim(), Math.round(p.price), p.stock, p.min_stock)
      .lastInsertRowid,
  );
}

export function adjustStock(db: DB, productId: number, delta: number) {
  db.prepare("UPDATE products SET stock = stock + ? WHERE id = ?").run(
    delta,
    productId,
  );
}

// ---------- Fidelización ----------

export function listLoyaltyRules(db: DB): LoyaltyRule[] {
  return db
    .prepare("SELECT * FROM loyalty_rules ORDER BY visits_required")
    .all() as LoyaltyRule[];
}

export function saveLoyaltyRule(
  db: DB,
  r: { id?: number; name: string; visits_required: number; discount_pct: number },
) {
  if (!(r.visits_required >= 1))
    throw new BusinessError("La cantidad de visitas debe ser 1 o más.");
  if (!(r.discount_pct > 0 && r.discount_pct <= 100))
    throw new BusinessError("El descuento debe estar entre 1 y 100%.");
  const name = r.name.trim() || `${r.visits_required}.ª visita del mes`;
  if (r.id) {
    db.prepare(
      "UPDATE loyalty_rules SET name = ?, visits_required = ?, discount_pct = ? WHERE id = ?",
    ).run(name, r.visits_required, r.discount_pct, r.id);
    return r.id;
  }
  return Number(
    db
      .prepare(
        "INSERT INTO loyalty_rules (name, visits_required, discount_pct) VALUES (?, ?, ?)",
      )
      .run(name, r.visits_required, r.discount_pct).lastInsertRowid,
  );
}

// ---------- Clientes ----------

export type ClientWithStats = Client & {
  visits_month: number;
  visits_total: number;
  total_spent: number;
  last_visit: string | null;
  days_since: number | null;
  segment: Segment;
};

const CLIENT_STATS_SQL = `
  SELECT c.*,
    COALESCE(SUM(CASE WHEN substr(s.created_at, 1, 7) = @month THEN 1 ELSE 0 END), 0) AS visits_month,
    COUNT(s.id) AS visits_total,
    COALESCE(SUM(s.total), 0) AS total_spent,
    MAX(s.created_at) AS last_visit
  FROM clients c
  LEFT JOIN sales s ON s.client_id = c.id
`;

function withSegment(
  row: Omit<ClientWithStats, "days_since" | "segment">,
  now: string,
): ClientWithStats {
  const days_since = row.last_visit ? daysBetween(row.last_visit, now) : null;
  return {
    ...row,
    days_since,
    segment: segmentFor(row.visits_month, days_since),
  };
}

export function searchClients(db: DB, query: string, now = localDateTime()) {
  const q = query.trim();
  if (!q) return [];
  // Solo números (con espacios, guiones, +) = DNI o teléfono; si no, nombre
  const digits = /^[\d\s\-+.()]+$/.test(q) ? digitsOnly(q) : "";
  const name = normalizeText(q).replace(/\s+/g, " ");
  const rows = db
    .prepare(
      `${CLIENT_STATS_SQL}
       WHERE (@digits != '' AND (c.dni = @digits OR replace(replace(replace(c.phone, ' ', ''), '-', ''), '+', '') LIKE '%' || @digits))
          OR (@digits = '' AND (norm(c.first_name || ' ' || c.last_name) LIKE '%' || @name || '%'
                                 OR norm(c.last_name || ' ' || c.first_name) LIKE '%' || @name || '%'))
       GROUP BY c.id ORDER BY c.last_name, c.first_name LIMIT 20`,
    )
    .all({ month: now.slice(0, 7), digits, name }) as Omit<
    ClientWithStats,
    "days_since" | "segment"
  >[];
  return rows.map((r) => withSegment(r, now));
}

export function listClientsWithStats(db: DB, now = localDateTime()) {
  const rows = db
    .prepare(`${CLIENT_STATS_SQL} GROUP BY c.id ORDER BY last_visit DESC`)
    .all({ month: now.slice(0, 7) }) as Omit<
    ClientWithStats,
    "days_since" | "segment"
  >[];
  return rows.map((r) => withSegment(r, now));
}

export function getClient(db: DB, id: number, now = localDateTime()) {
  const row = db
    .prepare(`${CLIENT_STATS_SQL} WHERE c.id = @id GROUP BY c.id`)
    .get({ month: now.slice(0, 7), id }) as
    | Omit<ClientWithStats, "days_since" | "segment">
    | undefined;
  return row ? withSegment(row, now) : null;
}

export function clientHistory(db: DB, clientId: number, limit = 50) {
  return db
    .prepare(
      `${SALES_SELECT} WHERE s.client_id = ? ORDER BY s.created_at DESC LIMIT ?`,
    )
    .all(clientId, limit) as SaleRow[];
}

export function createClient(
  db: DB,
  c: { dni?: string; first_name: string; last_name: string; phone: string },
) {
  const first = c.first_name.trim();
  const last = c.last_name.trim();
  const phone = c.phone.trim();
  const dni = c.dni ? digitsOnly(c.dni) : "";
  if (!first || !last) throw new BusinessError("Nombre y apellido son obligatorios.");
  if (digitsOnly(phone).length < 6) throw new BusinessError("Teléfono inválido.");
  if (dni.length < 6) throw new BusinessError("Ingresá el DNI del cliente.");
  const dup = db.prepare("SELECT id FROM clients WHERE dni = ?").get(dni);
  if (dup) throw new BusinessError("Ya existe un cliente con ese DNI.");
  return Number(
    db
      .prepare(
        "INSERT INTO clients (dni, first_name, last_name, phone, created_at) VALUES (?, ?, ?, ?, ?)",
      )
      .run(dni, first, last, phone, localDateTime()).lastInsertRowid,
  );
}

export function updateClient(
  db: DB,
  c: {
    id: number;
    dni?: string;
    first_name: string;
    last_name: string;
    phone: string;
    notes?: string;
  },
) {
  const dni = c.dni ? digitsOnly(c.dni) : "";
  if (!c.first_name.trim() || !c.last_name.trim())
    throw new BusinessError("Nombre y apellido son obligatorios.");
  if (dni) {
    const dup = db
      .prepare("SELECT id FROM clients WHERE dni = ? AND id != ?")
      .get(dni, c.id);
    if (dup) throw new BusinessError("Ya existe otro cliente con ese DNI.");
  }
  db.prepare(
    "UPDATE clients SET dni = ?, first_name = ?, last_name = ?, phone = ?, notes = ? WHERE id = ?",
  ).run(
    dni || null,
    c.first_name.trim(),
    c.last_name.trim(),
    c.phone.trim(),
    c.notes?.trim() || null,
    c.id,
  );
}

// ---------- Caja ----------

export function getOpenCashSession(db: DB): CashSession | null {
  return (
    (db
      .prepare(
        "SELECT * FROM cash_sessions WHERE closed_at IS NULL ORDER BY id DESC LIMIT 1",
      )
      .get() as CashSession | undefined) ?? null
  );
}

export function openCash(db: DB, openingCash: number, now = localDateTime()) {
  if (getOpenCashSession(db))
    throw new BusinessError("Ya hay una caja abierta.");
  if (!(openingCash >= 0))
    throw new BusinessError("El efectivo inicial no puede ser negativo.");
  return Number(
    db
      .prepare(
        "INSERT INTO cash_sessions (opened_at, opening_cash) VALUES (?, ?)",
      )
      .run(now, Math.round(openingCash)).lastInsertRowid,
  );
}

export type CashBreakdown = {
  efectivo: number;
  transferencia: number;
  tarjeta: number;
  total: number;
  count: number;
  commissions: number;
};

export function cashBreakdown(db: DB, sessionId: number): CashBreakdown {
  const rows = db
    .prepare(
      `SELECT payment_method, SUM(total) AS total, COUNT(*) AS n, SUM(commission) AS comm
       FROM sales WHERE cash_session_id = ? GROUP BY payment_method`,
    )
    .all(sessionId) as {
    payment_method: PaymentMethod;
    total: number;
    n: number;
    comm: number;
  }[];
  const out: CashBreakdown = {
    efectivo: 0,
    transferencia: 0,
    tarjeta: 0,
    total: 0,
    count: 0,
    commissions: 0,
  };
  for (const r of rows) {
    out[r.payment_method] = r.total;
    out.total += r.total;
    out.count += r.n;
    out.commissions += r.comm;
  }
  return out;
}

export function closeCash(
  db: DB,
  countedCash: number,
  notes: string,
  now = localDateTime(),
) {
  const session = getOpenCashSession(db);
  if (!session) throw new BusinessError("No hay una caja abierta.");
  if (!(countedCash >= 0))
    throw new BusinessError("El efectivo contado no puede ser negativo.");
  const b = cashBreakdown(db, session.id);
  const expected = expectedCash(session.opening_cash, b.efectivo);
  db.prepare(
    "UPDATE cash_sessions SET closed_at = ?, expected_cash = ?, counted_cash = ?, notes = ? WHERE id = ?",
  ).run(now, expected, Math.round(countedCash), notes.trim() || null, session.id);
  return { sessionId: session.id, expected, counted: Math.round(countedCash) };
}

export function listCashSessions(db: DB, limit = 30) {
  return db
    .prepare("SELECT * FROM cash_sessions ORDER BY id DESC LIMIT ?")
    .all(limit) as CashSession[];
}

// ---------- Ventas ----------

const SALES_SELECT = `
  SELECT s.id, s.created_at, s.client_id,
    c.first_name || ' ' || c.last_name AS client_name,
    b.name AS barber_name, sv.name AS service_name,
    s.service_price, s.discount_pct, s.discount_amount, s.products_total,
    s.total, s.payment_method, s.commission
  FROM sales s
  JOIN clients c ON c.id = s.client_id
  JOIN barbers b ON b.id = s.barber_id
  JOIN services sv ON sv.id = s.service_id
`;

export function listSalesForSession(db: DB, sessionId: number) {
  return db
    .prepare(
      `${SALES_SELECT} WHERE s.cash_session_id = ? ORDER BY s.created_at DESC`,
    )
    .all(sessionId) as SaleRow[];
}

export type SaleRequest = {
  clientId: number;
  barberId: number;
  serviceId: number;
  items: { productId: number; qty: number }[];
};

export function visitsInMonth(db: DB, clientId: number, month: string) {
  return (
    db
      .prepare(
        "SELECT COUNT(*) AS n FROM sales WHERE client_id = ? AND substr(created_at, 1, 7) = ?",
      )
      .get(clientId, month) as { n: number }
  ).n;
}

/** Calcula el ticket (sin guardarlo): precios, alerta de fidelidad y comisión. */
export function previewSale(db: DB, req: SaleRequest, now = localDateTime()) {
  const client = db
    .prepare("SELECT * FROM clients WHERE id = ?")
    .get(req.clientId) as Client | undefined;
  if (!client) throw new BusinessError("Cliente inexistente.");
  const barber = db
    .prepare("SELECT * FROM barbers WHERE id = ? AND active = 1")
    .get(req.barberId) as Barber | undefined;
  if (!barber) throw new BusinessError("Seleccioná un barbero.");
  const service = db
    .prepare("SELECT * FROM services WHERE id = ? AND active = 1")
    .get(req.serviceId) as Service | undefined;
  if (!service) throw new BusinessError("Seleccioná un servicio.");

  const merged = new Map<number, number>();
  for (const it of req.items) {
    if (it.qty > 0) merged.set(it.productId, (merged.get(it.productId) ?? 0) + it.qty);
  }
  const items = [...merged].map(([productId, qty]) => {
    const p = db
      .prepare("SELECT * FROM products WHERE id = ? AND active = 1")
      .get(productId) as Product | undefined;
    if (!p) throw new BusinessError("Producto inexistente.");
    if (p.stock < qty)
      throw new BusinessError(`Stock insuficiente de ${p.name} (quedan ${p.stock}).`);
    return { product: p, qty };
  });

  const visitNumber = visitsInMonth(db, client.id, now.slice(0, 7)) + 1;
  const rule = pickLoyaltyRule(listLoyaltyRules(db), visitNumber);
  const totals = computeSale({
    servicePrice: service.price,
    products: items.map((i) => ({ unitPrice: i.product.price, qty: i.qty })),
    discountPct: rule?.discount_pct ?? 0,
    barberCommissionPct: barber.commission_pct,
    serviceFixedCommission: service.fixed_commission,
  });
  return { client, barber, service, items, visitNumber, rule, totals };
}

/**
 * Cierre del cobro: impacta en la caja abierta, registra la comisión,
 * descuenta stock y suma la visita del mes del cliente (la visita es la venta).
 */
export function registerSale(
  db: DB,
  req: SaleRequest & { paymentMethod: PaymentMethod },
  now = localDateTime(),
) {
  return db.transaction(() => {
    const session = getOpenCashSession(db);
    if (!session)
      throw new BusinessError("Abrí la caja antes de registrar cobros.");
    const p = previewSale(db, req, now);
    const saleId = Number(
      db
        .prepare(
          `INSERT INTO sales (client_id, barber_id, service_id, cash_session_id, created_at,
             service_price, discount_pct, discount_amount, loyalty_rule_id, products_total,
             total, payment_method, commission)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          p.client.id,
          p.barber.id,
          p.service.id,
          session.id,
          now,
          p.totals.serviceGross,
          p.rule?.discount_pct ?? 0,
          p.totals.discountAmount,
          p.rule?.id ?? null,
          p.totals.productsTotal,
          p.totals.total,
          req.paymentMethod,
          p.totals.commission,
        ).lastInsertRowid,
    );
    const insItem = db.prepare(
      "INSERT INTO sale_items (sale_id, product_id, qty, unit_price) VALUES (?, ?, ?, ?)",
    );
    for (const it of p.items) {
      insItem.run(saleId, it.product.id, it.qty, it.product.price);
      adjustStock(db, it.product.id, -it.qty);
    }
    return { saleId, ...p };
  })();
}

/** Anula un cobro de la caja abierta y devuelve el stock. */
export function voidSale(db: DB, saleId: number) {
  db.transaction(() => {
    const sale = db
      .prepare(
        `SELECT s.id FROM sales s JOIN cash_sessions cs ON cs.id = s.cash_session_id
         WHERE s.id = ? AND cs.closed_at IS NULL`,
      )
      .get(saleId);
    if (!sale)
      throw new BusinessError("Solo se pueden anular cobros de la caja abierta.");
    const items = db
      .prepare("SELECT product_id, qty FROM sale_items WHERE sale_id = ?")
      .all(saleId) as { product_id: number; qty: number }[];
    for (const it of items) adjustStock(db, it.product_id, it.qty);
    db.prepare("DELETE FROM sale_items WHERE sale_id = ?").run(saleId);
    db.prepare("DELETE FROM sales WHERE id = ?").run(saleId);
  })();
}

// ---------- Liquidación de comisiones ----------

export type CommissionLine = {
  barber_id: number;
  barber_name: string;
  commission_pct: number;
  cuts: number;
  service_net: number;
  commission: number;
};

/** `from` y `to` son fechas YYYY-MM-DD inclusive. */
export function commissionReport(db: DB, from: string, to: string) {
  const range = { from: `${from} 00:00:00`, to: `${to} 23:59:59` };
  const lines = db
    .prepare(
      `SELECT b.id AS barber_id, b.name AS barber_name, b.commission_pct,
         COUNT(s.id) AS cuts,
         COALESCE(SUM(s.service_price - s.discount_amount), 0) AS service_net,
         COALESCE(SUM(s.commission), 0) AS commission
       FROM barbers b
       LEFT JOIN sales s ON s.barber_id = b.id AND s.created_at BETWEEN @from AND @to
       GROUP BY b.id
       HAVING b.active = 1 OR cuts > 0
       ORDER BY commission DESC, b.name`,
    )
    .all(range) as CommissionLine[];
  const detail = db
    .prepare(
      `${SALES_SELECT} WHERE s.created_at BETWEEN @from AND @to ORDER BY b.name, s.created_at`,
    )
    .all(range) as SaleRow[];
  return { lines, detail };
}
