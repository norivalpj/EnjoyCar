import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Droplets, Circle, Disc, Filter, Battery, 
  Compass, Car, Zap, Settings, Snowflake, 
  ClipboardCheck, MoreHorizontal, FileText, Gauge
} from "lucide-react";

const typeConfig = {
  oil_change: { label: "Troca de Óleo", icon: Droplets, color: "bg-amber-100 text-amber-700" },
  tire: { label: "Pneus", icon: Circle, color: "bg-slate-100 text-slate-700" },
  brake: { label: "Freios", icon: Disc, color: "bg-red-100 text-red-700" },
  filter: { label: "Filtros", icon: Filter, color: "bg-green-100 text-green-700" },
  battery: { label: "Bateria", icon: Battery, color: "bg-yellow-100 text-yellow-700" },
  alignment: { label: "Alinhamento", icon: Compass, color: "bg-blue-100 text-blue-700" },
  suspension: { label: "Suspensão", icon: Car, color: "bg-purple-100 text-purple-700" },
  electrical: { label: "Elétrica", icon: Zap, color: "bg-orange-100 text-orange-700" },
  engine: { label: "Motor", icon: Settings, color: "bg-rose-100 text-rose-700" },
  transmission: { label: "Transmissão", icon: Settings, color: "bg-indigo-100 text-indigo-700" },
  air_conditioning: { label: "Ar Condicionado", icon: Snowflake, color: "bg-cyan-100 text-cyan-700" },
  general_review: { label: "Revisão Geral", icon: ClipboardCheck, color: "bg-emerald-100 text-emerald-700" },
  other: { label: "Outros", icon: MoreHorizontal, color: "bg-gray-100 text-gray-700" }
};

const MaintenanceCard = ({ maintenance, vehicleName, onClick }) => {
  const config = typeConfig[maintenance.type] || typeConfig.other;
  const Icon = config.icon;

  return (
    <Card 
      className="cursor-pointer transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 border-l-4 border-l-transparent hover:border-l-blue-500"
      onClick={() => onClick(maintenance)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className={`p-2.5 rounded-xl ${config.color}`}>
              <Icon className="w-5 h-5" />
            </div>
            
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-slate-800">{config.label}</h4>
                {maintenance.invoice_url && (
                  <FileText className="w-4 h-4 text-slate-400" />
                )}
              </div>
              
              {maintenance.description && (
                <p className="text-sm text-slate-500 mt-0.5 line-clamp-1">
                  {maintenance.description}
                </p>
              )}
              
              <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                <span>
                  {format(new Date(maintenance.date), "dd MMM yyyy", { locale: ptBR })}
                </span>
                {maintenance.workshop_name && (
                  <span>• {maintenance.workshop_name}</span>
                )}
                {maintenance.mileage && (
                  <span className="flex items-center gap-1">
                    <Gauge className="w-3 h-3" />
                    {maintenance.mileage.toLocaleString('pt-BR')} km
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="text-right">
            {maintenance.cost && (
              <span className="font-semibold text-slate-800">
                R$ {maintenance.cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            )}
            {vehicleName && (
              <p className="text-xs text-slate-400 mt-1">{vehicleName}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MaintenanceCard;