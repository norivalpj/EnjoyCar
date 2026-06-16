import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useToast } from "@/components/ui/use-toast";

export default function GlobalAlerts() {
  const { toast } = useToast();

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
    queryKey: ['maintenance-plans'],
    queryFn: () => base44.entities.MaintenancePlan.list(),
    enabled: !!user,
  });

  useEffect(() => {
    if (!user || vehicles.length === 0 || plans.length === 0) return;

    // We only want to show the toast once per session
    if (sessionStorage.getItem('maintenance_alerts_shown')) return;

    const notifyKmBefore = user.notify_km_before ?? 500;
    const pendingPlans = plans.filter(p => !p.is_completed);

    let itemsToAlert = 0;

    for (const plan of pendingPlans) {
      const vehicle = vehicles.find(v => v.id === plan.vehicle_id);
      if (!vehicle) continue;

      if (plan.recommended_mileage && vehicle.current_mileage) {
        const kmLeft = plan.recommended_mileage - vehicle.current_mileage;
        if (kmLeft <= notifyKmBefore) {
          itemsToAlert++;
        }
      }
    }

    if (itemsToAlert > 0) {
      toast({
        title: "Atenção: Manutenções Próximas",
        description: `Você tem ${itemsToAlert} manutenção(ões) agendada(s) ou atrasada(s).`,
        variant: "destructive"
      });
      sessionStorage.setItem('maintenance_alerts_shown', 'true');
    }

  }, [user, vehicles, plans, toast]);

  return null;
}
