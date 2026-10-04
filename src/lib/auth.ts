import "server-only";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE = "grovee_session";
const MAX_AGE = 60 * 60 * 24 * 14; // 14 días

function password(): string {
  const p = process.env.ADMIN_PASSWORD;
  if (p) return p;
  if (process.env.NODE_ENV === "production" && process.env.DEMO_MODE !== "true")
    throw new Error("Definí ADMIN_PASSWORD para usar Grovee Admin en producción.");
  return "admin";
}

function secret(): string {
  return process.env.SESSION_SECRET || `grovee:${password()}`;
}

function sign(payload: string) {
  return crypto.createHmac("sha256", secret()).update(payload).digest("hex");
}

export function checkPassword(input: string) {
  const a = Buffer.from(input);
  const b = Buffer.from(password());
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function startSession() {
  const exp = String(Date.now() + MAX_AGE * 1000);
  (await cookies()).set(COOKIE, `${exp}.${sign(exp)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: MAX_AGE,
    path: "/",
  });
}

export async function endSession() {
  (await cookies()).delete(COOKIE);
}

export async function isAuthenticated() {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return false;
  const [exp, sig] = raw.split(".");
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  const expected = sign(exp);
  return (
    sig.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
  );
}

/** Usar al inicio de cada página y Server Action protegida. */
export async function requireAuth() {
  if (!(await isAuthenticated())) redirect("/login");
}
