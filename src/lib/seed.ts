import type { DB } from "./db";
import * as repo from "./repo";
import { addDays, localDate } from "./time";

/** Carga barberos, servicios, productos y clientes de ejemplo si la base está vacía. */
export function seedDemo(db: DB): boolean {
  if (repo.listBarbers(db).length > 0) return false;
  const barbers = [
    repo.saveBarber(db, { name: "Leo", phone: "11 5555-0001", commission_pct: 50 }),
    repo.saveBarber(db, { name: "Mati", phone: "11 5555-0002", commission_pct: 45 }),
  ];
  const services = [
    repo.saveService(db, { name: "Corte", price: 12000, fixed_commission: null }),
    repo.saveService(db, { name: "Corte + Barba", price: 16000, fixed_commission: null }),
    repo.saveService(db, { name: "Barba", price: 7000, fixed_commission: 3000 }),
  ];
  repo.saveProduct(db, { name: "Cera mate", price: 9000, stock: 12, min_stock: 3 });
  repo.saveProduct(db, { name: "Aceite para barba", price: 11000, stock: 2, min_stock: 3 });

  const people = [
    ["30111222", "Juan", "Pérez", "11 2345-6789"],
    ["32444555", "Martín", "Gómez", "11 3456-7890"],
    ["", "Lucas", "Fernández", "11 4567-8901"],
    ["28999000", "Diego", "Sosa", "11 5678-9012"],
    ["35123123", "Nico", "Romero", "11 6789-0123"],
  ];
  const clients = people.map(([dni, first_name, last_name, phone]) =>
    repo.createClient(db, { dni, first_name, last_name, phone }),
  );

  // Historial: [cliente, días atrás]
  const today = localDate();
  const visits: [number, number][] = [
    [0, 20], [0, 9], [0, 2],
    [1, 18],
    [2, 40],
    [3, 22], [3, 3],
    [4, 33],
  ];
  const session = repo.openCash(db, 0, `${addDays(today, -45)} 09:00:00`);
  visits.forEach(([c, ago], i) => {
    repo.registerSale(
      db,
      {
        clientId: clients[c],
        barberId: barbers[i % 2],
        serviceId: services[i % 3],
        items: [],
        paymentMethod: (["efectivo", "transferencia", "tarjeta"] as const)[i % 3],
      },
      `${addDays(today, -ago)} 1${i % 9}:00:00`,
    );
  });
  const cash = repo.cashBreakdown(db, session).efectivo;
  repo.closeCash(db, cash, "Datos de ejemplo", `${addDays(today, -1)} 21:00:00`);
  return true;
}
