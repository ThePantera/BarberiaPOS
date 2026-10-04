import { fillTemplate, whatsappLink, type Segment } from "./domain";
import type { ClientWithStats } from "./repo";

export function campaignLink(
  client: ClientWithStats,
  settings: Record<string, string>,
  segment: Segment = client.segment,
) {
  const tpl =
    segment === "otro"
      ? "¡Hola {nombre}! Te escribimos de {barberia}."
      : settings[`tpl_${segment}`];
  const text = fillTemplate(tpl, {
    nombre: client.first_name,
    apellido: client.last_name,
    barberia: settings.shop_name,
    visitas: client.visits_month,
    dias: client.days_since ?? 0,
  });
  return whatsappLink(client.phone, settings.whatsapp_prefix, text);
}
