"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Cobrar", icon: "⚡" },
  { href: "/clientes", label: "Clientes", icon: "👥" },
  { href: "/caja", label: "Caja", icon: "💵" },
  { href: "/barberos", label: "Barberos", icon: "✂️" },
  { href: "/catalogo", label: "Catálogo", icon: "🧴" },
  { href: "/configuracion", label: "Ajustes", icon: "⚙️" },
];

export function NavLinks() {
  const path = usePathname();
  const isActive = (href: string) =>
    href === "/" ? path === "/" : path === href || path.startsWith(href + "/");
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-6 border-t border-stone-800 bg-ink md:static md:block md:border-0 md:px-3">
      {LINKS.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={`flex flex-col items-center gap-0.5 px-1 py-2 text-[11px] md:flex-row md:gap-3 md:rounded-xl md:px-3 md:py-2.5 md:text-sm ${
            isActive(l.href)
              ? "text-brand-500 md:bg-white/10 md:text-white"
              : "text-stone-400 hover:text-white"
          }`}
        >
          <span className="text-lg md:text-base">{l.icon}</span>
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
