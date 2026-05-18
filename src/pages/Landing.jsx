import React from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Car, Wrench, Bell, BarChart2, Shield, ChevronRight, CheckCircle } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    base44.auth.redirectToLogin(window.location.origin + '/Home');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 text-white">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-blue-500 flex items-center justify-center">
            <Car className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold">EnjoyCar</span>
        </div>
        <Button onClick={handleLogin} className="bg-blue-500 hover:bg-blue-600 text-white">
          Entrar
        </Button>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-20 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 rounded-full px-4 py-1.5 text-blue-300 text-sm mb-6">
          <Shield className="w-4 h-4" />
          Gerencie seus veículos com inteligência
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">
          Controle total da<br />
          <span className="text-blue-400">manutenção</span> dos<br />
          seus veículos
        </h1>
        <p className="text-slate-300 text-lg md:text-xl max-w-2xl mx-auto mb-10">
          Registre manutenções, receba alertas automáticos, analise custos com IA e nunca mais perca uma revisão importante.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={handleLogin}
            size="lg"
            className="bg-blue-500 hover:bg-blue-600 text-white text-base px-8 shadow-xl shadow-blue-500/30"
          >
            Começar gratuitamente
            <ChevronRight className="w-5 h-5 ml-1" />
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: Car,
              color: 'bg-blue-500',
              title: 'Múltiplos Veículos',
              desc: 'Gerencie toda sua frota em um só lugar, com foto, histórico e dados de compra.'
            },
            {
              icon: Wrench,
              color: 'bg-emerald-500',
              title: 'Histórico Completo',
              desc: 'Registre cada serviço com nota fiscal, peças e fotos. Extração automática por IA.'
            },
            {
              icon: Bell,
              color: 'bg-amber-500',
              title: 'Alertas Inteligentes',
              desc: 'Receba notificações por email antes de vencer revisões por km ou data.'
            },
            {
              icon: BarChart2,
              color: 'bg-purple-500',
              title: 'Relatórios com IA',
              desc: 'Dashboards de custos comparativos e análises preditivas para sua frota.'
            }
          ].map(f => (
            <div key={f.title} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors">
              <div className={`w-12 h-12 rounded-xl ${f.color} flex items-center justify-center mb-4`}>
                <f.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Benefits */}
        <div className="mt-16 bg-white/5 border border-white/10 rounded-3xl p-8 md:p-12 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-8">Tudo que você precisa</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-left max-w-3xl mx-auto">
            {[
              'Upload de nota fiscal com leitura automática',
              'Plano de manutenção baseado no manual do veículo',
              'Alertas de manutenção por email',
              'Gráficos comparativos de custo por veículo',
              'Cadastro de oficinas favoritas',
              'Dados protegidos e exclusivos por usuário',
            ].map(b => (
              <div key={b} className="flex items-start gap-2 text-sm text-slate-300">
                <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                {b}
              </div>
            ))}
          </div>
          <Button
            onClick={handleLogin}
            size="lg"
            className="mt-10 bg-blue-500 hover:bg-blue-600 text-white px-10"
          >
            Criar minha conta
          </Button>
        </div>
      </section>
    </div>
  );
}