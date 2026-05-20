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
  ExternalLink, ChevronRight, BookOpen
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
      const results = await base44.entities.Vehicle.filter({ id: vehicleId });
      return results[0];
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

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.Vehicle.delete(vehicleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      navigate(createPageUrl('Vehicles'));
    }
  });

  const totalSpent = maintenances.reduce((sum, m) => sum + (m.cost || 0), 0);

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
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
            <Link to={createPageUrl('NewMaintenance')}>
              <Button variant="outline" size="sm">
                Nova Manutenção <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
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
                onClick={() => deleteMutation.mutate()}
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