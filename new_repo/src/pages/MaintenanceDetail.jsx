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
  ArrowLeft, Pencil, Trash2, Calendar, Gauge, MapPin, 
  FileText, Receipt, Clock, Package, ExternalLink, Car
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const typeLabels = {
  oil_change: "Troca de Óleo",
  tire: "Pneus",
  brake: "Freios",
  filter: "Filtros",
  battery: "Bateria",
  alignment: "Alinhamento",
  suspension: "Suspensão",
  electrical: "Elétrica",
  engine: "Motor",
  transmission: "Transmissão",
  air_conditioning: "Ar Condicionado",
  general_review: "Revisão Geral",
  other: "Outros"
};

export default function MaintenanceDetail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const urlParams = new URLSearchParams(window.location.search);
  const maintenanceId = urlParams.get('id');

  const { data: maintenance, isLoading } = useQuery({
    queryKey: ['maintenance', maintenanceId],
    queryFn: async () => {
      const results = await base44.entities.Maintenance.filter({ id: maintenanceId });
      return results[0];
    },
    enabled: !!maintenanceId
  });

  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => base44.entities.Vehicle.list()
  });

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.Maintenance.delete(maintenanceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenances'] });
      navigate(createPageUrl('History'));
    }
  });

  const vehicle = vehicles.find(v => v.id === maintenance?.vehicle_id);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <Skeleton className="h-8 w-48 mb-8" />
          <Skeleton className="h-64 rounded-xl mb-4" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!maintenance) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-slate-700 mb-2">Manutenção não encontrada</h2>
          <Link to={createPageUrl('History')}>
            <Button variant="link">Voltar ao histórico</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('History')}>
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                {typeLabels[maintenance.type] || 'Manutenção'}
              </h1>
              <p className="text-slate-500 text-sm mt-0.5">
                {format(new Date(maintenance.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Link to={createPageUrl('EditMaintenance') + `?id=${maintenance.id}`}>
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

        {/* Vehicle Info */}
        {vehicle && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                {vehicle.photo_url ? (
                  <img 
                    src={vehicle.photo_url} 
                    alt={`${vehicle.brand} ${vehicle.model}`}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-slate-100 flex items-center justify-center">
                    <Car className="w-6 h-6 text-slate-400" />
                  </div>
                )}
                <div>
                  <p className="font-semibold text-slate-800">
                    {vehicle.brand} {vehicle.model}
                  </p>
                  <Badge variant="secondary" className="mt-1 font-mono">
                    {vehicle.license_plate}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Info */}
        <Card className="mb-6">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Detalhes do Serviço</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-slate-100">
                  <Calendar className="w-4 h-4 text-slate-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Data</p>
                  <p className="font-medium text-slate-800">
                    {format(new Date(maintenance.date), "dd/MM/yyyy")}
                  </p>
                </div>
              </div>

              {maintenance.mileage && (
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-slate-100">
                    <Gauge className="w-4 h-4 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Quilometragem</p>
                    <p className="font-medium text-slate-800">
                      {maintenance.mileage.toLocaleString('pt-BR')} km
                    </p>
                  </div>
                </div>
              )}

              {maintenance.workshop_name && (
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-slate-100">
                    <MapPin className="w-4 h-4 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Oficina</p>
                    <p className="font-medium text-slate-800">{maintenance.workshop_name}</p>
                  </div>
                </div>
              )}

              {maintenance.invoice_number && (
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-slate-100">
                    <Receipt className="w-4 h-4 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Número da Nota</p>
                    <p className="font-medium text-slate-800">{maintenance.invoice_number}</p>
                  </div>
                </div>
              )}
            </div>

            {maintenance.description && (
              <div className="pt-4 border-t">
                <p className="text-sm text-slate-500 mb-2">Descrição</p>
                <p className="text-slate-700">{maintenance.description}</p>
              </div>
            )}

            {maintenance.cost && (
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Valor Total</span>
                  <span className="text-2xl font-bold text-slate-800">
                    R$ {maintenance.cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Parts */}
        {maintenance.parts_replaced && maintenance.parts_replaced.length > 0 && (
          <Card className="mb-6">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="w-5 h-5" />
                Peças Substituídas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {maintenance.parts_replaced.map((part, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <p className="font-medium text-slate-800">{part.name}</p>
                      <p className="text-sm text-slate-500">
                        {part.quantity}x R$ {part.unit_price?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <span className="font-medium text-slate-700">
                      R$ {((part.quantity || 1) * (part.unit_price || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Photos */}
        {maintenance.photo_urls?.length > 0 && (
          <Card className="mb-6">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Fotos da Manutenção
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {maintenance.photo_urls.map((photo, index) => (
                  <a 
                    key={index}
                    href={photo} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <div className="relative group">
                      <img 
                        src={photo} 
                        alt={`Foto ${index + 1}`}
                        className="w-full h-48 object-cover rounded-lg border"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                        <Button variant="secondary" size="sm">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Ampliar
                        </Button>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Invoice */}
        {maintenance.invoice_url && (
          <Card className="mb-6">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Nota Fiscal / Recibo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <a 
                href={maintenance.invoice_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="block"
              >
                <div className="relative group">
                  <img 
                    src={maintenance.invoice_url} 
                    alt="Nota fiscal"
                    className="w-full max-h-96 object-contain rounded-lg border"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                    <Button variant="secondary">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Ver em tamanho original
                    </Button>
                  </div>
                </div>
              </a>
            </CardContent>
          </Card>
        )}

        {/* Next Maintenance */}
        {(maintenance.next_maintenance_date || maintenance.next_maintenance_mileage) && (
          <Card className="border-l-4 border-l-blue-400 bg-blue-50/50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-blue-500 mt-0.5" />
                <div>
                  <h3 className="font-medium text-blue-800">Próxima Manutenção Prevista</h3>
                  <div className="flex gap-4 mt-2 text-sm text-blue-600">
                    {maintenance.next_maintenance_date && (
                      <span>
                        {format(new Date(maintenance.next_maintenance_date), "dd/MM/yyyy")}
                      </span>
                    )}
                    {maintenance.next_maintenance_mileage && (
                      <span>
                        {maintenance.next_maintenance_mileage.toLocaleString('pt-BR')} km
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Delete Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir manutenção?</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir esta manutenção? Esta ação não pode ser desfeita.
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