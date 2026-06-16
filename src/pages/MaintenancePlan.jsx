import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, BookOpen, AlertCircle, Clock, CheckCircle } from "lucide-react";
import EnhancedManualUploader from '../components/maintenance/EnhancedManualUploader';
import AutoMaintenanceFetcher from '../components/maintenance/AutoMaintenanceFetcher';
import MaintenancePlanCard from '../components/maintenance/MaintenancePlanCard';
import PlanFilters from '../components/filters/PlanFilters';

export default function MaintenancePlan() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all'
  });

  const urlParams = new URLSearchParams(window.location.search);
  const vehicleId = urlParams.get('id');

  const { data: vehicle, isLoading: loadingVehicle } = useQuery({
    queryKey: ['vehicle', vehicleId],
    queryFn: async () => {
      const result = await base44.entities.Vehicle.get(vehicleId);
      return result || null;
    },
    enabled: !!vehicleId
  });

  const { data: allPlans = [], isLoading: loadingPlans } = useQuery({
    queryKey: ['maintenance-plans', vehicleId],
    queryFn: () => base44.entities.MaintenancePlan.filter({ vehicle_id: vehicleId }),
    enabled: !!vehicleId
  });

  // Filter plans to show only those >= purchase mileage
  const plans = allPlans.filter(plan => {
    if (!vehicle?.purchase_mileage || !plan.recommended_mileage) return true;
    return plan.recommended_mileage >= vehicle.purchase_mileage;
  });

  const updatePlanMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.MaintenancePlan.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-plans'] });
    }
  });

  const handleMarkComplete = (plan) => {
    navigate(createPageUrl('NewMaintenance') + `?vehicle_id=${vehicleId}&plan_id=${plan.id}`);
  };

  const handlePlanExtracted = () => {
    queryClient.invalidateQueries({ queryKey: ['maintenance-plans'] });
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setFilters({
      status: 'all',
      priority: 'all'
    });
  };

  // Apply filters
  const applyFilters = (planList) => {
    return planList.filter(plan => {
      if (filters.priority !== 'all' && plan.priority !== filters.priority) return false;
      return true;
    });
  };

  const pendingPlans = plans.filter(p => !p.is_completed);
  const completedPlans = plans.filter(p => p.is_completed);
  
  const overduePlans = pendingPlans.filter(p => 
    vehicle?.current_mileage && p.recommended_mileage && 
    vehicle.current_mileage >= p.recommended_mileage
  );

  const soonPlans = pendingPlans.filter(p => 
    vehicle?.current_mileage && p.recommended_mileage && 
    (p.recommended_mileage - vehicle.current_mileage) <= 1000 &&
    (p.recommended_mileage - vehicle.current_mileage) > 0
  );

  if (loadingVehicle) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Skeleton className="h-8 w-64 mb-8" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-slate-700 mb-2">Veículo não encontrado</h2>
          <Link to={createPageUrl('Vehicles')}>
            <Button variant="link">Voltar aos veículos</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-50 via-white to-blue-50 flex-1 h-full">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('VehicleDetail') + `?id=${vehicleId}`}>
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Plano de Manutenção</h1>
              <p className="text-slate-500 text-sm mt-0.5">
                {vehicle.brand} {vehicle.model} - {vehicle.license_plate}
              </p>
            </div>
          </div>
        </div>

        {/* Auto Fetch + Manual Upload */}
        {plans.length === 0 && (
          <div className="mb-8 space-y-4">
            <AutoMaintenanceFetcher vehicle={vehicle} onComplete={handlePlanExtracted} />

            <details className="group">
              <summary className="cursor-pointer flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 select-none list-none">
                <BookOpen className="w-4 h-4" />
                <span>Ou enviar manualmente o manual do proprietário</span>
                <span className="ml-auto text-xs bg-slate-100 px-2 py-0.5 rounded">Opcional</span>
              </summary>
              <div className="mt-4">
                <EnhancedManualUploader vehicleId={vehicleId} onComplete={handlePlanExtracted} />
              </div>
            </details>
          </div>
        )}

        {/* Stats */}
        {plans.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-800">{overduePlans.length}</p>
                    <p className="text-xs text-slate-500">Atrasadas</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-800">{soonPlans.length}</p>
                    <p className="text-xs text-slate-500">Próximas</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-800">{completedPlans.length}</p>
                    <p className="text-xs text-slate-500">Concluídas</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        {plans.length > 0 && (
          <div className="mb-6">
            <PlanFilters
              filters={filters}
              onFilterChange={handleFilterChange}
              onClearFilters={handleClearFilters}
            />
          </div>
        )}

        {/* Plans List */}
        {loadingPlans ? (
          <div className="space-y-4">
            {Array(5).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        ) : plans.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-700 mb-2">
                Nenhum plano de manutenção
              </h3>
              <p className="text-slate-500 text-sm">
                Envie fotos do manual para criar o plano automaticamente
              </p>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="pending" className="space-y-6">
            <TabsList className="flex w-full">
              <TabsTrigger value="pending">
                Pendentes ({pendingPlans.length})
              </TabsTrigger>
              <TabsTrigger value="completed">
                Concluídas ({completedPlans.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="space-y-4">
              {(() => {
                let filtered = applyFilters(pendingPlans);
                
                // Apply status filter
                if (filters.status !== 'all') {
                  if (filters.status === 'overdue') {
                    filtered = filtered.filter(p => 
                      vehicle?.current_mileage && p.recommended_mileage && 
                      vehicle.current_mileage >= p.recommended_mileage
                    );
                  } else if (filters.status === 'soon') {
                    filtered = filtered.filter(p => 
                      vehicle?.current_mileage && p.recommended_mileage && 
                      (p.recommended_mileage - vehicle.current_mileage) <= 2000 &&
                      (p.recommended_mileage - vehicle.current_mileage) > 0
                    );
                  }
                }

                if (filtered.length === 0) {
                  return (
                    <Card>
                      <CardContent className="p-8 text-center">
                        <p className="text-slate-600">Nenhuma manutenção encontrada com os filtros aplicados</p>
                      </CardContent>
                    </Card>
                  );
                }

                const priorityOrder = { high: 0, medium: 1, low: 2 };
                return filtered
                  .sort((a, b) => {
                    // First sort by overdue status
                    const aOverdue = vehicle?.current_mileage && a.recommended_mileage && vehicle.current_mileage >= a.recommended_mileage;
                    const bOverdue = vehicle?.current_mileage && b.recommended_mileage && vehicle.current_mileage >= b.recommended_mileage;
                    if (aOverdue !== bOverdue) return aOverdue ? -1 : 1;
                    // Then by priority
                    const pDiff = (priorityOrder[a.priority] ?? 1) - (priorityOrder[b.priority] ?? 1);
                    if (pDiff !== 0) return pDiff;
                    // Then by mileage
                    return (a.recommended_mileage || 0) - (b.recommended_mileage || 0);
                  })
                  .map(plan => (
                    <MaintenancePlanCard
                      key={plan.id}
                      plan={plan}
                      currentMileage={vehicle.current_mileage}
                      onMarkComplete={handleMarkComplete}
                    />
                  ));
              })()}
            </TabsContent>

            <TabsContent value="completed" className="space-y-4">
              {(() => {
                const filtered = applyFilters(completedPlans);

                if (filtered.length === 0) {
                  return (
                    <Card>
                      <CardContent className="p-8 text-center">
                        <p className="text-slate-500">Nenhuma manutenção concluída encontrada</p>
                      </CardContent>
                    </Card>
                  );
                }

                return filtered.map(plan => (
                  <MaintenancePlanCard
                    key={plan.id}
                    plan={plan}
                    currentMileage={vehicle.current_mileage}
                  />
                ));
              })()}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}