"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { checkPassword, endSession, requireAuth, startSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { isPaymentMethod } from "@/lib/domain";
import * as repo from "@/lib/repo";

export type FormState = { error?: string; ok?: string } | undefined;

function str(fd: FormData, k: string) {
  return String(fd.get(k) ?? "").trim();
}
function num(fd: FormData, k: string) {
  // Acepta "5000", "5.000", "12,5" y "12.5".
  let raw = str(fd, k).replace(/[$\s]/g, "");
  if (raw.includes(",")) raw = raw.replace(/\./g, "").replace(",", ".");
  else if (/^-?\d{1,3}(\.\d{3})+$/.test(raw)) raw = raw.replace(/\./g, "");
  return raw === "" ? NaN : Number(raw);
}
function optNum(fd: FormData, k: string) {
  return str(fd, k) === "" ? null : num(fd, k);
}

async function run(fn: () => void | string, paths: string[]): Promise<FormState> {
  await requireAuth();
  try {
    const ok = fn();
    for (const p of paths) revalidatePath(p);
    return { ok: typeof ok === "string" ? ok : "Guardado." };
  } catch (e) {
    if (e instanceof repo.BusinessError) return { error: e.message };
    throw e;
  }
}

// ---------- Sesión ----------

export async function login(_: FormState, fd: FormData): Promise<FormState> {
  if (!checkPassword(str(fd, "password")))
    return { error: "Contraseña incorrecta." };
  await startSession();
  redirect("/");
}

export async function logout() {
  await endSession();
  redirect("/login");
}

// ---------- POS ----------

export async function searchClientsAction(q: string) {
  await requireAuth();
  return repo.searchClients(getDb(), q);
}

export async function clientCardAction(id: number) {
  await requireAuth();
  const db = getDb();
  const client = repo.getClient(db, id);
  if (!client) return null;
  return { client, history: repo.clientHistory(db, id, 5) };
}

export async function createClientAction(data: {
  dni: string;
  first_name: string;
  last_name: string;
  phone: string;
}) {
  await requireAuth();
  try {
    const id = repo.createClient(getDb(), data);
    revalidatePath("/clientes");
    return { id };
  } catch (e) {
    if (e instanceof repo.BusinessError) return { error: e.message };
    throw e;
  }
}

export async function previewSaleAction(req: repo.SaleRequest) {
  await requireAuth();
  try {
    const p = repo.previewSale(getDb(), req);
    return { visitNumber: p.visitNumber, rule: p.rule, totals: p.totals };
  } catch (e) {
    if (e instanceof repo.BusinessError) return { error: e.message };
    throw e;
  }
}

export async function registerSaleAction(
  req: repo.SaleRequest & { paymentMethod: string },
) {
  await requireAuth();
  if (!isPaymentMethod(req.paymentMethod))
    return { error: "Elegí un medio de pago." };
  try {
    const r = repo.registerSale(getDb(), {
      ...req,
      paymentMethod: req.paymentMethod,
    });
    for (const p of ["/", "/caja", "/clientes", "/catalogo", "/barberos"])
      revalidatePath(p);
    return {
      saleId: r.saleId,
      total: r.totals.total,
      visitNumber: r.visitNumber,
      discount: r.totals.discountAmount,
    };
  } catch (e) {
    if (e instanceof repo.BusinessError) return { error: e.message };
    throw e;
  }
}

// ---------- Caja ----------

export async function openCashAction(_: FormState, fd: FormData) {
  return run(() => {
    repo.openCash(getDb(), num(fd, "opening_cash"));
    return "Caja abierta.";
  }, ["/", "/caja"]);
}

export async function closeCashAction(_: FormState, fd: FormData) {
  return run(() => {
    const r = repo.closeCash(getDb(), num(fd, "counted_cash"), str(fd, "notes"));
    const diff = r.counted - r.expected;
    return diff === 0
      ? "Caja cerrada. El arqueo cuadra."
      : `Caja cerrada con ${diff > 0 ? "sobrante" : "faltante"} de $${Math.abs(diff).toLocaleString("es-AR")}.`;
  }, ["/", "/caja"]);
}

