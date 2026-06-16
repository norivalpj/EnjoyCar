import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Sparkles, FileText, TrendingUp, AlertTriangle, DollarSign } from "lucide-react";
import AIReport from '../components/reports/AIReport';
import CostDashboard from '../components/reports/CostDashboard';

export default function Reports() {
  const [selectedVehicle, setSelectedVehicle] = useState('all');
  const [report, setReport] = useState(null);

  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => base44.entities.Vehicle.list()
  });

  const { data: allMaintenances = [] } = useQuery({
    queryKey: ['maintenances'],
    queryFn: () => base44.entities.Maintenance.list('-date')
  });

  const generateReportMutation = useMutation({
    mutationFn: async () => {
      const maintenances = selectedVehicle === 'all' 
        ? allMaintenances 
        : allMaintenances.filter(m => m.vehicle_id === selectedVehicle);

      const vehicle = selectedVehicle !== 'all' 
        ? vehicles.find(v => v.id === selectedVehicle) 
        : null;

      // Get maintenance plans for additional context
      const plans = selectedVehicle !== 'all' 
        ? await base44.entities.MaintenancePlan.filter({ vehicle_id: selectedVehicle })
        : await base44.entities.MaintenancePlan.list();

      const prompt = `Você é um especialista em manutenção automotiva. Analise os seguintes dados de manutenção ${vehicle ? `do veículo ${vehicle.brand} ${vehicle.model} (${vehicle.year})` : 'de todos os veículos'} e gere um relatório abrangente.

DADOS DE MANUTENÇÃO:
${JSON.stringify(maintenances, null, 2)}

${vehicle ? `DADOS DO VEÍCULO:
${JSON.stringify(vehicle, null, 2)}` : ''}

PLANO DE MANUTENÇÃO (com especificações técnicas extraídas do manual):
${JSON.stringify(plans, null, 2)}

Use as especificações técnicas do manual (fluidos, peças, torque) e procedimentos de segurança para enriquecer suas recomendações e análises.

Gere um relatório detalhado no seguinte formato JSON, incluindo análises profundas e insights práticos:

{
  "summary": {
    "total_maintenances": number,
    "total_cost": number,
    "average_cost": number,
    "period_analyzed": string,
    "most_common_service": string
  },
  "cost_analysis": {
    "monthly_average": number,
    "highest_expense": { "type": string, "cost": number, "date": string },
    "cost_trend": "increasing" | "stable" | "decreasing",
    "trend_explanation": string
  },
  "maintenance_patterns": {
    "frequency": string,
    "most_frequent_services": [{ "type": string, "count": number }],
    "seasonal_patterns": string
  },
  "potential_issues": [
    {
      "severity": "high" | "medium" | "low",
      "issue": string,
      "explanation": string,
      "recommendation": string
    }
  ],
  "predictive_analysis": {
    "next_6_months_cost": number,
    "upcoming_services": [
      {
        "service": string,
        "estimated_cost": number,
        "timeframe": string,
        "priority": "high" | "medium" | "low"
      }
    ],
    "cost_saving_tips": [string]
  },
  "recommendations": [
    {
      "title": string,
      "description": string,
      "priority": "high" | "medium" | "low"
    }
  ],
  "vehicle_health_score": {
    "score": number,
    "explanation": string
  }
}

Seja detalhado, específico e forneça insights acionáveis baseados nos dados reais de manutenção.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            summary: {
              type: "object",
              properties: {
                total_maintenances: { type: "number" },
                total_cost: { type: "number" },
                average_cost: { type: "number" },
                period_analyzed: { type: "string" },
                most_common_service: { type: "string" }
              }
            },
            cost_analysis: {
              type: "object",
              properties: {
                monthly_average: { type: "number" },
                highest_expense: {
                  type: "object",
                  properties: {
                    type: { type: "string" },
                    cost: { type: "number" },
                    date: { type: "string" }
                  }
                },
                cost_trend: { type: "string" },
                trend_explanation: { type: "string" }
              }
            },
            maintenance_patterns: {
              type: "object",
              properties: {
                frequency: { type: "string" },
                most_frequent_services: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      type: { type: "string" },
                      count: { type: "number" }
                    }
                  }
                },
                seasonal_patterns: { type: "string" }
              }
            },
            potential_issues: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  severity: { type: "string" },
                  issue: { type: "string" },
                  explanation: { type: "string" },
                  recommendation: { type: "string" }
                }
              }
            },
            predictive_analysis: {
              type: "object",
              properties: {
                next_6_months_cost: { type: "number" },
                upcoming_services: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      service: { type: "string" },
                      estimated_cost: { type: "number" },
                      timeframe: { type: "string" },
                      priority: { type: "string" }
                    }
                  }
                },
                cost_saving_tips: {
                  type: "array",
                  items: { type: "string" }
                }
              }
            },
            recommendations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  priority: { type: "string" }
                }
              }
            },
            vehicle_health_score: {
              type: "object",
              properties: {
                score: { type: "number" },
                explanation: { type: "string" }
              }
            }
          }
        }
      });

      return response;
    },
    onSuccess: (data) => {
      setReport(data);
    }
  });

  const hasData = allMaintenances.length > 0;
  const selectedVehicleData = selectedVehicle !== 'all' 
    ? vehicles.find(v => v.id === selectedVehicle) 
    : null;

  return (
    <div className="bg-gradient-to-br from-slate-50 via-white to-blue-50 flex-1 h-full">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('Home')}>
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Relatórios com IA</h1>
              <p className="text-slate-500 text-sm mt-0.5">
                Análises avançadas e previsões para sua frota
              </p>
            </div>
          </div>
        </div>

        {/* Always-visible cost dashboard */}
        {allMaintenances.length > 0 && vehicles.length > 0 && (
          <div className="mb-10">
            <CostDashboard vehicles={vehicles} maintenances={allMaintenances} />
            <div className="border-t border-slate-200 mt-8 pt-2" />
          </div>
        )}

        {!hasData ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-slate-700 mb-2">
                Dados Insuficientes
              </h2>
              <p className="text-slate-500 mb-6">
                Você precisa registrar manutenções antes de gerar relatórios
              </p>
              <Link to={createPageUrl('NewMaintenance')}>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Adicionar Manutenção
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Report Configuration */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                  Configurar Relatório
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um veículo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os Veículos</SelectItem>
                        {vehicles.map(vehicle => (
                          <SelectItem key={vehicle.id} value={vehicle.id}>
                            {vehicle.brand} {vehicle.model} - {vehicle.license_plate}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button 
                    onClick={() => generateReportMutation.mutate()}
                    disabled={generateReportMutation.isPending}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    {generateReportMutation.isPending ? (
                      <>
                        <Sparkles className="w-4 h-4 mr-2 animate-pulse" />
                        Gerando Relatório...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Gerar Relatório com IA
                      </>
                    )}
                  </Button>
                </div>

                {selectedVehicleData && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-700">
                      📊 Analisando: <strong>{selectedVehicleData.brand} {selectedVehicleData.model}</strong>
                      {selectedVehicleData.current_mileage && (
                        <> • {selectedVehicleData.current_mileage.toLocaleString('pt-BR')} km</>
                      )}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Loading State */}
            {generateReportMutation.isPending && (
              <Card>
                <CardContent className="p-8">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <Sparkles className="w-6 h-6 text-blue-600 animate-pulse" />
                    <p className="text-lg font-medium text-slate-700">
                      A IA está analisando seus dados...
                    </p>
                  </div>
                  <div className="space-y-3">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-32 w-full" />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Report Display */}
            {report && !generateReportMutation.isPending && (
              <AIReport 
                report={report} 
                vehicleName={selectedVehicleData ? `${selectedVehicleData.brand} ${selectedVehicleData.model}` : 'Todos os Veículos'}
              />
            )}

            {/* Info Cards */}
            {!report && !generateReportMutation.isPending && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-l-4 border-l-blue-500">
                  <CardContent className="p-6">
                    <TrendingUp className="w-8 h-8 text-blue-500 mb-3" />
                    <h3 className="font-semibold text-slate-800 mb-1">Análise de Tendências</h3>
                    <p className="text-sm text-slate-600">
                      Identifica padrões nos seus gastos e frequência de manutenção
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-amber-500">
                  <CardContent className="p-6">
                    <AlertTriangle className="w-8 h-8 text-amber-500 mb-3" />
                    <h3 className="font-semibold text-slate-800 mb-1">Problemas Potenciais</h3>
                    <p className="text-sm text-slate-600">
                      Detecta problemas antes que se tornem graves
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500">
                  <CardContent className="p-6">
                    <DollarSign className="w-8 h-8 text-green-500 mb-3" />
                    <h3 className="font-semibold text-slate-800 mb-1">Previsão de Custos</h3>
                    <p className="text-sm text-slate-600">
                      Estima seus gastos futuros com manutenção
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-500">
                  <CardContent className="p-6">
                    <Sparkles className="w-8 h-8 text-purple-500 mb-3" />
                    <h3 className="font-semibold text-slate-800 mb-1">Recomendações IA</h3>
                    <p className="text-sm text-slate-600">
                      Sugestões personalizadas para otimizar manutenções
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}