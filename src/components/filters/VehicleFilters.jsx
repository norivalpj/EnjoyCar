import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X } from "lucide-react";

const VehicleFilters = ({ vehicles, filters, onFilterChange, onClearFilters }) => {
  const brands = [...new Set(vehicles.map(v => v.brand).filter(Boolean))];
  const years = [...new Set(vehicles.map(v => v.year).filter(Boolean))].sort((a, b) => b - a);

  const hasActiveFilters = filters.brand || filters.model || filters.year || filters.purchaseDateFrom || filters.purchaseDateTo;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Marca</Label>
            <Select value={filters.brand} onValueChange={(value) => onFilterChange('brand', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Todas as marcas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as marcas</SelectItem>
                {brands.map(brand => (
                  <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Modelo</Label>
            <Input 
              placeholder="Digite o modelo..."
              value={filters.model}
              onChange={(e) => onFilterChange('model', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Ano</Label>
            <Select value={filters.year} onValueChange={(value) => onFilterChange('year', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os anos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os anos</SelectItem>
                {years.map(year => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Data de Compra (De)</Label>
            <Input 
              type="date"
              value={filters.purchaseDateFrom}
              onChange={(e) => onFilterChange('purchaseDateFrom', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Data de Compra (Até)</Label>
            <Input 
              type="date"
              value={filters.purchaseDateTo}
              onChange={(e) => onFilterChange('purchaseDateTo', e.target.value)}
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

export default VehicleFilters;