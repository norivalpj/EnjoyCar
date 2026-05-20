import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TrendingUp, DollarSign, Wrench } from 'lucide-react';

const VEHICLE_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#06b6d4', '#f97316', '#84cc16'
];

const formatCurrency = (v) =>
  `R$ ${(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`;

const formatMonth = (m) => {
  try { return format(parseISO(m + '-01'), 'MMM/yy', { locale: ptBR }); }
  catch { return m; }
};

export default function CostDashboard({ vehicles, maintenances }) {
  const [view, setView] = useState('cost'); // 'cost' | 'frequency'

  // ── Monthly cost per vehicle ──────────────────────────────────────────────
  const { monthlyData, vehicleNames, vehicleTotals, typeDistribution } = useMemo(() => {
    const vehicleMap = {};
    vehicles.forEach(v => {
      vehicleMap[v.id] = `${v.brand} ${v.model}`;
    });

    const months = {};
    const totals = {};
    const typeCounts = {};

    maintenances.forEach(m => {
      if (!m.date) return;
      const monthKey = m.date.slice(0, 7);
      if (!months[monthKey]) months[monthKey] = {};

      const vName = vehicleMap[m.vehicle_id] || 'Desconhecido';
      months[monthKey][vName] = (months[monthKey][vName] || 0) + (m.cost || 0);
      totals[vName] = (totals[vName] || 0) + (m.cost || 0);

      // type distribution
      const type = m.type || 'other';
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });

    const sortedMonths = Object.keys(months).sort();
    const data = sortedMonths.map(month => ({ month, ...months[month] }));

    const typeLabels = {
      oil_change: 'Óleo', tire: 'Pneus', brake: 'Freios', filter: 'Filtros',
      battery: 'Bateria', alignment: 'Alinhamento', suspension: 'Suspensão',
      electrical: 'Elétrica', engine: 'Motor', transmission: 'Transmissão',
      air_conditioning: 'Ar-cond.', general_review: 'Revisão', other: 'Outros'
    };

    const typeDistribution = Object.entries(typeCounts)
      .map(([k, v]) => ({ name: typeLabels[k] || k, value: v }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    return {
      monthlyData: data,
      vehicleNames: Object.values(vehicleMap),
      vehicleTotals: totals,
      typeDistribution
    };
  }, [vehicles, maintenances]);

  // ── Monthly frequency per vehicle ────────────────────────────────────────
  const frequencyData = useMemo(() => {
    const vehicleMap = {};
    vehicles.forEach(v => { vehicleMap[v.id] = `${v.brand} ${v.model}`; });

    const months = {};
    maintenances.forEach(m => {
      if (!m.date) return;
      const monthKey = m.date.slice(0, 7);
      if (!months[monthKey]) months[monthKey] = {};
      const vName = vehicleMap[m.vehicle_id] || 'Desconhecido';
      months[monthKey][vName] = (months[monthKey][vName] || 0) + 1;
    });

    return Object.keys(months).sort().map(month => ({ month, ...months[month] }));
  }, [vehicles, maintenances]);

  const displayData = view === 'cost' ? monthlyData : frequencyData;

  if (maintenances.length === 0) return null;

  // Sort vehicles by total cost for ranking
  const rankedVehicles = vehicleNames
    .map((name, i) => ({ name, total: vehicleTotals[name] || 0, color: VEHICLE_COLORS[i % VEHICLE_COLORS.length] }))
    .sort((a, b) => b.total - a.total);

  return (
    <div className="space-y-6">
      {/* Section title */}
      <div className="flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-slate-800">Dashboard de Custos</h2>
      </div>

      {/* Vehicle ranking */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {rankedVehicles.slice(0, 3).map((v, i) => (
          <Card key={v.name} className={i === 0 ? 'border-2 border-amber-300 bg-amber-50/40' : ''}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: v.color }} />
                <span className="text-xs font-medium text-slate-500">
                  {i === 0 ? '🏆 Maior Custo' : i === 1 ? '2º Lugar' : '3º Lugar'}
                </span>
              </div>
              <p className="font-semibold text-slate-800 text-sm truncate">{v.name}</p>
              <p className="text-xl font-bold text-slate-900 mt-1">{formatCurrency(v.total)}</p>
              <p className="text-xs text-slate-500 mt-1">
                {maintenances.filter(m => {
                  const veh = vehicles.find(veh => `${veh.brand} ${veh.model}` === v.name);
                  return veh && m.vehicle_id === veh.id;
                }).length} serviços registrados
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-base">
            {view === 'cost' ? 'Custo Mensal por Veículo' : 'Frequência Mensal por Veículo'}
          </CardTitle>
          <div className="flex gap-2">
            <button
              onClick={() => setView('cost')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                view === 'cost' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Custos
            </button>
            <button
              onClick={() => setView('frequency')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                view === 'frequency' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Frequência
            </button>
          </div>
        </CardHeader>
        <CardContent>
          {displayData.length < 2 ? (
            <p className="text-center text-slate-500 text-sm py-8">
              Registre manutenções em pelo menos 2 meses para ver o gráfico comparativo
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={displayData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="month"
                  tickFormatter={formatMonth}
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  tickFormatter={view === 'cost' ? (v) => `R$${(v/1000).toFixed(0)}k` : undefined}
                />
                <Tooltip
                  formatter={(value, name) =>
                    view === 'cost' ? [formatCurrency(value), name] : [value + ' serviço(s)', name]
                  }
                  labelFormatter={formatMonth}
                  contentStyle={{ fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {vehicleNames.map((name, i) => (
                  <Bar
                    key={name}
                    dataKey={name}
                    fill={VEHICLE_COLORS[i % VEHICLE_COLORS.length]}
                    radius={[3, 3, 0, 0]}
                    maxBarSize={40}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Pie chart – type distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Wrench className="w-4 h-4 text-slate-500" />
              Tipos de Serviço
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={typeDistribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                  fontSize={11}
                >
                  {typeDistribution.map((_, i) => (
                    <Cell key={i} fill={VEHICLE_COLORS[i % VEHICLE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [v + ' vez(es)', '']} contentStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Cumulative cost line */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-slate-500" />
              Evolução do Custo Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyData.length < 2 ? (
              <p className="text-center text-slate-500 text-sm py-8">Dados insuficientes</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart
                  data={monthlyData.map(row => ({
                    month: row.month,
                    total: vehicleNames.reduce((s, n) => s + (row[n] || 0), 0)
                  }))}
                  margin={{ top: 4, right: 16, left: 0, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tickFormatter={formatMonth} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                  <Tooltip
                    formatter={(v) => [formatCurrency(v), 'Total']}
                    labelFormatter={formatMonth}
                    contentStyle={{ fontSize: 12 }}
                  />
                  <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}