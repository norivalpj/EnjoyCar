import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X } from "lucide-react";

const maintenanceTypes = [
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
  const hasActiveFilters = filters.vehicle || filters.type !== 'all' || filters.dateFrom || 
    filters.dateTo || filters.costMin || filters.costMax || filters.search;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2 md:col-span-3">
            <Label>Buscar</Label>
            <Input 
              placeholder="Buscar por descrição, oficina..."
              value={filters.search}
              onChange={(e) => onFilterChange('search', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Veículo</Label>
            <Select value={filters.vehicle} onValueChange={(value) => onFilterChange('vehicle', value)}>
              <SelectTrigger>
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
          </div>

          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select value={filters.type} onValueChange={(value) => onFilterChange('type', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                {maintenanceTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Data (De)</Label>
            <Input 
              type="date"
              value={filters.dateFrom}
              onChange={(e) => onFilterChange('dateFrom', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Data (Até)</Label>
            <Input 
              type="date"
              value={filters.dateTo}
              onChange={(e) => onFilterChange('dateTo', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Custo Mínimo (R$)</Label>
            <Input 
              type="number"
              placeholder="0,00"
              value={filters.costMin}
              onChange={(e) => onFilterChange('costMin', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Custo Máximo (R$)</Label>
            <Input 
              type="number"
              placeholder="0,00"
              value={filters.costMax}
              onChange={(e) => onFilterChange('costMax', e.target.value)}
            />
          </div>

          {hasActiveFilters && (
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={onClearFilters}
                className="w-full"
              >
                <X className="w-4 h-4 mr-2" />
                Limpar Filtros
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MaintenanceFilters;