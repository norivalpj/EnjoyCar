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
import { ArrowLeft, Plus, Car, Pencil, Trash2 } from "lucide-react";

import VehicleCard from '../components/vehicles/VehicleCard';
import VehicleForm from '../components/forms/VehicleForm';
import VehicleFilters from '../components/filters/VehicleFilters';

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
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Vehicle.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      setEditingVehicle(null);
      setIsFormOpen(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Vehicle.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
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