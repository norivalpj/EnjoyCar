import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";

import MaintenanceForm from '../components/forms/MaintenanceForm';

export default function EditMaintenance() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const urlParams = new URLSearchParams(window.location.search);
  const maintenanceId = urlParams.get('id');

  const { data: maintenance, isLoading: loadingMaintenance } = useQuery({
    queryKey: ['maintenance', maintenanceId],
    queryFn: async () => {
      const results = await base44.entities.Maintenance.filter({ id: maintenanceId });
      return results[0];
    },
    enabled: !!maintenanceId
  });

  const { data: vehicles = [], isLoading: loadingVehicles } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => base44.entities.Vehicle.list()
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Maintenance.update(maintenanceId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenances'] });
      queryClient.invalidateQueries({ queryKey: ['maintenance', maintenanceId] });
      navigate(createPageUrl('MaintenanceDetail') + `?id=${maintenanceId}`);
    }
  });

  const isLoading = loadingMaintenance || loadingVehicles;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-8">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-8 w-48" />
          </div>
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!maintenance) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-slate-700 mb-2">Manutenção não encontrada</h2>
          <Link to={createPageUrl('History')}>
            <Button variant="link">Voltar ao histórico</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to={createPageUrl('MaintenanceDetail') + `?id=${maintenanceId}`}>
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Editar Manutenção</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              Atualize os dados da manutenção
            </p>
          </div>
        </div>

        <MaintenanceForm 
          vehicles={vehicles}
          initialData={{
            ...maintenance,
            mileage: maintenance.mileage || '',
            cost: maintenance.cost || '',
            next_maintenance_mileage: maintenance.next_maintenance_mileage || '',
            parts_replaced: maintenance.parts_replaced || []
          }}
          invoiceUrl={maintenance.invoice_url}
          onSubmit={(data) => updateMutation.mutate(data)}
          onCancel={() => navigate(createPageUrl('MaintenanceDetail') + `?id=${maintenanceId}`)}
          isLoading={updateMutation.isPending}
        />
      </div>
    </div>
  );
}