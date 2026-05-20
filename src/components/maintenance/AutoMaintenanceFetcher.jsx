import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, CheckCircle, ChevronDown, ChevronUp, AlertCircle } from "lucide-react";

const AutoMaintenanceFetcher = ({ vehicle, onComplete }) => {
  const queryClient = useQueryClient();
  const [fetched, setFetched] = useState(false);
  const [previewPlans, setPreviewPlans] = useState([]);
  const [showAll, setShowAll] = useState(false);

  const fetchMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é um especialista em manutenção automotiva. Com base nas informações do veículo abaixo, gere o plano de manutenção programada completo e detalhado conforme recomendado pelo fabricante.

VEÍCULO: ${vehicle.brand} ${vehicle.model} ${vehicle.year ? `(${vehicle.year})` : ''}
Quilometragem atual: ${vehicle.current_mileage ? vehicle.current_mileage.toLocaleString('pt-BR') + ' km' : 'não informada'}

Liste TODAS as revisões e manutenções programadas pelo fabricante, incluindo:
- Troca de óleo e filtro de óleo
- Filtro de ar do motor
- Filtro de combustível
- Filtro de cabine/ar condicionado
- Velas de ignição
- Correia ou corrente dentada (timing)
- Fluido de freio
- Fluido de transmissão
- Líquido de arrefecimento
- Revisão de freios
- Alinhamento e balanceamento
- Pneus
- Bateria
- Revisões gerais de 10.000 km, 20.000 km, 30.000 km, etc.
- Quaisquer outras manutenções específicas deste modelo

Para cada item, informe a quilometragem recomendada (considerando a quilometragem atual do veículo), intervalo de repetição, prioridade e especificações técnicas quando relevante (tipo de óleo, litros, etc).`,
        add_context_from_internet: true,
        model: 'gemini_3_flash',
        response_json_schema: {
          type: "object",
          properties: {
            plans: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  maintenance_type: { type: "string" },
                  description: { type: "string" },
                  recommended_mileage: { type: "number" },
                  recommended_interval_km: { type: "number" },
                  recommended_interval_months: { type: "number" },
                  priority: { type: "string", enum: ["low", "medium", "high"] },
                  technical_note: { type: "string" }
                }
              }
            }
          }
        }
      });

      return response.plans || [];
    },
    onSuccess: async (plans) => {
      setPreviewPlans(plans);
      setFetched(true);
    }
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const currentMileage = vehicle.current_mileage || 0;
      const purchaseMileage = vehicle.purchase_mileage || 0;

      const toCreate = previewPlans.map(plan => ({
        vehicle_id: vehicle.id,
        maintenance_type: plan.maintenance_type,
        description: plan.description || '',
        recommended_mileage: plan.recommended_mileage || null,
        recommended_interval_km: plan.recommended_interval_km || null,
        recommended_interval_months: plan.recommended_interval_months || null,
        priority: plan.priority || 'medium',
        is_completed: false,
        technical_specs: plan.technical_note ? { parts: [plan.technical_note] } : null
      }));

      await base44.entities.MaintenancePlan.bulkCreate(toCreate);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-plans'] });
      onComplete();
    }
  });

  const priorityColors = {
    low: 'bg-blue-100 text-blue-700',
    medium: 'bg-yellow-100 text-yellow-700',
    high: 'bg-red-100 text-red-700'
  };

  const priorityLabels = { low: 'Baixa', medium: 'Média', high: 'Alta' };

  const visiblePlans = showAll ? previewPlans : previewPlans.slice(0, 5);

  return (
    <div className="space-y-4">
      {!fetched ? (
        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto mb-4">
              {fetchMutation.isPending ? (
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              ) : (
                <Sparkles className="w-8 h-8 text-white" />
              )}
            </div>

            <h3 className="text-lg font-bold text-slate-800 mb-2">
              {fetchMutation.isPending 
                ? 'Buscando plano de manutenção...' 
                : 'Gerar Plano Automaticamente'}
            </h3>

            <p className="text-sm text-slate-600 mb-6 max-w-md mx-auto">
              {fetchMutation.isPending
                ? `Consultando as recomendações do fabricante para o ${vehicle.brand} ${vehicle.model}...`
                : `A IA vai buscar na internet todas as revisões e manutenções programadas pelo fabricante para o ${vehicle.brand} ${vehicle.model}${vehicle.year ? ` ${vehicle.year}` : ''}.`
              }
            </p>

            {!fetchMutation.isPending && (
              <Button
                onClick={() => fetchMutation.mutate()}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                size="lg"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Buscar Plano de Manutenção
              </Button>
            )}

            {fetchMutation.isPending && (
              <div className="flex items-center justify-center gap-2 text-blue-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>Isso pode levar alguns segundos...</span>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Success Header */}
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-green-800">
                  {previewPlans.length} itens de manutenção encontrados
                </p>
                <p className="text-xs text-green-600">
                  Revise abaixo e confirme para salvar no plano
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Plans Preview */}
          <div className="space-y-2">
            {visiblePlans.map((plan, idx) => (
              <Card key={idx} className="border-slate-200">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-slate-800 text-sm">{plan.maintenance_type}</span>
                        <Badge className={`text-xs ${priorityColors[plan.priority] || priorityColors.medium}`} variant="secondary">
                          {priorityLabels[plan.priority] || 'Média'}
                        </Badge>
                      </div>
                      {plan.description && (
                        <p className="text-xs text-slate-600 mb-1">{plan.description}</p>
                      )}
                      <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                        {plan.recommended_mileage && (
                          <span>📍 {plan.recommended_mileage.toLocaleString('pt-BR')} km</span>
                        )}
                        {plan.recommended_interval_km && (
                          <span>🔄 A cada {plan.recommended_interval_km.toLocaleString('pt-BR')} km</span>
                        )}
                        {plan.recommended_interval_months && (
                          <span>📅 A cada {plan.recommended_interval_months} meses</span>
                        )}
                      </div>
                      {plan.technical_note && (
                        <p className="text-xs text-blue-600 mt-1">💡 {plan.technical_note}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {previewPlans.length > 5 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAll(!showAll)}
              className="w-full"
            >
              {showAll ? (
                <><ChevronUp className="w-4 h-4 mr-2" />Ver menos</>
              ) : (
                <><ChevronDown className="w-4 h-4 mr-2" />Ver todos ({previewPlans.length - 5} a mais)</>
              )}
            </Button>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => { setFetched(false); setPreviewPlans([]); }}
              className="flex-1"
            >
              Buscar Novamente
            </Button>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {saveMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              Confirmar e Salvar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AutoMaintenanceFetcher;