import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles } from "lucide-react";

import InvoiceUploader from '../components/upload/InvoiceUploader';
import MaintenanceForm from '../components/forms/MaintenanceForm';

export default function NewMaintenance() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [extractedData, setExtractedData] = useState(null);
  const [invoiceUrl, setInvoiceUrl] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const urlParams = new URLSearchParams(window.location.search);
  const preselectedVehicleId = urlParams.get('vehicle_id');
  const planId = urlParams.get('plan_id');

  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => base44.entities.Vehicle.list()
  });

  const { data: plan } = useQuery({
    queryKey: ['plan', planId],
    queryFn: async () => {
      const results = await base44.entities.MaintenancePlan.filter({ id: planId });
      return results[0];
    },
    enabled: !!planId
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const maintenance = await base44.entities.Maintenance.create(data);
      
      // If linked to a plan, update it
      if (planId && plan) {
        const nextMileage = plan.recommended_interval_km 
          ? (data.mileage || 0) + plan.recommended_interval_km
          : null;
        
        await base44.entities.MaintenancePlan.update(planId, {
          is_completed: true,
          completed_maintenance_id: maintenance.id
        });

        // Create next occurrence in the plan if interval exists
        if (plan.recommended_interval_km && nextMileage) {
          await base44.entities.MaintenancePlan.create({
            vehicle_id: plan.vehicle_id,
            maintenance_type: plan.maintenance_type,
            description: plan.description,
            recommended_mileage: nextMileage,
            recommended_interval_km: plan.recommended_interval_km,
            recommended_interval_months: plan.recommended_interval_months,
            priority: plan.priority,
            is_completed: false
          });
        }
      }
      
      return maintenance;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenances'] });
      queryClient.invalidateQueries({ queryKey: ['maintenance-plans'] });
      navigate(createPageUrl('Home'));
    }
  });

  const handleDataExtracted = (data) => {
    setExtractedData(data);
    setShowForm(true);
  };

  const handleFileUploaded = (url) => {
    setInvoiceUrl(url);
  };

  const handleSubmit = (data) => {
    createMutation.mutate(data);
  };

  // Pre-fill form if coming from a plan
  React.useEffect(() => {
    if (plan && preselectedVehicleId) {
      setExtractedData({
        vehicle_id: preselectedVehicleId,
        type: plan.maintenance_type.toLowerCase().replace(/\s+/g, '_'),
        description: plan.description || plan.maintenance_type,
        mileage: plan.recommended_mileage
      });
      setShowForm(true);
    }
  }, [plan, preselectedVehicleId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to={createPageUrl('Home')}>
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Nova Manutenção</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              Envie uma nota fiscal ou preencha manualmente
            </p>
          </div>
        </div>

        {/* No vehicles warning */}
        {vehicles.length === 0 && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="text-amber-800 text-sm">
              Você ainda não tem veículos cadastrados.{' '}
              <Link to={createPageUrl('Vehicles')} className="font-medium underline">
                Cadastre um veículo
              </Link>{' '}
              antes de adicionar manutenções.
            </p>
          </div>
        )}

        {/* Upload Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-blue-500" />
            <h2 className="font-semibold text-slate-700">Preenchimento Automático</h2>
          </div>
          <InvoiceUploader 
            onDataExtracted={handleDataExtracted}
            onFileUploaded={handleFileUploaded}
          />
          
          {extractedData && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl">
              <p className="text-green-800 text-sm">
                ✓ Dados extraídos automaticamente! Revise as informações abaixo.
              </p>
            </div>
          )}
        </div>

        {/* Manual entry button */}
        {!showForm && !extractedData && (
          <div className="text-center py-4">
            <p className="text-slate-400 text-sm mb-3">ou</p>
            <Button 
              variant="outline" 
              onClick={() => setShowForm(true)}
              disabled={vehicles.length === 0}
            >
              Preencher Manualmente
            </Button>
          </div>
        )}

        {/* Form */}
        {(showForm || extractedData) && vehicles.length > 0 && (
          <MaintenanceForm 
            vehicles={vehicles}
            extractedData={extractedData}
            invoiceUrl={invoiceUrl}
            onSubmit={handleSubmit}
            onCancel={() => navigate(createPageUrl('Home'))}
            isLoading={createMutation.isPending}
          />
        )}
      </div>
    </div>
  );
}