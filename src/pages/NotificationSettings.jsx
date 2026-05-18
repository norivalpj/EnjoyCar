import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Bell, BellOff, Mail, Gauge, Calendar, CheckCircle } from "lucide-react";

export default function NotificationSettings() {
  const { data: user, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  const [form, setForm] = useState({
    notifications_enabled: true,
    notify_days_before: 30,
    notify_km_before: 500,
  });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        notifications_enabled: user.notifications_enabled ?? true,
        notify_days_before: user.notify_days_before ?? 30,
        notify_km_before: user.notify_km_before ?? 500,
      });
    }
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    await base44.auth.updateMe({
      notifications_enabled: form.notifications_enabled,
      notify_days_before: Number(form.notify_days_before),
      notify_km_before: Number(form.notify_km_before),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to={createPageUrl('Home')}>
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Notificações</h1>
            <p className="text-slate-500 text-sm mt-0.5">Configure alertas por email</p>
          </div>
        </div>

        {/* Enable/Disable */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {form.notifications_enabled
                  ? <Bell className="w-6 h-6 text-blue-600" />
                  : <BellOff className="w-6 h-6 text-slate-400" />}
                <div>
                  <p className="font-semibold text-slate-800">Notificações por email</p>
                  <p className="text-sm text-slate-500">Receber alertas no email cadastrado</p>
                </div>
              </div>
              <Switch
                checked={form.notifications_enabled}
                onCheckedChange={(v) => setForm(f => ({ ...f, notifications_enabled: v }))}
              />
            </div>
          </CardContent>
        </Card>

        {form.notifications_enabled && (
          <>
            {/* Maintenance Alerts */}
            <Card className="mb-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Gauge className="w-5 h-5 text-amber-600" />
                  Alerta de Manutenção Próxima
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <Label className="text-sm font-medium text-slate-700 mb-2 block">
                    Avisar quando faltar (km)
                  </Label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      min={100}
                      max={5000}
                      value={form.notify_km_before}
                      onChange={(e) => setForm(f => ({ ...f, notify_km_before: e.target.value }))}
                      className="w-32"
                    />
                    <span className="text-slate-500 text-sm">km para o próximo serviço</span>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-slate-700 mb-2 block">
                    Avisar com antecedência (dias)
                  </Label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      min={7}
                      max={90}
                      value={form.notify_days_before}
                      onChange={(e) => setForm(f => ({ ...f, notify_days_before: e.target.value }))}
                      className="w-32"
                    />
                    <span className="text-slate-500 text-sm">dias antes da data prevista</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Mileage Reminder */}
            <Card className="mb-6 border-blue-200 bg-blue-50/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  Lembrete Mensal de Quilometragem
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600">
                  A cada <strong>28 dias</strong>, você receberá um email lembrando de atualizar a quilometragem
                  dos seus veículos, mantendo os alertas de manutenção precisos.
                </p>
              </CardContent>
            </Card>

            {/* How it works */}
            <Card className="mb-6 bg-slate-50">
              <CardContent className="p-5">
                <p className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                  <Mail className="w-4 h-4" /> Como funciona
                </p>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li>• Os alertas são verificados sempre que você abre o app</li>
                  <li>• O email é enviado para: <strong>{user?.email}</strong></li>
                  <li>• Alertas de manutenção: no máximo 1 email por dia</li>
                  <li>• Lembrete de quilometragem: a cada 28 dias</li>
                </ul>
              </CardContent>
            </Card>
          </>
        )}

        {/* Save */}
        <Button
          onClick={handleSave}
          disabled={saving || saved}
          className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-base"
        >
          {saved ? (
            <><CheckCircle className="w-5 h-5 mr-2" /> Configurações salvas!</>
          ) : saving ? (
            'Salvando...'
          ) : (
            'Salvar Configurações'
          )}
        </Button>
      </div>
    </div>
  );
}