import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, TrendingDown, Minus, AlertTriangle, 
  CheckCircle, Info, DollarSign, Calendar, Wrench,
  Target, Sparkles, BarChart3
} from "lucide-react";

const AIReport = ({ report, vehicleName }) => {
  if (!report) return null;

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'high': return <AlertTriangle className="w-4 h-4" />;
      case 'medium': return <Info className="w-4 h-4" />;
      case 'low': return <CheckCircle className="w-4 h-4" />;
      default: return <Info className="w-4 h-4" />;
    }
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'increasing': return <TrendingUp className="w-5 h-5 text-red-500" />;
      case 'decreasing': return <TrendingDown className="w-5 h-5 text-green-500" />;
      default: return <Minus className="w-5 h-5 text-slate-500" />;
    }
  };

  const getHealthScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-slate-800">Relatório de Análise</h2>
              </div>
              <p className="text-slate-600">{vehicleName}</p>
            </div>
            {report.vehicle_health_score && (
              <div className="text-right">
                <p className="text-sm text-slate-600 mb-1">Score de Saúde</p>
                <p className={`text-4xl font-bold ${getHealthScoreColor(report.vehicle_health_score.score)}`}>
                  {report.vehicle_health_score.score}/100
                </p>
              </div>
            )}
          </div>
          {report.vehicle_health_score?.explanation && (
            <p className="mt-4 text-sm text-slate-700 bg-white/60 p-3 rounded-lg">
              {report.vehicle_health_score.explanation}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Resumo Geral
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-600 mb-1">Total de Manutenções</p>
              <p className="text-2xl font-bold text-slate-800">{report.summary.total_maintenances}</p>
            </div>
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-600 mb-1">Gasto Total</p>
              <p className="text-2xl font-bold text-slate-800">
                R$ {report.summary.total_cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-600 mb-1">Gasto Médio</p>
              <p className="text-2xl font-bold text-slate-800">
                R$ {report.summary.average_cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-600 mb-1">Serviço Mais Comum</p>
              <p className="text-lg font-semibold text-slate-800">{report.summary.most_common_service}</p>
            </div>
          </div>
          <p className="text-sm text-slate-600 mt-4 text-center">
            Período analisado: {report.summary.period_analyzed}
          </p>
        </CardContent>
      </Card>

      {/* Cost Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Análise de Custos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div>
              <p className="text-sm text-slate-600 mb-1">Média Mensal</p>
              <p className="text-xl font-bold text-slate-800">
                R$ {report.cost_analysis.monthly_average.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {getTrendIcon(report.cost_analysis.cost_trend)}
              <span className="text-sm font-medium capitalize">{report.cost_analysis.cost_trend}</span>
            </div>
          </div>

          <div className="p-4 border border-slate-200 rounded-lg">
            <p className="text-sm font-medium text-slate-700 mb-2">Tendência de Custos</p>
            <p className="text-sm text-slate-600">{report.cost_analysis.trend_explanation}</p>
          </div>

          {report.cost_analysis.highest_expense && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm font-medium text-amber-800 mb-2">Maior Despesa</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-amber-900">{report.cost_analysis.highest_expense.type}</p>
                  <p className="text-xs text-amber-700">{report.cost_analysis.highest_expense.date}</p>
                </div>
                <p className="text-lg font-bold text-amber-900">
                  R$ {report.cost_analysis.highest_expense.cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Maintenance Patterns */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="w-5 h-5" />
            Padrões de Manutenção
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-slate-50 rounded-lg">
            <p className="text-sm text-slate-600 mb-2">Frequência</p>
            <p className="text-slate-800">{report.maintenance_patterns.frequency}</p>
          </div>

          {report.maintenance_patterns.most_frequent_services?.length > 0 && (
            <div>
              <p className="text-sm font-medium text-slate-700 mb-3">Serviços Mais Frequentes</p>
              <div className="space-y-2">
                {report.maintenance_patterns.most_frequent_services.map((service, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <span className="text-slate-800">{service.type}</span>
                    <Badge variant="secondary">{service.count}x</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {report.maintenance_patterns.seasonal_patterns && (
            <div className="p-4 border border-slate-200 rounded-lg">
              <p className="text-sm font-medium text-slate-700 mb-2">Padrões Sazonais</p>
              <p className="text-sm text-slate-600">{report.maintenance_patterns.seasonal_patterns}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Potential Issues */}
      {report.potential_issues?.length > 0 && (
        <Card className="border-l-4 border-l-amber-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              Problemas Potenciais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {report.potential_issues.map((issue, index) => (
              <div key={index} className={`p-4 border rounded-lg ${getSeverityColor(issue.severity)}`}>
                <div className="flex items-start gap-3">
                  {getSeverityIcon(issue.severity)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="font-semibold">{issue.issue}</p>
                      <Badge variant="outline" className="text-xs">
                        {issue.severity === 'high' ? 'Alta' : issue.severity === 'medium' ? 'Média' : 'Baixa'}
                      </Badge>
                    </div>
                    <p className="text-sm mb-2">{issue.explanation}</p>
                    <p className="text-sm font-medium">💡 Recomendação: {issue.recommendation}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Predictive Analysis */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Análise Preditiva
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700 mb-1">Previsão de Custo (Próximos 6 meses)</p>
            <p className="text-2xl font-bold text-blue-900">
              R$ {report.predictive_analysis.next_6_months_cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>

          {report.predictive_analysis.upcoming_services?.length > 0 && (
            <div>
              <p className="text-sm font-medium text-slate-700 mb-3">Serviços Recomendados</p>
              <div className="space-y-2">
                {report.predictive_analysis.upcoming_services.map((service, index) => (
                  <div key={index} className="p-3 border border-slate-200 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <p className="font-semibold text-slate-800">{service.service}</p>
                      <Badge className={
                        service.priority === 'high' ? 'bg-red-100 text-red-800' :
                        service.priority === 'medium' ? 'bg-amber-100 text-amber-800' :
                        'bg-blue-100 text-blue-800'
                      }>
                        {service.priority === 'high' ? 'Alta' : service.priority === 'medium' ? 'Média' : 'Baixa'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">{service.timeframe}</span>
                      <span className="font-medium text-slate-800">
                        ~R$ {service.estimated_cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {report.predictive_analysis.cost_saving_tips?.length > 0 && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm font-medium text-green-800 mb-3">💰 Dicas para Economia</p>
              <ul className="space-y-2">
                {report.predictive_analysis.cost_saving_tips.map((tip, index) => (
                  <li key={index} className="text-sm text-green-700 flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recommendations */}
      {report.recommendations?.length > 0 && (
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-600" />
              Recomendações Personalizadas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {report.recommendations.map((rec, index) => (
              <div key={index} className="p-4 border border-slate-200 rounded-lg hover:border-purple-300 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <p className="font-semibold text-slate-800">{rec.title}</p>
                  <Badge variant="outline" className={
                    rec.priority === 'high' ? 'border-red-300 text-red-700' :
                    rec.priority === 'medium' ? 'border-amber-300 text-amber-700' :
                    'border-blue-300 text-blue-700'
                  }>
                    {rec.priority === 'high' ? 'Alta' : rec.priority === 'medium' ? 'Média' : 'Baixa'}
                  </Badge>
                </div>
                <p className="text-sm text-slate-600">{rec.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AIReport;