export async function voidSaleAction(_: FormState, fd: FormData) {
  return run(() => {
    repo.voidSale(getDb(), num(fd, "id"));
    return "Cobro anulado.";
  }, ["/", "/caja", "/clientes", "/catalogo"]);
}

// ---------- Barberos ----------

export async function saveBarberAction(_: FormState, fd: FormData) {
  return run(() => {
    repo.saveBarber(getDb(), {
      id: optNum(fd, "id") ?? undefined,
      name: str(fd, "name"),
      phone: str(fd, "phone"),
      commission_pct: num(fd, "commission_pct"),
    });
  }, ["/barberos", "/"]);
}

export async function toggleActiveAction(_: FormState, fd: FormData) {
  const table = str(fd, "table");
  if (!["barbers", "services", "products", "loyalty_rules"].includes(table))
    return { error: "Tabla inválida." };
  return run(() => {
    repo.setActive(
      getDb(),
      table as "barbers" | "services" | "products" | "loyalty_rules",
      num(fd, "id"),
      str(fd, "active") === "1",
    );
  }, ["/barberos", "/catalogo", "/configuracion", "/"]);
}

// ---------- Catálogo ----------

export async function saveServiceAction(_: FormState, fd: FormData) {
  return run(() => {
    repo.saveService(getDb(), {
      id: optNum(fd, "id") ?? undefined,
      name: str(fd, "name"),
      price: num(fd, "price"),
      fixed_commission: optNum(fd, "fixed_commission"),
    });
  }, ["/catalogo", "/"]);
}

export async function saveProductAction(_: FormState, fd: FormData) {
  return run(() => {
    repo.saveProduct(getDb(), {
      id: optNum(fd, "id") ?? undefined,
      name: str(fd, "name"),
      price: num(fd, "price"),
      stock: num(fd, "stock") || 0,
      min_stock: num(fd, "min_stock") || 0,
    });
  }, ["/catalogo", "/"]);
}

export async function adjustStockAction(_: FormState, fd: FormData) {
  return run(() => {
    const delta = num(fd, "delta");
    if (!Number.isInteger(delta) || delta === 0)
      throw new repo.BusinessError("Ingresá una cantidad entera distinta de 0.");
    repo.adjustStock(getDb(), num(fd, "id"), delta);
    return "Stock actualizado.";
  }, ["/catalogo", "/"]);
}

// ---------- Clientes ----------

export async function updateClientAction(_: FormState, fd: FormData) {
  const id = num(fd, "id");
  return run(() => {
    repo.updateClient(getDb(), {
      id,
      dni: str(fd, "dni"),
      first_name: str(fd, "first_name"),
      last_name: str(fd, "last_name"),
      phone: str(fd, "phone"),
      notes: str(fd, "notes"),
    });
  }, ["/clientes", `/clientes/${id}`]);
}

// ---------- Configuración ----------

export async function saveRuleAction(_: FormState, fd: FormData) {
  return run(() => {
    repo.saveLoyaltyRule(getDb(), {
      id: optNum(fd, "id") ?? undefined,
      name: str(fd, "name"),
      visits_required: num(fd, "visits_required"),
      discount_pct: num(fd, "discount_pct"),
    });
  }, ["/configuracion", "/"]);
}

export async function saveSettingsAction(_: FormState, fd: FormData) {
  return run(() => {
    const keys = ["shop_name", "whatsapp_prefix", "tpl_fiel", "tpl_regular", "tpl_riesgo"];
    const values: Record<string, string> = {};
    for (const k of keys) if (fd.has(k)) values[k] = str(fd, k);
    repo.setSettings(getDb(), values);
  }, ["/configuracion", "/clientes"]);
}
