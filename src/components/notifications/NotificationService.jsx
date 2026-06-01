import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { differenceInDays, parseISO, isValid } from 'date-fns';

/**
 * Invisible service component – mounts once in Home and fires emails when needed.
 * Rules:
 *  - Maintenance alert: at most once per day, if any plan is within 30 days OR 500 km
 *  - Mileage reminder: configured per user, default 28 days
 */
export default function NotificationService() {
  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => base44.entities.Vehicle.list(),
    enabled: !!user,
  });

  const { data: plans = [] } = useQuery({
    queryKey: ['all-maintenance-plans'],
    queryFn: () => base44.entities.MaintenancePlan.list(),
    enabled: !!user,
  });

  useEffect(() => {
    if (!user || !user.notifications_enabled) return;
    if (vehicles.length === 0 || plans.length === 0) return;

    const now = new Date();

    // ── 1. MILEAGE REMINDER ──────────────────────────────────────────────────
    const lastMileage = user.last_mileage_reminder_sent
      ? parseISO(user.last_mileage_reminder_sent)
      : null;
    const daysSinceLastMileage = lastMileage && isValid(lastMileage)
      ? differenceInDays(now, lastMileage)
      : 999;
    const mileageDays = user.notify_mileage_days ?? 28;

    if (daysSinceLastMileage >= mileageDays) {
      sendMileageReminder(user, vehicles, mileageDays);
    }

    // ── 2. MAINTENANCE ALERT ─────────────────────────────────────────────────
    const lastAlert = user.last_maintenance_alert_sent
      ? parseISO(user.last_maintenance_alert_sent)
      : null;
    const daysSinceLastAlert = lastAlert && isValid(lastAlert)
      ? differenceInDays(now, lastAlert)
      : 999;

    if (daysSinceLastAlert < 1) return; // already sent today

    const notifyDaysBefore = user.notify_days_before ?? 30;
    const notifyKmBefore = user.notify_km_before ?? 500;

    const pendingPlans = plans.filter(p => !p.is_completed);
    const alertItems = [];

    for (const plan of pendingPlans) {
      const vehicle = vehicles.find(v => v.id === plan.vehicle_id);
      if (!vehicle) continue;

      let reason = null;

      // KM-based alert
      if (plan.recommended_mileage && vehicle.current_mileage) {
        const kmLeft = plan.recommended_mileage - vehicle.current_mileage;
        if (kmLeft <= notifyKmBefore && kmLeft > -5000) {
          reason = kmLeft <= 0
            ? `atrasada (${Math.abs(kmLeft).toLocaleString('pt-BR')} km acima do recomendado)`
            : `faltam ${kmLeft.toLocaleString('pt-BR')} km`;
        }
      }

      alertItems.push({ plan, vehicle, reason });
    }

    const itemsToAlert = alertItems.filter(i => i.reason);
    if (itemsToAlert.length > 0) {
      sendMaintenanceAlert(user, itemsToAlert);
    }
  }, [user, vehicles, plans]);

  return null;
}

// ── Email senders ────────────────────────────────────────────────────────────

async function sendMileageReminder(user, vehicles, mileageDays) {
  const vehicleList = vehicles
    .map(v => `• ${v.brand} ${v.model} (${v.license_plate}) — atual: ${v.current_mileage ? v.current_mileage.toLocaleString('pt-BR') + ' km' : 'não informado'}`)
    .join('\n');

  const body = `Olá${user.full_name ? ', ' + user.full_name : ''}!

🚗 Lembrete: atualize a quilometragem dos seus veículos

Para que os alertas de manutenção sejam precisos, mantenha a quilometragem atualizada. Este lembrete está configurado para a cada ${mileageDays} dias.

Seus veículos cadastrados:
${vehicleList}

Acesse o app, vá em "Meus Veículos" e edite cada veículo para inserir a quilometragem atual.

Att,
Equipe Gestão de Veículos`;

  await base44.integrations.Core.SendEmail({
    to: user.email,
    subject: '🚗 Lembrete: atualize a quilometragem dos seus veículos',
    body,
  });

  await base44.auth.updateMe({
    last_mileage_reminder_sent: new Date().toISOString(),
  });
}

async function sendMaintenanceAlert(user, items) {
  const lines = items
    .map(({ plan, vehicle, reason }) =>
      `• [${reason?.includes('atrasada') ? '🔴 ATRASADA' : '🟡 PRÓXIMA'}] ${vehicle.brand} ${vehicle.model} — ${plan.maintenance_type} (${reason})`
    )
    .join('\n');

  const body = `Olá${user.full_name ? ', ' + user.full_name : ''}!

⚠️ Você tem manutenções pendentes que precisam de atenção:

${lines}

Acesse o app para registrar as manutenções realizadas ou agendar com sua oficina.

Att,
Equipe Gestão de Veículos`;

  await base44.integrations.Core.SendEmail({
    to: user.email,
    subject: `⚠️ ${items.length} manutenção(ões) próxima(s) — Gestão de Veículos`,
    body,
  });

  await base44.auth.updateMe({
    last_maintenance_alert_sent: new Date().toISOString(),
  });
}