import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, Wrench, ArrowRight, Car, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ScheduleWorkshopDialog from './ScheduleWorkshopDialog';

const MaintenanceNotifications = () => {
  const [scheduleDialog, setScheduleDialog] = useState({ open: false, vehicle: null, plan: null });

  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => base44.entities.Vehicle.list()
  });

  const { data: allPlans = [] } = useQuery({
    queryKey: ['maintenance-plans'],
    queryFn: () => base44.entities.MaintenancePlan.list()
  });

  // Get notifications for each vehicle
  const notifications = vehicles.flatMap(vehicle => {
    const vehiclePlans = allPlans.filter(p => 
      p.vehicle_id === vehicle.id && !p.is_completed
    );

    return vehiclePlans
      .map(plan => {
        if (!vehicle.current_mileage || !plan.recommended_mileage) return null;

        const kmDifference = plan.recommended_mileage - vehicle.current_mileage;
        
        if (kmDifference <= 0) {
          // Overdue
          return {
            type: 'overdue',
            severity: 'high',
            vehicle,
            plan,
            kmOverdue: Math.abs(kmDifference),
            message: `Manutenção atrasada em ${Math.abs(kmDifference).toLocaleString('pt-BR')} km`
          };
        } else if (kmDifference <= 1000) {
          // Very soon
          return {
            type: 'urgent',
            severity: 'medium',
            vehicle,
            plan,
            kmRemaining: kmDifference,
            message: `Apenas ${kmDifference.toLocaleString('pt-BR')} km restantes`
          };
        } else if (kmDifference <= 2000) {
          // Soon
          return {
            type: 'upcoming',
            severity: 'low',
            vehicle,
            plan,
            kmRemaining: kmDifference,
            message: `Faltam ${kmDifference.toLocaleString('pt-BR')} km`
          };
        }
        
        return null;
      })
      .filter(Boolean);
  });

  // Sort by severity
  const sortedNotifications = notifications.sort((a, b) => {
    const severityOrder = { high: 0, medium: 1, low: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });

  if (sortedNotifications.length === 0) return null;

  const getNotificationStyle = (severity) => {
    switch (severity) {
      case 'high':
        return {
          border: 'border-red-300',
          bg: 'bg-red-50',
          icon: <AlertTriangle className="w-5 h-5 text-red-600" />,
          badge: 'bg-red-100 text-red-800 border-red-300'
        };
      case 'medium':
        return {
          border: 'border-amber-300',
          bg: 'bg-amber-50',
          icon: <Clock className="w-5 h-5 text-amber-600" />,
          badge: 'bg-amber-100 text-amber-800 border-amber-300'
        };
      default:
        return {
          border: 'border-blue-300',
          bg: 'bg-blue-50',
          icon: <Wrench className="w-5 h-5 text-blue-600" />,
          badge: 'bg-blue-100 text-blue-800 border-blue-300'
        };
    }
  };

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          Alertas de Manutenção
        </h2>
        <Badge variant="secondary" className="font-mono">
          {sortedNotifications.length}
        </Badge>
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {sortedNotifications.map((notification, index) => {
            const style = getNotificationStyle(notification.severity);
            
            return (
              <motion.div
                key={`${notification.vehicle.id}-${notification.plan.id}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`${style.border} ${style.bg} border-l-4 hover:shadow-md transition-shadow`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="mt-0.5">
                        {style.icon}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Car className="w-4 h-4 text-slate-600" />
                              <p className="font-semibold text-slate-800">
                                {notification.vehicle.brand} {notification.vehicle.model}
                              </p>
                            </div>
                            <p className="text-sm text-slate-700 font-medium">
                              {notification.plan.maintenance_type}
                            </p>
                          </div>
                          <Badge className={style.badge}>
                            {notification.type === 'overdue' ? 'Atrasada' : 
                             notification.type === 'urgent' ? 'Urgente' : 'Próxima'}
                          </Badge>
                        </div>

                        <p className="text-sm text-slate-600 mb-3">
                          {notification.message}
                        </p>

                        {notification.plan.description && (
                          <p className="text-xs text-slate-500 mb-3 line-clamp-2">
                            {notification.plan.description}
                          </p>
                        )}

                        <div className="flex items-center gap-2 flex-wrap">
                          <Button 
                            size="sm"
                            variant="outline"
                            className="border-green-600 text-green-600 hover:bg-green-50"
                            onClick={() => setScheduleDialog({ 
                              open: true, 
                              vehicle: notification.vehicle, 
                              plan: notification.plan 
                            })}
                          >
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Agendar Oficina
                          </Button>

                          <Link 
                            to={createPageUrl('NewMaintenance') + 
                                `?vehicle_id=${notification.vehicle.id}&plan_id=${notification.plan.id}`}
                          >
                            <Button 
                              size="sm" 
                              className={
                                notification.severity === 'high' 
                                  ? 'bg-red-600 hover:bg-red-700' 
                                  : notification.severity === 'medium'
                                  ? 'bg-amber-600 hover:bg-amber-700'
                                  : 'bg-blue-600 hover:bg-blue-700'
                              }
                            >
                              Registrar
                              <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                          </Link>

                          <Link 
                            to={createPageUrl('MaintenancePlan') + `?id=${notification.vehicle.id}`}
                          >
                            <Button size="sm" variant="ghost">
                              Ver Plano
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Schedule Dialog */}
      <ScheduleWorkshopDialog 
        open={scheduleDialog.open}
        onClose={() => setScheduleDialog({ open: false, vehicle: null, plan: null })}
        vehicle={scheduleDialog.vehicle}
        plan={scheduleDialog.plan}
      />
    </div>
  );
};

export default MaintenanceNotifications;