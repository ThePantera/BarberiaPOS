import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { seedDemo } from "./seed";

export type DB = Database.Database;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS barbers (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  commission_pct REAL NOT NULL DEFAULT 50,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS services (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  price INTEGER NOT NULL,
  fixed_commission INTEGER,
  active INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  price INTEGER NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS clients (
  id INTEGER PRIMARY KEY,
  dni TEXT UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS clients_phone ON clients(phone);
CREATE TABLE IF NOT EXISTS loyalty_rules (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  visits_required INTEGER NOT NULL,
  discount_pct REAL NOT NULL,
  active INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS cash_sessions (
  id INTEGER PRIMARY KEY,
  opened_at TEXT NOT NULL,
  opening_cash INTEGER NOT NULL,
  closed_at TEXT,
  expected_cash INTEGER,
  counted_cash INTEGER,
  notes TEXT
);
CREATE TABLE IF NOT EXISTS sales (
  id INTEGER PRIMARY KEY,
  client_id INTEGER NOT NULL REFERENCES clients(id),
  barber_id INTEGER NOT NULL REFERENCES barbers(id),
  service_id INTEGER NOT NULL REFERENCES services(id),
  cash_session_id INTEGER NOT NULL REFERENCES cash_sessions(id),
  created_at TEXT NOT NULL,
  service_price INTEGER NOT NULL,
  discount_pct REAL NOT NULL DEFAULT 0,
  discount_amount INTEGER NOT NULL DEFAULT 0,
  loyalty_rule_id INTEGER REFERENCES loyalty_rules(id),
  products_total INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('efectivo','transferencia','tarjeta')),
  commission INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS sales_client ON sales(client_id, created_at);
CREATE INDEX IF NOT EXISTS sales_created ON sales(created_at);
CREATE TABLE IF NOT EXISTS sale_items (
  id INTEGER PRIMARY KEY,
  sale_id INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  qty INTEGER NOT NULL,
  unit_price INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`;

export const DEFAULT_SETTINGS: Record<string, string> = {
  shop_name: "Grovee Barber",
  whatsapp_prefix: "549",
  tpl_fiel:
    "¡Hola {nombre}! Gracias por elegirnos {visitas} veces este mes en {barberia}. Tu próxima visita tiene un beneficio especial 💈",
  tpl_regular:
    "¡Hola {nombre}! Ya pasaron {dias} días desde tu último corte en {barberia}. ¿Te reservamos un turno esta semana? ✂️",
  tpl_riesgo:
    "¡Hola {nombre}! Te extrañamos en {barberia}. Volvé este mes y tenés un 15% de descuento en tu corte 🙌",
};

export function normalizeText(s: string) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

export function migrate(db: DB) {
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  // Búsqueda sin distinguir mayúsculas ni acentos: norm('Pérez') = 'perez'
  db.function("norm", { deterministic: true }, (s: unknown) =>
    normalizeText(String(s ?? "")),
  );
  db.exec(SCHEMA);
  const insert = db.prepare(
    "INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)",
  );
  for (const [k, v] of Object.entries(DEFAULT_SETTINGS)) insert.run(k, v);
  const rules = db.prepare("SELECT COUNT(*) AS n FROM loyalty_rules").get() as {
    n: number;
  };
  if (rules.n === 0) {
    db.prepare(
      "INSERT INTO loyalty_rules (name, visits_required, discount_pct) VALUES (?, ?, ?)",
    ).run("3.ª visita del mes", 3, 20);
  }
}

export function openDb(file: string): DB {
  if (file !== ":memory:") fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new Database(file);
  migrate(db);
  return db;
}

const globalForDb = globalThis as unknown as { __groveeDb?: DB };

export function getDb(): DB {
  if (!globalForDb.__groveeDb) {
    const file =
      process.env.DATABASE_PATH ||
      path.join(process.cwd(), "data", "grovee.db");
    globalForDb.__groveeDb = openDb(file);
    // Modo demo: base efímera que arranca con datos de ejemplo
    if (process.env.DEMO_MODE === "true") seedDemo(globalForDb.__groveeDb);
  }
  return globalForDb.__groveeDb;
}
