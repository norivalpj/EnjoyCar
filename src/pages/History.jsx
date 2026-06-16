import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Wrench, Calendar, DollarSign, Download } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import MaintenanceCard from '../components/maintenance/MaintenanceCard';
import MaintenanceFilters from '../components/filters/MaintenanceFilters';

export default function History() {
  const [filters, setFilters] = useState({
    search: '',
    vehicle: 'all',
    type: 'all',
    dateFrom: '',
    dateTo: '',
    costMin: '',
    costMax: ''
  });

  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => base44.entities.Vehicle.list()
  });

  const { data: maintenances = [], isLoading } = useQuery({
    queryKey: ['maintenances'],
    queryFn: () => base44.entities.Maintenance.list('-date')
  });

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      vehicle: 'all',
      type: 'all',
      dateFrom: '',
      dateTo: '',
      costMin: '',
      costMax: ''
    });
  };

  // Filter maintenances
  const filteredMaintenances = useMemo(() => {
    return maintenances.filter(m => {
      if (filters.search && !m.description?.toLowerCase().includes(filters.search.toLowerCase()) &&
          !m.workshop_name?.toLowerCase().includes(filters.search.toLowerCase())) return false;
      if (filters.vehicle !== 'all' && m.vehicle_id !== filters.vehicle) return false;
      if (filters.type !== 'all' && m.type !== filters.type) return false;
      if (filters.dateFrom && m.date < filters.dateFrom) return false;
      if (filters.dateTo && m.date > filters.dateTo) return false;
      if (filters.costMin && (m.cost || 0) < parseFloat(filters.costMin)) return false;
      if (filters.costMax && (m.cost || 0) > parseFloat(filters.costMax)) return false;
      return true;
    });
  }, [maintenances, filters]);

  // Stats
  const totalCost = filteredMaintenances.reduce((sum, m) => sum + (m.cost || 0), 0);

  // Get vehicle name helper
  const getVehicleName = (vehicleId) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle ? `${vehicle.brand} ${vehicle.model}` : '';
  };

  // Group by month
  const groupedMaintenances = useMemo(() => {
    const groups = {};
    filteredMaintenances.forEach(m => {
      const monthKey = format(new Date(m.date), 'yyyy-MM');
      if (!groups[monthKey]) {
        groups[monthKey] = {
          label: format(new Date(m.date), 'MMMM yyyy', { locale: ptBR }),
          items: []
        };
      }
      groups[monthKey].items.push(m);
    });
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filteredMaintenances]);

  const exportToCsv = () => {
    if (filteredMaintenances.length === 0) return;

    const headers = [
      'Veículo',
      'Data',
      'Tipo (Manutenção)',
      'Quilometragem (km)',
      'Custo (R$)',
      'Oficina',
      'Descrição'
    ];

    const rows = filteredMaintenances.map(m => {
      const vehicleName = getVehicleName(m.vehicle_id);
      const mDate = m.date ? format(new Date(m.date), 'dd/MM/yyyy') : '';
      const cost = m.cost !== undefined ? m.cost.toString().replace('.', ',') : '0,00';
      
      const escapeCsv = (str) => {
        if (!str) return '""';
        const stringified = String(str);
        return `"${stringified.replace(/"/g, '""')}"`;
      };

      return [
        escapeCsv(vehicleName),
        escapeCsv(mDate),
        escapeCsv(m.type || ''),
        escapeCsv(m.mileage || ''),
        escapeCsv(cost),
        escapeCsv(m.workshop_name || ''),
        escapeCsv(m.description || '')
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `historico_manutencoes_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

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
              <h1 className="text-2xl font-bold text-slate-800">Histórico</h1>
              <p className="text-slate-500 text-sm mt-0.5">
                Todas as manutenções realizadas
              </p>
            </div>
          </div>
          
          <Button 
            variant="outline" 
            className="flex items-center gap-2 border-slate-200"
            onClick={exportToCsv}
            disabled={filteredMaintenances.length === 0}
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </Button>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <MaintenanceFilters
            vehicles={vehicles}
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
          />
        </div>

        {/* Summary */}
        <div className="flex items-center gap-6 mb-6 text-sm">
          <div className="flex items-center gap-2 text-slate-500">
            <Wrench className="w-4 h-4" />
            <span>{filteredMaintenances.length} manutenções</span>
          </div>
          <div className="flex items-center gap-2 text-slate-500">
            <DollarSign className="w-4 h-4" />
            <span>Total: R$ {totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        {/* Maintenances List */}
        {isLoading ? (
          <div className="space-y-4">
            {Array(5).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        ) : filteredMaintenances.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-10 h-10 text-slate-400" />
            </div>
            <h2 className="text-xl font-semibold text-slate-700 mb-2">
              Nenhuma manutenção encontrada
            </h2>
            <p className="text-slate-500">
              {filters.search || filters.vehicle !== 'all' || filters.type !== 'all' || 
               filters.dateFrom || filters.dateTo || filters.costMin || filters.costMax
                ? 'Tente ajustar os filtros de busca'
                : 'Comece registrando sua primeira manutenção'}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {groupedMaintenances.map(([key, group]) => (
              <div key={key}>
                <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-3 capitalize">
                  {group.label}
                </h3>
                <div className="space-y-3">
                  {group.items.map(maintenance => (
                    <Link 
                      key={maintenance.id} 
                      to={createPageUrl('MaintenanceDetail') + `?id=${maintenance.id}`}
                    >
                      <MaintenanceCard 
                        maintenance={maintenance}
                        vehicleName={getVehicleName(maintenance.vehicle_id)}
                        onClick={() => {}}
                      />
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}