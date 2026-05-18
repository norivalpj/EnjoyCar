import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Clock, Wrench, ChevronRight } from "lucide-react";

const MaintenanceSuggestions = ({ vehicleId }) => {
  const { data: vehicle } = useQuery({
    queryKey: ['vehicle', vehicleId],
    queryFn: async () => {
      const results = await base44.entities.Vehicle.filter({ id: vehicleId });
      return results[0];
    },
    enabled: !!vehicleId
  });

  const { data: plans = [] } = useQuery({
    queryKey: ['maintenance-plans', vehicleId],
    queryFn: () => base44.entities.MaintenancePlan.filter({ vehicle_id: vehicleId }),
    enabled: !!vehicleId
  });

  if (!vehicle || !plans.length) return null;

  const currentMileage = vehicle.current_mileage || 0;
  const purchaseMileage = vehicle.purchase_mileage || 0;

  // Filter relevant plans and categorize them
  const relevantPlans = plans.filter(p => 
    !p.is_completed && 
    p.recommended_mileage >= purchaseMileage
  );

  const overduePlans = relevantPlans.filter(p => 
    p.recommended_mileage && currentMileage >= p.recommended_mileage
  );

  const upcomingPlans = relevantPlans.filter(p => 
    p.recommended_mileage && 
    currentMileage < p.recommended_mileage &&
    (p.recommended_mileage - currentMileage) <= 2000
  );

  const suggestions = [...overduePlans, ...upcomingPlans].slice(0, 3);

  if (suggestions.length === 0) return null;

  return (
    <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-yellow-50">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-orange-500 flex items-center justify-center">
            <Wrench className="w-5 h-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-lg">Sugestões de Manutenção</CardTitle>
            <p className="text-xs text-slate-600 font-normal">
              Baseado no seu plano de manutenção
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {suggestions.map(plan => {
          const isOverdue = currentMileage >= plan.recommended_mileage;
          const kmRemaining = plan.recommended_mileage - currentMileage;

          return (
            <div 
              key={plan.id}
              className="bg-white rounded-lg p-4 border border-slate-200 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    {isOverdue ? (
                      <>
                        <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                        <Badge className="bg-red-100 text-red-700" variant="secondary">
                          Atrasada
                        </Badge>
                      </>
                    ) : (
                      <>
                        <Clock className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                        <Badge className="bg-yellow-100 text-yellow-700" variant="secondary">
                          Próxima
                        </Badge>
                      </>
                    )}
                  </div>
                  
                  <h4 className="font-semibold text-slate-800 mb-1">
                    {plan.maintenance_type}
                  </h4>
                  
                  {plan.description && (
                    <p className="text-sm text-slate-600 mb-2">{plan.description}</p>
                  )}
                  
                  <p className="text-xs text-slate-500">
                    Recomendado em: {plan.recommended_mileage?.toLocaleString('pt-BR')} km
                    {!isOverdue && (
                      <span className="ml-2">
                        (faltam {kmRemaining.toLocaleString('pt-BR')} km)
                      </span>
                    )}
                  </p>
                </div>

                <Link 
                  to={createPageUrl('NewMaintenance') + `?vehicle_id=${vehicleId}&plan_id=${plan.id}`}
                >
                  <Button size="sm" className="bg-orange-600 hover:bg-orange-700 flex-shrink-0">
                    Registrar
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>
          );
        })}

        {(overduePlans.length > 3 || upcomingPlans.length > 3) && (
          <Link to={createPageUrl('MaintenancePlan') + `?id=${vehicleId}`}>
            <Button variant="outline" size="sm" className="w-full">
              Ver Plano Completo
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
};

export default MaintenanceSuggestions;