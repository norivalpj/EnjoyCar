import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle 
} from "@/components/ui/dialog";
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, 
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter, 
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from 'sonner';
import { ArrowLeft, Plus, Car, Pencil, Trash2 } from "lucide-react";

import VehicleCard from '../components/vehicles/VehicleCard';
import VehicleForm from '../components/forms/VehicleForm';

export default function Vehicles() {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [filters, setFilters] = useState({
    brand: 'all',
    model: '',
    year: 'all',
    purchaseDateFrom: '',
    purchaseDateTo: ''
  });

  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => base44.entities.Vehicle.list('-created_date')
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Vehicle.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      setIsFormOpen(false);
      toast.success('Veículo salvo com sucesso!');
    },
    onError: (error) => {
      console.error(error);
      toast.error('Erro ao salvar veículo: ' + error.message);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Vehicle.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      setEditingVehicle(null);
      setIsFormOpen(false);
      toast.success('Veículo atualizado com sucesso!');
    },
    onError: (error) => {
      console.error(error);
      toast.error('Erro ao atualizar veículo: ' + error.message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Vehicle.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Veículo excluído!');
    },
    onError: (error) => {
      console.error(error);
      toast.error('Erro ao excluir veículo: ' + error.message);
    }
  });

  const handleSubmit = async (data, extractedHistory = []) => {
    if (editingVehicle) {
      updateMutation.mutate({ id: editingVehicle.id, data });
    } else {
      // Create vehicle first
      createMutation.mutate(data, {
        onSuccess: async (newVehicle) => {
          // Then create extracted maintenances if any
          if (extractedHistory.length > 0) {
            const maintenancesToCreate = extractedHistory.map(hist => ({
              vehicle_id: newVehicle.id,
              date: hist.date || new Date().toISOString().split('T')[0],
              type: hist.type || 'other',
              description: hist.description || '',
              mileage: hist.mileage || null,
              workshop_name: hist.workshop_name || null
            }));
            
            await base44.entities.Maintenance.bulkCreate(maintenancesToCreate);
            queryClient.invalidateQueries({ queryKey: ['maintenances'] });
          }

          // Automatically generate maintenance plan in the background
          toast.promise(
            (async () => {
              const response = await base44.integrations.Core.InvokeLLM({
                prompt: `Você é um especialista em manutenção automotiva. Com base nas informações do veículo abaixo, gere o plano de manutenção programada completo e detalhado conforme recomendado pelo fabricante.

VEÍCULO: ${newVehicle.brand} ${newVehicle.model} ${newVehicle.year ? `(${newVehicle.year})` : ''}
Quilometragem atual: ${newVehicle.current_mileage ? newVehicle.current_mileage.toLocaleString('pt-BR') + ' km' : 'não informada'}

Liste TODAS as revisões e manutenções programadas pelo fabricante, incluindo:
- Troca de óleo e filtro de óleo
- Filtro de ar do motor
- Filtro de combustível
- Filtro de cabine/ar condicionado
- Velas de ignição
- Correia ou corrente dentada (timing)
- Fluido de freio
- Fluido de transmissão
- Líquido de arrefecimento
- Revisão de freios
- Alinhamento e balanceamento
- Pneus
- Bateria
- Revisões gerais de 10.000 km, 20.000 km, 30.000 km, etc.
- Quaisquer outras manutenções específicas deste modelo

Para cada item, informe a quilometragem recomendada (considerando a quilometragem atual do veículo), intervalo de repetição, prioridade e especificações técnicas quando relevante (tipo de óleo, litros, etc).`,
                add_context_from_internet: true,
                response_json_schema: {
                  type: "object",
                  properties: {
                    plans: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          maintenance_type: { type: "string" },
                          description: { type: "string" },
                          recommended_mileage: { type: "number" },
                          recommended_interval_km: { type: "number" },
                          recommended_interval_months: { type: "number" },
                          priority: { type: "string", enum: ["low", "medium", "high"] },
                          technical_note: { type: "string" }
                        }
                      }
                    }
                  }
                }
              });

              if (response.plans && response.plans.length > 0) {
                const toCreate = response.plans.map(plan => ({
                  vehicle_id: newVehicle.id,
                  maintenance_type: plan.maintenance_type,
                  description: plan.description || '',
                  recommended_mileage: plan.recommended_mileage || null,
                  recommended_interval_km: plan.recommended_interval_km || null,
                  recommended_interval_months: plan.recommended_interval_months || null,
                  priority: plan.priority || 'medium',
                  is_completed: false,
                  technical_specs: plan.technical_note ? { parts: [plan.technical_note] } : null
                }));
                await base44.entities.MaintenancePlan.bulkCreate(toCreate);
                queryClient.invalidateQueries({ queryKey: ['maintenance-plans'] });
              }
            })(),
            {
              loading: 'Gerando plano de manutenção com IA...',
              success: 'Plano de manutenção gerado automaticamente!',
              error: 'Não foi possível gerar o plano no momento.'
            }
          );
        }
      });
    }
  };

  const handleEdit = (vehicle) => {
    setEditingVehicle(vehicle);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingVehicle(null);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setFilters({
      brand: 'all',
      model: '',
      year: 'all',
      purchaseDateFrom: '',
      purchaseDateTo: ''
    });
  };

  // Apply filters
  const filteredVehicles = vehicles.filter(vehicle => {
    if (filters.brand !== 'all' && vehicle.brand !== filters.brand) return false;
    if (filters.model && !vehicle.model?.toLowerCase().includes(filters.model.toLowerCase())) return false;
    if (filters.year !== 'all' && vehicle.year?.toString() !== filters.year) return false;
    if (filters.purchaseDateFrom && vehicle.purchase_date && vehicle.purchase_date < filters.purchaseDateFrom) return false;
    if (filters.purchaseDateTo && vehicle.purchase_date && vehicle.purchase_date > filters.purchaseDateTo) return false;
    return true;
  });

  return (
    <div className="bg-gradient-to-br from-slate-50 via-white to-blue-50 flex-1 h-full">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('Home')}>
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Meus Veículos</h1>
              <p className="text-slate-500 text-sm mt-0.5">
                Gerencie seus veículos cadastrados
              </p>
            </div>
          </div>
          
          <Button 
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => setIsFormOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Veículo
          </Button>
        </div>

        {/* Vehicles List */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array(4).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        ) : vehicles.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Car className="w-10 h-10 text-slate-400" />
            </div>
            <h2 className="text-xl font-semibold text-slate-700 mb-2">
              Nenhum veículo cadastrado
            </h2>
            <p className="text-slate-500 mb-6">
              Adicione seu primeiro veículo para começar a registrar manutenções
            </p>
            <Button 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => setIsFormOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Veículo
            </Button>
          </div>
        ) : filteredVehicles.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Car className="w-10 h-10 text-slate-400" />
            </div>
            <h2 className="text-xl font-semibold text-slate-700 mb-2">
              Nenhum veículo encontrado
            </h2>
            <p className="text-slate-500 mb-6">
              Tente ajustar os filtros para encontrar o que procura
            </p>
            <Button 
              variant="outline"
              onClick={handleClearFilters}
            >
              Limpar Filtros
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredVehicles.map(vehicle => (
              <div key={vehicle.id} className="relative group">
                <Link to={createPageUrl('VehicleDetail') + `?id=${vehicle.id}`}>
                  <VehicleCard vehicle={vehicle} onClick={() => {}} />
                </Link>
                
                {/* Action buttons */}
                <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button 
                    variant="secondary" 
                    size="icon" 
                    className="h-8 w-8 bg-white shadow-md"
                    onClick={(e) => {
                      e.preventDefault();
                      handleEdit(vehicle);
                    }}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="secondary" 
                        size="icon" 
                        className="h-8 w-8 bg-white shadow-md text-red-500 hover:text-red-600"
                        onClick={(e) => e.preventDefault()}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir veículo?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir {vehicle.brand} {vehicle.model}? 
                          Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction 
                          className="bg-red-600 hover:bg-red-700"
                          onClick={() => deleteMutation.mutate(vehicle.id)}
                        >
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Form Dialog */}
        <Dialog open={isFormOpen} onOpenChange={handleCloseForm}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingVehicle ? 'Editar Veículo' : 'Novo Veículo'}
              </DialogTitle>
            </DialogHeader>
            <VehicleForm 
              initialData={editingVehicle || {}}
              onSubmit={handleSubmit}
              onCancel={handleCloseForm}
              isLoading={createMutation.isPending || updateMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}