import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { CalendarClock, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format, addMonths, isAfter, isBefore, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4'];

export default function UpcomingTimeline() {
  const { data: vehicles = [], isLoading: isLoadingVehicles } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => base44.entities.Vehicle.list()
  });

  const { data: plans = [], isLoading: isLoadingPlans } = useQuery({
    queryKey: ['maintenancePlans'],
    queryFn: () => base44.entities.MaintenancePlan.list()
  });

  const { data: maintenances = [], isLoading: isLoadingMaintenances } = useQuery({
    queryKey: ['maintenances'],
    queryFn: () => base44.entities.Maintenance.list()
  });

  const isLoading = isLoadingVehicles || isLoadingPlans || isLoadingMaintenances;

  const chartData = useMemo(() => {
    if (!vehicles.length) return [];

    const now = new Date();
    const months = [];
    
    // Create an array of next 6 months
    for (let i = 0; i < 6; i++) {
      const monthDate = addMonths(now, i);
      months.push({
        date: startOfMonth(monthDate),
        end: endOfMonth(monthDate),
        name: format(monthDate, 'MMM/yy', { locale: ptBR }),
        originalDate: monthDate
      });
    }

    // Initialize data array with months
    const data = months.map(m => {
      const entry = { name: m.name.charAt(0).toUpperCase() + m.name.slice(1) };
      vehicles.forEach(v => {
        entry[v.id] = 0;
        entry[`${v.id}_tasks`] = [];
      });
      return { ...entry, _monthData: m };
    });

    // Populate data from plans
    plans.filter(p => !p.completed).forEach(plan => {
      if (plan.due_date) {
        try {
          const planDate = new Date(plan.due_date);
          const monthIndex = months.findIndex(m => 
            (isAfter(planDate, m.date) || planDate.getTime() === m.date.getTime()) && 
            (isBefore(planDate, m.end) || planDate.getTime() === m.end.getTime())
          );
          if (monthIndex !== -1 && vehicles.find(v => v.id === plan.vehicle_id)) {
            data[monthIndex][plan.vehicle_id] += 1;
            data[monthIndex][`${plan.vehicle_id}_tasks`].push(plan.service_name || 'Manutenção Programada');
          }
        } catch {
          // ignore parsing error
        }
      }
    });

    // Populate from maintenances (next_maintenance_date)
    maintenances.forEach(m => {
      if (m.next_maintenance_date) {
        try {
          const nextDate = new Date(m.next_maintenance_date);
          const monthIndex = months.findIndex(mo => 
            (isAfter(nextDate, mo.date) || nextDate.getTime() === mo.date.getTime()) && 
            (isBefore(nextDate, mo.end) || nextDate.getTime() === mo.end.getTime())
          );
          if (monthIndex !== -1 && vehicles.find(v => v.id === m.vehicle_id)) {
            data[monthIndex][m.vehicle_id] += 1;
            data[monthIndex][`${m.vehicle_id}_tasks`].push(`Retorno: ${m.type || 'Serviço'}`);
          }
        } catch {
          // ignore parsing error
        }
      }
    });

    return data;
  }, [vehicles, plans, maintenances]);

  if (isLoading) {
    return (
      <Card className="mb-8">
        <CardContent className="p-8 flex justify-center items-center h-[350px]">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </CardContent>
      </Card>
    );
  }

  if (vehicles.length === 0) {
    return null; // hide if no vehicles
  }

  // Check if we have any upcoming tasks in the window
  const totalTasks = chartData.reduce((acc, curr) => {
    const tasks = vehicles.reduce((sum, v) => sum + (curr[v.id] || 0), 0);
    return acc + tasks;
  }, 0);

  if (totalTasks === 0) {
     return null; // or show an empty state
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-slate-200 shadow-md rounded-lg max-w-[250px]">
          <p className="font-semibold text-slate-800 mb-2">{label}</p>
          {payload.map((entry, index) => {
            if (entry.value > 0) {
              const vName = vehicles.find(v => v.id === entry.dataKey)?.model || 'Veículo';
              const _monthData = entry.payload._monthData;
              const tasks = entry.payload[`${entry.dataKey}_tasks`] || [];
              
              return (
                <div key={index} className="mb-2">
                  <p className="text-sm font-medium" style={{ color: entry.color }}>
                    {vName}: {entry.value} tarefa(s)
                  </p>
                  <ul className="list-disc pl-4 text-xs text-slate-500 mt-1">
                    {tasks.map((t, idx) => (
                      <li key={idx} className="truncate">{t}</li>
                    ))}
                  </ul>
                </div>
              );
            }
            return null;
          })}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="mb-8 border-slate-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2 text-slate-800">
          <CalendarClock className="w-5 h-5 text-blue-500" />
          Previsão de Serviços (Próximos 6 meses)
        </CardTitle>
        <CardDescription>
          Tarefas agendadas e retornos previstos por veículo.
        </CardDescription>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 10, left: -20, bottom: 5 }}>
            <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis allowDecimals={false} fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
            <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} formatter={(value) => {
              const v = vehicles.find(vec => vec.id === value);
              return v ? `${v.brand} ${v.model}` : value;
            }} />
            {vehicles.map((v, index) => (
              <Bar 
                key={v.id} 
                dataKey={v.id} 
                stackId="a" 
                fill={COLORS[index % COLORS.length]} 
                radius={[0, 0, 0, 0]}
                barSize={30}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
