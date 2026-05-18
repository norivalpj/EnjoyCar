import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Gauge, Calendar, AlertCircle, CheckCircle, Clock, Globe, BookOpen } from "lucide-react";
import TechnicalSpecsDisplay from './TechnicalSpecsDisplay';

const MaintenancePlanCard = ({ plan, currentMileage, onMarkComplete }) => {
  const isOverdue = currentMileage && plan.recommended_mileage && currentMileage >= plan.recommended_mileage;
  const isSoon = currentMileage && plan.recommended_mileage && 
    (plan.recommended_mileage - currentMileage) <= 1000 && 
    (plan.recommended_mileage - currentMileage) > 0;

  const priorityColors = {
    low: 'bg-blue-100 text-blue-700',
    medium: 'bg-yellow-100 text-yellow-700',
    high: 'bg-red-100 text-red-700'
  };

  const priorityLabels = {
    low: 'Baixa',
    medium: 'Média',
    high: 'Alta'
  };

  return (
    <Card className={`transition-all ${
      plan.is_completed ? 'bg-slate-50 opacity-60' : 
      isOverdue ? 'border-red-300 bg-red-50/30' : 
      isSoon ? 'border-yellow-300 bg-yellow-50/30' : ''
    }`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={`p-2 rounded-lg flex-shrink-0 ${
              plan.is_completed ? 'bg-green-100' : 
              isOverdue ? 'bg-red-100' : 
              isSoon ? 'bg-yellow-100' : 
              'bg-slate-100'
            }`}>
              {plan.is_completed ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : isOverdue ? (
                <AlertCircle className="w-5 h-5 text-red-600" />
              ) : isSoon ? (
                <Clock className="w-5 h-5 text-yellow-600" />
              ) : (
                <Gauge className="w-5 h-5 text-slate-600" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-2 mb-1 flex-wrap">
                <h4 className={`font-semibold text-slate-800 ${plan.is_completed ? 'line-through' : ''}`}>
                  {plan.maintenance_type}
                </h4>
                <Badge className={priorityColors[plan.priority] || priorityColors.medium} variant="secondary">
                  {priorityLabels[plan.priority] || 'Média'}
                </Badge>
                {plan.extracted_from_pdf ? (
                  <Badge variant="outline" className="text-xs border-purple-300 text-purple-600 flex items-center gap-1">
                    <BookOpen className="w-3 h-3" /> Manual
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs border-blue-300 text-blue-600 flex items-center gap-1">
                    <Globe className="w-3 h-3" /> Fabricante
                  </Badge>
                )}
              </div>

              {plan.description && (
                <p className="text-sm text-slate-600 mb-2">{plan.description}</p>
              )}

              <div className="flex flex-wrap gap-3 text-sm text-slate-500">
                {plan.recommended_mileage && (
                  <div className="flex items-center gap-1">
                    <Gauge className="w-3.5 h-3.5" />
                    <span>{plan.recommended_mileage.toLocaleString('pt-BR')} km</span>
                  </div>
                )}
                {plan.recommended_interval_km && (
                  <span className="text-xs">
                    A cada {plan.recommended_interval_km.toLocaleString('pt-BR')} km
                  </span>
                )}
                {plan.recommended_interval_months && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>A cada {plan.recommended_interval_months} meses</span>
                  </div>
                )}
              </div>

              {isOverdue && !plan.is_completed && (
                <div className="mt-2 text-xs font-medium text-red-600">
                  ⚠ Manutenção atrasada
                </div>
              )}
              {isSoon && !plan.is_completed && (
                <div className="mt-2 text-xs font-medium text-yellow-600">
                  ⏰ Manutenção próxima ({(plan.recommended_mileage - currentMileage).toLocaleString('pt-BR')} km restantes)
                </div>
              )}
            </div>
          </div>

          {!plan.is_completed && onMarkComplete && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => onMarkComplete(plan)}
              className="flex-shrink-0"
            >
              Marcar como Feita
            </Button>
          )}
        </div>

        {/* Technical Specs Display */}
        <TechnicalSpecsDisplay plan={plan} />
      </CardContent>
    </Card>
  );
};

export default MaintenancePlanCard;