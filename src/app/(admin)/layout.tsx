import { requireAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { getOpenCashSession, getSettings } from "@/lib/repo";
import { logout } from "@/app/actions";
import { NavLinks } from "./NavLinks";

export default async function AdminLayout({ children }: LayoutProps<"/">) {
  await requireAuth();
  const db = getDb();
  const settings = getSettings(db);
  const open = getOpenCashSession(db);

  return (
    <div className="min-h-screen md:flex">
      <aside className="sticky top-0 z-20 bg-ink text-stone-200 md:h-screen md:w-60 md:shrink-0">
        <div className="flex items-center justify-between gap-3 px-4 py-3 md:block md:px-5 md:py-6">
          <div>
            <div className="text-lg font-bold text-white">
              <span className="text-brand-500">Grovee</span> Admin
            </div>
            <div className="truncate text-xs text-stone-400">{settings.shop_name}</div>
          </div>
          <div
            className={`chip md:mt-3 ${open ? "bg-emerald-500/15 text-emerald-300" : "bg-red-500/15 text-red-300"}`}
          >
            {open ? "● Caja abierta" : "● Caja cerrada"}
          </div>
        </div>
        <NavLinks />
        <form action={logout} className="hidden px-5 py-4 md:block">
          <button className="text-xs text-stone-500 hover:text-stone-300">Cerrar sesión</button>
        </form>
      </aside>
      <main className="mx-auto w-full max-w-6xl flex-1 p-4 pb-24 sm:p-6 md:pb-6">{children}</main>
    </div>
  );
}
