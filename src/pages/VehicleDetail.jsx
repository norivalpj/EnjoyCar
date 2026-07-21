import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, 
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter, 
  AlertDialogHeader, AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowLeft, Pencil, Trash2, Calendar, Gauge, 
  Palette, FileText, ShoppingCart, Building2, CreditCard, 
  ExternalLink, ChevronRight, BookOpen, Droplets, Map, Download
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import MaintenanceCard from '../components/maintenance/MaintenanceCard';
import MaintenanceSuggestions from '../components/maintenance/MaintenanceSuggestions';

export default function VehicleDetail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

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

  const { data: maintenances = [], isLoading: loadingMaintenances } = useQuery({
    queryKey: ['maintenances', vehicleId],
    queryFn: () => base44.entities.Maintenance.filter({ vehicle_id: vehicleId }, '-date'),
    enabled: !!vehicleId
  });

  const { data: maintenancePlans = [] } = useQuery({
    queryKey: ['maintenance-plans', vehicleId],
    queryFn: () => base44.entities.MaintenancePlan.filter({ vehicle_id: vehicleId }),
    enabled: !!vehicleId
  });

  const overduePlans = maintenancePlans.filter(p => 
    !p.is_completed && vehicle?.current_mileage && p.recommended_mileage && 
    vehicle.current_mileage >= p.recommended_mileage
  ).length;

  // Add CSV export function
  const exportToCsv = () => {
    if (maintenances.length === 0) return;

    const headers = [
      'Veículo',
      'Data',
      'Tipo (Manutenção)',
      'Quilometragem (km)',
      'Custo (R$)',
      'Oficina',
      'Descrição'
    ];

    const rows = maintenances.map(m => {
      const vehicleName = `${vehicle.brand} ${vehicle.model}`;
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
    link.setAttribute('download', `historico_manutencoes_${vehicle.license_plate || 'veiculo'}_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.Vehicle.delete(vehicleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      navigate(createPageUrl('Vehicles'));
    }
  });

  const handleDelete = () => {
    toast.promise(deleteMutation.mutateAsync(), {
      loading: 'Excluindo veículo...',
      success: 'Veículo excluído!',
      error: (err) => `Erro ao excluir: ${err.message}`
    });
  };

  const totalSpent = maintenances.reduce((sum, m) => sum + (m.cost || 0), 0);

  const nextOilChangePlan = maintenancePlans
    .filter(p => !p.is_completed && p.maintenance_type?.toLowerCase().includes('óleo'))
    .sort((a, b) => (a.recommended_mileage || 0) - (b.recommended_mileage || 0))[0];
    
  const totalDistance = (vehicle?.current_mileage || 0) - (vehicle?.purchase_mileage || 0);

  if (loadingVehicle) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Skeleton className="h-8 w-48 mb-8" />
          <Skeleton className="h-64 rounded-xl mb-4" />
          <Skeleton className="h-48 rounded-xl" />
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
            <Link to={createPageUrl('Vehicles')}>
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                {vehicle.brand} {vehicle.model}
              </h1>
              <Badge variant="secondary" className="mt-1 font-mono">
                {vehicle.license_plate}
              </Badge>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Link to={createPageUrl('Vehicles')}>
              <Button variant="outline" size="icon">
                <Pencil className="w-4 h-4" />
              </Button>
            </Link>
            <Button 
              variant="outline" 
              size="icon" 
              className="text-red-500 hover:text-red-600"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Vehicle Photos Gallery */}
        {(vehicle.photo_urls?.length > 0 || vehicle.photo_url) && (
          <div className="mb-8">
            {vehicle.photo_urls?.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {vehicle.photo_urls.map((photo, index) => (
                  <img 
                    key={index}
                    src={photo} 
                    alt={`${vehicle.brand} ${vehicle.model} - Foto ${index + 1}`}
                    className="w-full h-48 object-cover rounded-xl shadow-lg cursor-pointer hover:scale-105 transition-transform"
                    onClick={() => window.open(photo, '_blank')}
                  />
                ))}
              </div>
            ) : vehicle.photo_url && (
              <img 
                src={vehicle.photo_url} 
                alt={`${vehicle.brand} ${vehicle.model}`}
                className="w-full max-h-96 object-cover rounded-2xl shadow-lg"
              />
            )}
          </div>
        )}

        {/* Visão Geral (Overview) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="border-l-4 border-slate-700 bg-slate-50">
            <CardContent className="p-6 flex items-start gap-4">
              <div className="p-3 bg-slate-200 text-slate-800 rounded-full">
                <Map className="w-8 h-8" />
              </div>
              <div>
                <p className="text-slate-500 font-medium">Distância Total Percorrida</p>
                <p className="text-3xl font-bold text-slate-800 tracking-tight mt-1">
                  {totalDistance.toLocaleString('pt-BR')} <span className="text-lg font-medium text-slate-500">km</span>
                </p>
                {vehicle?.purchase_mileage > 0 && (
                  <p className="text-sm text-slate-500 mt-2">
                    Desde a compra ({vehicle.purchase_mileage.toLocaleString('pt-BR')} km)
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-blue-600 bg-blue-50">
            <CardContent className="p-6 flex items-start gap-4">
              <div className="p-3 bg-blue-200 text-blue-800 rounded-full">
                <Droplets className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <p className="text-blue-600 font-medium font-semibold">Próxima Troca de Óleo</p>
                {nextOilChangePlan ? (
                  <>
                    <p className="text-3xl font-bold text-slate-800 tracking-tight mt-1">
                      {(nextOilChangePlan.recommended_mileage || 0).toLocaleString('pt-BR')} <span className="text-lg font-medium text-slate-500">km</span>
                    </p>
                    <div className="mt-2 w-full bg-blue-200 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-blue-600 h-full rounded-full transition-all" 
                        style={{ 
                          width: `${Math.min(100, Math.max(0, ((vehicle?.current_mileage || 0) / (nextOilChangePlan.recommended_mileage || 1)) * 100))}%` 
                        }} 
                      />
                    </div>
                    {vehicle?.current_mileage && nextOilChangePlan.recommended_mileage && (
                      <p className="text-sm text-slate-600 mt-2">
                        Faltam {(nextOilChangePlan.recommended_mileage - vehicle.current_mileage).toLocaleString('pt-BR')} km
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-lg font-medium text-slate-700 mt-2">
                    Não configurada
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Basic Info */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Informações do Veículo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {vehicle.year && (
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-slate-100">
                      <Calendar className="w-4 h-4 text-slate-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Ano</p>
                      <p className="font-medium text-slate-800">{vehicle.year}</p>
                    </div>
                  </div>
                )}

                {vehicle.color && (
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-slate-100">
                      <Palette className="w-4 h-4 text-slate-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Cor</p>
                      <p className="font-medium text-slate-800">{vehicle.color}</p>
                    </div>
                  </div>
                )}

                {vehicle.current_mileage && (
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-slate-100">
                      <Gauge className="w-4 h-4 text-slate-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Quilometragem Atual</p>
                      <p className="font-medium text-slate-800">
                        {vehicle.current_mileage.toLocaleString('pt-BR')} km
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Estatísticas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-slate-500">Manutenções</p>
                <p className="text-2xl font-bold text-slate-800">{maintenances.length}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Gasto</p>
                <p className="text-2xl font-bold text-slate-800">
                  R$ {totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Maintenance Suggestions */}
        <div className="mb-8">
          <MaintenanceSuggestions vehicleId={vehicleId} />
        </div>

        {/* Maintenance Plan */}
        <Card className="mb-8 border-blue-200 bg-blue-50/30">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              <CardTitle className="text-lg">Plano de Manutenção</CardTitle>
            </div>
            <Link to={createPageUrl('MaintenancePlan') + `?id=${vehicleId}`}>
              <Button variant="outline" size="sm" className="bg-white">
                Ver Plano Completo <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {maintenancePlans.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-slate-600 mb-3">
                  Envie fotos do manual para criar o plano de manutenção automaticamente
                </p>
                <Link to={createPageUrl('MaintenancePlan') + `?id=${vehicleId}`}>
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                    Criar Plano de Manutenção
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-slate-800">{maintenancePlans.filter(p => !p.is_completed).length}</p>
                    <p className="text-xs text-slate-500">Pendentes</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-red-600">{overduePlans}</p>
                    <p className="text-xs text-slate-500">Atrasadas</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-green-600">{maintenancePlans.filter(p => p.is_completed).length}</p>
                    <p className="text-xs text-slate-500">Concluídas</p>
                  </div>
                </div>
                {overduePlans > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                    ⚠ Você tem {overduePlans} manutenção(ões) atrasada(s)
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Purchase Info */}
        {(vehicle.purchase_store || vehicle.purchase_date || vehicle.purchase_price) && (
          <Card className="mb-8">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Dados da Compra
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {vehicle.purchase_store && (
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-blue-50">
                      <Building2 className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Loja/Concessionária</p>
                      <p className="font-medium text-slate-800">{vehicle.purchase_store}</p>
                      {vehicle.purchase_cnpj && (
                        <p className="text-xs text-slate-400 mt-0.5">CNPJ: {vehicle.purchase_cnpj}</p>
                      )}
                    </div>
                  </div>
                )}

                {vehicle.purchase_date && (
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-blue-50">
                      <Calendar className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Data da Compra</p>
                      <p className="font-medium text-slate-800">
                        {format(new Date(vehicle.purchase_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                )}

                {vehicle.purchase_price && (
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-blue-50">
                      <CreditCard className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Valor Pago</p>
                      <p className="font-medium text-slate-800">
                        R$ {vehicle.purchase_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                )}

                {vehicle.purchase_mileage && (
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-blue-50">
                      <Gauge className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">KM na Compra</p>
                      <p className="font-medium text-slate-800">
                        {vehicle.purchase_mileage.toLocaleString('pt-BR')} km
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {vehicle.purchase_notes && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-slate-500 mb-2">Observações</p>
                  <p className="text-slate-700">{vehicle.purchase_notes}</p>
                </div>
              )}

              {vehicle.purchase_invoice_url && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-slate-500 mb-3">Nota Fiscal</p>
                  <a 
                    href={vehicle.purchase_invoice_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <div className="relative group">
                      <img 
                        src={vehicle.purchase_invoice_url} 
                        alt="Nota fiscal de compra"
                        className="w-full max-h-64 object-contain rounded-lg border"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                        <Button variant="secondary">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Ver em tamanho original
                        </Button>
                      </div>
                    </div>
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Maintenance History */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-lg">Histórico de Manutenções</CardTitle>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={exportToCsv}
                disabled={maintenances.length === 0}
                title="Exportar CSV"
              >
                <Download className="w-4 h-4 md:mr-1" />
                <span className="hidden md:inline">Exportar CSV</span>
              </Button>
              <Link to={createPageUrl('NewMaintenance')}>
                <Button variant="outline" size="sm">
                  Nova Manutenção <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {loadingMaintenances ? (
              Array(3).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-lg" />
              ))
            ) : maintenances.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">Nenhuma manutenção registrada</p>
                <Link to={createPageUrl('NewMaintenance')}>
                  <Button variant="link" size="sm" className="mt-2">
                    Adicionar manutenção
                  </Button>
                </Link>
              </div>
            ) : (
              maintenances.map(maintenance => (
                <Link 
                  key={maintenance.id} 
                  to={createPageUrl('MaintenanceDetail') + `?id=${maintenance.id}`}
                >
                  <MaintenanceCard 
                    maintenance={maintenance} 
                    onClick={() => {}}
                  />
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        {/* Delete Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir veículo?</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir {vehicle.brand} {vehicle.model}? 
                Todas as manutenções associadas também serão perdidas. Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                className="bg-red-600 hover:bg-red-700"
                onClick={handleDelete}
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}