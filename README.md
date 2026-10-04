# Grovee Admin

Sistema de gestión interno (POS / CRM) para barberías: cobro rápido asociado al DNI o teléfono del
cliente, fidelización automática, caja diaria, comisiones de barberos y catálogo con stock.

## Demo online gratis (Render)

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/ThePantera/BarberiaPOS)

Entrá con tu cuenta de GitHub, confirmá con **Apply** y en unos minutos Render te da un link
`https://grovee-admin-demo-xxxx.onrender.com`. Usa el plan gratuito con `DEMO_MODE=true`: arranca
con datos de ejemplo, la contraseña es `admin` y los datos se borran cuando el servicio se duerme
(tras ~15 minutos sin uso) o se vuelve a publicar.

## Probarlo sin instalar nada (GitHub Codespaces)

En GitHub: botón verde **Code** → pestaña **Codespaces** → **Create codespace on main**.
Se instala solo, carga datos de ejemplo y abre la app en el navegador.
Contraseña: `admin`. Cuando termines, detené el codespace para no gastar horas gratis.

## Puesta en marcha

```bash
npm install
npm run seed      # opcional: carga barberos, servicios, productos y clientes de ejemplo
npm run dev       # http://localhost:3000  (contraseña por defecto en desarrollo: admin)
```

Producción:

```bash
npm run build
ADMIN_PASSWORD=una-clave-segura npm start
```

| Variable          | Uso                                                                 |
| ----------------- | ------------------------------------------------------------------- |
| `ADMIN_PASSWORD`  | Contraseña de acceso (obligatoria en producción).                    |
| `SESSION_SECRET`  | Opcional. Firma de la cookie de sesión.                              |
| `DATABASE_PATH`   | Archivo SQLite. Por defecto `data/grovee.db`.                        |
| `APP_TIMEZONE`    | Zona horaria para la caja y los meses. Por defecto Buenos Aires.     |

Los datos viven en un único archivo SQLite: hay que alojar la app en un servidor con disco
persistente (VPS, Railway, Fly.io, etc.) y respaldar ese archivo.

## Módulos

- **Cobrar (POS)**: buscador por nombre, DNI o teléfono desde 3 caracteres (Enter selecciona); si no hay coincidencias, alta del cliente nuevo con nombre, apellido, teléfono y DNI; barbero,
  servicio con precio del catálogo, productos opcionales, alerta de fidelidad y medio de pago.
  Confirmar impacta en la caja abierta, registra la comisión, descuenta stock y suma la visita.
- **Clientes**: ficha con historial, total gastado y visitas del mes; segmentos (fieles, frecuencia
  regular, en riesgo) y botón de WhatsApp con la plantilla del segmento.
- **Caja**: apertura con efectivo inicial, desglose en tiempo real por medio de pago, anulación de
  cobros y cierre con arqueo (esperado = inicial + cobros en efectivo).
- **Barberos**: altas, bajas, % de comisión y liquidación semanal/mensual con detalle de cortes.
- **Catálogo**: ABM de servicios (con comisión fija opcional) y productos con stock y alerta de mínimo.
- **Ajustes**: reglas de fidelización, nombre de la barbería, prefijo y plantillas de WhatsApp.

## Reglas de negocio

- Una visita = un cobro. El contador mensual se reinicia el día 1.
- Regla de fidelidad "visita n.º X = Y%": aplica en la X-ésima visita del mes; si varias coinciden,
  gana el mayor descuento. El descuento se aplica solo al servicio, no a los productos.
- Comisión: % del barbero sobre el servicio neto de descuento; si el servicio tiene comisión fija,
  se usa esa. Los productos no generan comisión.
- No se puede vender un producto sin stock suficiente.

## Desarrollo

```bash
npm test          # reglas de negocio y flujo de caja (vitest)
npm run lint
npm run typecheck
```

Código: `src/lib/domain.ts` (reglas puras), `src/lib/repo.ts` (consultas SQLite),
`src/app/actions.ts` (Server Actions), `src/app/(admin)/` (pantallas).
