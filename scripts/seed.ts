// Carga datos de ejemplo: npm run seed
import path from "node:path";
import { openDb } from "../src/lib/db";
import { seedDemo } from "../src/lib/seed";

const file = process.env.DATABASE_PATH || path.join(process.cwd(), "data", "grovee.db");
if (seedDemo(openDb(file))) console.log(`Datos de ejemplo cargados en ${file}`);
else console.log("La base ya tiene datos; no se cargó nada.");
