import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Car, Plus, Wrench, DollarSign, Calendar, ChevronRight, Bell, FileText, Phone, Star, MapPin
} from "lucide-react";
import { isAfter, addDays } from "date-fns";
import { useTranslation } from 'react-i18next';

import CarDashboardPanel from '../components/dashboard/CarDashboardPanel';
import UpcomingTimeline from '../components/dashboard/UpcomingTimeline';
import VehicleCard from '../components/vehicles/VehicleCard';
import MaintenanceCard from '../components/maintenance/MaintenanceCard';
import GuidedTour from '../components/onboarding/GuidedTour';
import MaintenanceNotifications from '../components/notifications/MaintenanceNotifications';
import NotificationService from '../components/notifications/NotificationService';
import { AnimatePresence } from 'framer-motion';

export default function Home() {
  const { t } = useTranslation();
  const [showTour, setShowTour] = useState(false);
  const { data: vehicles = [], isLoading: loadingVehicles } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => base44.entities.Vehicle.list('-created_date')
  });

  const { data: workshops = [] } = useQuery({
    queryKey: ['workshops'],
    queryFn: () => base44.entities.Workshop.list('-created_date')
  });

  const { data: maintenances = [], isLoading: loadingMaintenances } = useQuery({
    queryKey: ['maintenances'],
    queryFn: () => base44.entities.Maintenance.list('-date')
  });

  // Calculate statistics
  const totalCost = maintenances.reduce((sum, m) => sum + (m.cost || 0), 0);
  const thisMonthMaintenances = maintenances.filter(m => {
    const date = new Date(m.date);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  });
  const thisMonthCost = thisMonthMaintenances.reduce((sum, m) => sum + (m.cost || 0), 0);

  // Upcoming maintenances
  const upcomingMaintenances = maintenances.filter(m => {
    if (!m.next_maintenance_date) return false;
    const nextDate = new Date(m.next_maintenance_date);
    return isAfter(nextDate, new Date()) && isAfter(addDays(new Date(), 60), nextDate);
  });

  // Get vehicle name helper
  const getVehicleName = (vehicleId) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle ? `${vehicle.brand} ${vehicle.model}` : '';
  };

  const isLoading = loadingVehicles || loadingMaintenances;

  // Check if user should see the tour
  useEffect(() => {
    const checkTourStatus = async () => {
      try {
        const user = await base44.auth.me();
        if (!user.tour_completed && vehicles.length === 0 && maintenances.length === 0) {
          setShowTour(true);
        }
      } catch (error) {
        // User not logged in or error occurred
      }
    };

    if (!loadingVehicles && !loadingMaintenances) {
      checkTourStatus();
    }
  }, [loadingVehicles, loadingMaintenances, vehicles.length, maintenances.length]);

  const tourSteps = [
    {
      title: 'Bem-vindo! 👋',
      description: 'Este é seu painel de controle de manutenção automotiva. Vamos fazer um tour rápido pelas principais funcionalidades.',
      icon: '🚗',
      selector: '[data-tour="header"]',
      tip: 'Este tour leva apenas 1 minuto!'
    },
    {
      title: 'Adicionar Veículo',
      description: 'Comece adicionando seus veículos aqui. Você pode incluir fotos, dados da compra e até mesmo o manual do proprietário.',
      icon: '🚙',
      selector: '[data-tour="add-vehicle"]',
      tip: 'O upload do manual permite criar um plano de manutenção automático!'
    },
    {
      title: 'Registrar Manutenção',
      description: 'Registre suas manutenções facilmente. Tire uma foto da nota fiscal e a IA extrai os dados automaticamente!',
      icon: '🔧',
      selector: '[data-tour="add-maintenance"]',
      tip: 'Quanto mais você registra, melhores são as análises da IA'
    },
    {
      title: 'Histórico Completo',
      description: 'Acesse todo o histórico de manutenções com filtros avançados por tipo, data e custo.',
      icon: '📋',
      selector: '[data-tour="history"]',
      tip: 'Use os filtros para encontrar manutenções específicas rapidamente'
    },
    {
      title: 'Relatórios com IA',
      description: 'Gere relatórios inteligentes que analisam seus gastos, identificam problemas e preveem custos futuros.',
      icon: '🤖',
      selector: '[data-tour="reports"]',
      tip: 'A IA aprende com seu histórico para dar recomendações personalizadas'
    },
    {
      title: 'Pronto para começar! 🎉',
      description: 'Agora você conhece os principais recursos. Comece adicionando seu primeiro veículo!',
      icon: '✨',
      selector: '[data-tour="add-vehicle"]',
      tip: 'Você pode ver este tour novamente nas configurações'
    }
  ];

  const handleTourComplete = async () => {
    setShowTour(false);
    try {
      await base44.auth.updateMe({ tour_completed: true });
    } catch (error) {
      console.error('Failed to update tour status:', error);
    }
  };

  const handleTourSkip = async () => {
    setShowTour(false);
    try {
      await base44.auth.updateMe({ tour_completed: true });
    } catch (error) {
      console.error('Failed to update tour status:', error);
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-50 via-white to-blue-50 flex-1 h-full">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8" data-tour="header">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
              {t('home.title')}
            </h1>
            <p className="text-slate-500 mt-1">
              {t('app.description')}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Link to={createPageUrl('NotificationSettings')}>
              <Button variant="ghost" size="icon" className="rounded-full text-slate-500 hover:text-blue-600" title="Configurar Notificações">
                <Bell className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Car Dashboard Panel */}
        {isLoading ? (
          <Skeleton className="h-64 w-full rounded-3xl mb-8" />
        ) : (
          <CarDashboardPanel 
            vehiclesCount={vehicles.length}
            maintenancesCount={maintenances.length}
            thisMonthCost={thisMonthCost}
            totalCost={totalCost}
          />
        )}

        {/* Upcoming Timeline Graph */}
        <UpcomingTimeline />

        {/* Maintenance Notifications */}
        <MaintenanceNotifications />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Vehicles */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <CardTitle className="text-lg font-semibold">{t('home.my_vehicles')}</CardTitle>
                <Link to={createPageUrl('Vehicles')}>
                  <Button variant="ghost" size="sm">
                    {t('home.see_all')} <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                {loadingVehicles ? (
                  Array(2).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full rounded-lg" />
                  ))
                ) : vehicles.length === 0 ? (
                  <div className="text-center py-8">
                    <Car className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 text-sm">{t('home.no_vehicles')}</p>
                    <Link to={createPageUrl('Vehicles')}>
                      <Button variant="link" size="sm" className="mt-2">
                        {t('home.add_vehicle')}
                      </Button>
                    </Link>
                  </div>
                ) : (
                  vehicles.slice(0, 3).map(vehicle => (
                    <Link key={vehicle.id} to={createPageUrl('VehicleDetail') + `?id=${vehicle.id}`}>
                      <VehicleCard vehicle={vehicle} onClick={() => {}} />
                    </Link>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Maintenances */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <CardTitle className="text-lg font-semibold">{t('home.recent_maintenances')}</CardTitle>
                <Link to={createPageUrl('History')}>
                  <Button variant="ghost" size="sm">
                    {t('home.see_history')} <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                {loadingMaintenances ? (
                  Array(4).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full rounded-lg" />
                  ))
                ) : maintenances.length === 0 ? (
                  <div className="text-center py-12">
                    <Wrench className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 text-sm">{t('home.no_maintenance')}</p>
                    <Link to={createPageUrl('NewMaintenance')}>
                      <Button variant="link" size="sm" className="mt-2">
                        {t('home.add_maintenance')}
                      </Button>
                    </Link>
                  </div>
                ) : (
                  maintenances.slice(0, 5).map(maintenance => (
                    <Link key={maintenance.id} to={createPageUrl('MaintenanceDetail') + `?id=${maintenance.id}`}>
                      <MaintenanceCard 
                        maintenance={maintenance} 
                        vehicleName={getVehicleName(maintenance.vehicle_id)}
                        onClick={() => {}}
                      />
                    </Link>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Workshops Section */}
        <div className="mt-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Wrench className="w-5 h-5 text-slate-500" />
                {t('home.workshops')}
              </CardTitle>
              <Link to={createPageUrl('Workshops')}>
                <Button variant="ghost" size="sm">
                  {t('home.see_all')} <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="pt-0">
              {workshops.length === 0 ? (
                <div className="flex flex-col sm:flex-row items-center gap-4 py-4 px-2 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <Wrench className="w-6 h-6 text-slate-400" />
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <p className="font-medium text-slate-700">Cadastre suas oficinas de confiança</p>
                    <p className="text-sm text-slate-500">Guarde telefone, endereço e especialidades para acesso rápido.</p>
                  </div>
                  <Link to={createPageUrl('Workshops')}>
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700 whitespace-nowrap">
                      <Plus className="w-4 h-4 mr-1" /> Adicionar
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {workshops.slice(0, 3).map(w => (
                    <Link key={w.id} to={createPageUrl('Workshops')}>
                      <div className={`rounded-xl p-4 border flex items-start gap-3 hover:shadow-md transition-shadow cursor-pointer ${w.is_favorite ? 'border-yellow-200 bg-yellow-50/40' : 'border-slate-100 bg-white'}`}>
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                          <Wrench className="w-5 h-5 text-slate-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <p className="font-semibold text-slate-800 truncate text-sm">{w.name}</p>
                            {w.is_favorite && <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500 flex-shrink-0" />}
                          </div>
                          {w.phone && (
                            <a href={`tel:${w.phone}`} onClick={e => e.stopPropagation()} className="flex items-center gap-1 text-xs text-blue-600 hover:underline mt-0.5">
                              <Phone className="w-3 h-3" /> {w.phone}
                            </a>
                          )}
                          {w.address && (
                            <p className="flex items-center gap-1 text-xs text-slate-400 mt-0.5 truncate">
                              <MapPin className="w-3 h-3 flex-shrink-0" /> {w.address}
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                  <Link to={createPageUrl('Workshops')}>
                    <div className="rounded-xl p-4 border border-dashed border-blue-200 bg-blue-50/30 flex items-center justify-center gap-2 hover:bg-blue-50 transition-colors cursor-pointer h-full min-h-[80px]">
                      <Plus className="w-5 h-5 text-blue-500" />
                      <span className="text-sm font-medium text-blue-600">Nova oficina</span>
                    </div>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Background notification service */}
      <NotificationService />

      {/* Guided Tour */}
      <AnimatePresence>
        {showTour && (
          <GuidedTour
            steps={tourSteps}
            onComplete={handleTourComplete}
            onSkip={handleTourSkip}
          />
        )}
      </AnimatePresence>
    </div>
  );
}