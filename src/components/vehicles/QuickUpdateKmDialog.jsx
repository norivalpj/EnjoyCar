import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Gauge } from "lucide-react";
import { toast } from "react-hot-toast";
import { base44 } from '@/api/base44Client';

export default function QuickUpdateKmDialog({ open, onOpenChange, vehicles }) {
  const queryClient = useQueryClient();
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [newKmValue, setNewKmValue] = useState("");

  const selectedVehicle = vehicles?.find(v => v.id === selectedVehicleId);

  // If there's only one vehicle and it's not selected yet, auto-select it
  React.useEffect(() => {
    if (vehicles?.length === 1 && !selectedVehicleId) {
      setSelectedVehicleId(vehicles[0].id);
    }
  }, [vehicles, selectedVehicleId]);

  const updateKmMutation = useMutation({
    mutationFn: async ({ vehicleId, newKm }) => {
      const vehicle = vehicles.find(v => v.id === vehicleId);
      if (!vehicle) throw new Error("Veículo não encontrado");

      const history = vehicle.mileage_history || [];
      const updatedHistory = [
        ...history,
        {
          date: new Date().toISOString(),
          mileage: newKm,
          source: 'manual_update'
        }
      ];
      await base44.entities.Vehicle.update(vehicleId, { 
        current_mileage: newKm,
        mileage_history: updatedHistory
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vehicle', variables.vehicleId] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      onOpenChange(false);
      setNewKmValue("");
      setSelectedVehicleId("");
      toast.success("Quilometragem atualizada com sucesso!"); 
    },
    onError: (error) => {
      console.error(error);
      toast.error('Erro ao atualizar KM: ' + error.message);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedVehicleId || !newKmValue) return;
    
    updateKmMutation.mutate({ 
      vehicleId: selectedVehicleId, 
      newKm: Number(newKmValue) 
    });
  };

  const getVehicleName = (vehicle) => {
    if (!vehicle) return '';
    return vehicle.license_plate && vehicle.license_plate !== 'N/A' 
      ? `${vehicle.license_plate} (${vehicle.brand} ${vehicle.model})`
      : `${vehicle.brand} ${vehicle.model}`;
  };

  const isInvalidKm = selectedVehicle && newKmValue && Number(newKmValue) <= (selectedVehicle.current_mileage || 0);

  return (
    <Dialog open={open} onOpenChange={(val) => {
      onOpenChange(val);
      if (!val) {
        setNewKmValue("");
        if (vehicles?.length !== 1) setSelectedVehicleId("");
      }
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gauge className="w-5 h-5 text-blue-500" />
            Atualização Rápida de KM
          </DialogTitle>
          <DialogDescription>
            Atualize a quilometragem atual do seu veículo para manter as previsões de manutenção precisas.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {vehicles?.length > 1 && (
            <div className="space-y-2">
              <Label htmlFor="vehicle">Veículo</Label>
              <Select 
                value={selectedVehicleId} 
                onValueChange={setSelectedVehicleId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um veículo" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map(v => (
                    <SelectItem key={v.id} value={v.id}>
                      {getVehicleName(v)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {vehicles?.length === 1 && (
            <div className="mb-4 text-sm font-medium text-slate-700 bg-slate-50 p-3 rounded-md border border-slate-100">
              Veículo: {getVehicleName(vehicles[0])}
            </div>
          )}

          {selectedVehicle && (
            <div className="space-y-2">
              <Label>Nova Quilometragem</Label>
              <Input
                type="number"
                placeholder={`Atual: ${selectedVehicle.current_mileage?.toLocaleString('pt-BR') || 0} km`}
                value={newKmValue}
                onChange={(e) => setNewKmValue(e.target.value)}
                autoFocus
              />
              {isInvalidKm && (
                <p className="text-xs text-amber-600 mt-1">
                  A nova quilometragem deve ser maior que a atual ({selectedVehicle.current_mileage?.toLocaleString('pt-BR')} km).
                </p>
              )}
            </div>
          )}

          <DialogFooter className="mt-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={updateKmMutation.isPending}
            >
              Cancelar
            </Button>
            <Button 
              type="submit"
              disabled={!selectedVehicleId || !newKmValue || isInvalidKm || updateKmMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {updateKmMutation.isPending ? "Salvando..." : "Salvar Quilometragem"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
