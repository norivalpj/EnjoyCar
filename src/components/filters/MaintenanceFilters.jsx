import React, { useEffect } from 'react';
import { useForm, Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X } from "lucide-react";

const maintenanceTypes = [
  { value: "all", label: "Todos os tipos" },
  { value: "oil_change", label: "Troca de Óleo" },
  { value: "tire", label: "Pneus" },
  { value: "brake", label: "Freios" },
  { value: "filter", label: "Filtros" },
  { value: "battery", label: "Bateria" },
  { value: "alignment", label: "Alinhamento" },
  { value: "suspension", label: "Suspensão" },
  { value: "electrical", label: "Elétrica" },
  { value: "engine", label: "Motor" },
  { value: "transmission", label: "Transmissão" },
  { value: "air_conditioning", label: "Ar Condicionado" },
  { value: "general_review", label: "Revisão Geral" },
  { value: "other", label: "Outros" }
];

const MaintenanceFilters = ({ vehicles, filters, onFilterChange, onClearFilters }) => {
  const { register, control, watch, reset, getValues } = useForm({
    defaultValues: filters
  });

  // Watch for changes in form to notify parent. Since history wants continuous filtering,
  // we'll update parent on every form change
  useEffect(() => {
    const subscription = watch((value, { name, type }) => {
      if (name) {
        onFilterChange(name, value[name]);
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, onFilterChange]);

  const handleClear = () => {
    reset({
      search: '',
      vehicle: 'all',
      type: 'all',
      dateFrom: '',
      dateTo: '',
      costMin: '',
      costMax: ''
    });
    onClearFilters();
  };

  const currentValues = watch();
  const hasActiveFilters = currentValues.vehicle !== 'all' || currentValues.type !== 'all' || 
    currentValues.dateFrom || currentValues.dateTo || currentValues.costMin || currentValues.costMax || currentValues.search;

  return (
    <Card>
      <CardContent className="p-4">
        <form className="grid grid-cols-1 md:grid-cols-3 gap-4" onSubmit={(e) => e.preventDefault()}>
          <div className="space-y-2 md:col-span-3">
            <Label htmlFor="search">Buscar</Label>
            <Input 
              id="search"
              placeholder="Buscar por descrição, oficina..."
              {...register("search")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vehicle">Veículo</Label>
            <Controller
              name="vehicle"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="vehicle">
                    <SelectValue placeholder="Todos os veículos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os veículos</SelectItem>
                    {vehicles.map(vehicle => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.brand} {vehicle.model} - {vehicle.license_plate}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Tipo</Label>
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Todos os tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    {maintenanceTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dateFrom">Data (De)</Label>
            <Input 
              id="dateFrom"
              type="date"
              {...register("dateFrom")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dateTo">Data (Até)</Label>
            <Input 
              id="dateTo"
              type="date"
              {...register("dateTo")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="costMin">Custo Mínimo (R$)</Label>
            <Input 
              id="costMin"
              type="number"
              step="0.01"
              placeholder="0,00"
              {...register("costMin")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="costMax">Custo Máximo (R$)</Label>
            <Input 
              id="costMax"
              type="number"
              step="0.01"
              placeholder="0,00"
              {...register("costMax")}
            />
          </div>

          {hasActiveFilters && (
            <div className="flex items-end">
              <Button 
                type="button"
                variant="outline" 
                onClick={handleClear}
                className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
              >
                <X className="w-4 h-4 mr-2" />
                Limpar Filtros
              </Button>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
};

export default MaintenanceFilters;