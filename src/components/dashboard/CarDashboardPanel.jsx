import React from 'react';
import { useTranslation } from 'react-i18next';
import { DollarSign, Settings, Plus, Car, Wrench, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const Gauge = ({ label, value, max, unit, title, color = "text-blue-500", strokeColor = "stroke-blue-500" }) => {
  const [currentValue, setCurrentValue] = React.useState(0);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentValue(value);
    }, 100);
    return () => clearTimeout(timer);
  }, [value]);

  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  // semi-circle
  const percentage = Math.min((currentValue / max) * 100, 100);
  const strokeDashoffset = (circumference / 2) - ((percentage / 100) * (circumference / 2));

  return (
    <div className="flex flex-col items-center relative">
      <div className="relative w-32 h-20 overflow-hidden flex justify-center">
        {/* Background track */}
        <svg className="w-full h-full absolute top-0" viewBox="0 0 100 50">
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-slate-800"
            strokeLinecap="round"
          />
          {/* Progress fill */}
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className={`${strokeColor} transition-all duration-1000 ease-out`}
            strokeDasharray={251.2} /* Circumference of r=40 is ~251.2, semicircle is 125.6 */
            strokeDashoffset={251.2 - (percentage / 100) * 125.6}
            strokeLinecap="round"
            style={{ strokeDasharray: '125.6 251.2' }}
          />
        </svg>
        <div className="absolute bottom-1 text-center w-full">
          <span className="text-2xl font-bold text-white tabular-nums drop-shadow-[0_0_8px_rgba(255,255,255,0.4)] block w-full text-center">
            {currentValue}
          </span>
        </div>
      </div>
      <div className="text-center mt-1">
        <p className="text-xs font-bold text-slate-400 tracking-wider uppercase mb-0.5">{title}</p>
        <p className="text-[10px] text-slate-500 font-mono">{label} {unit && <span className="opacity-50">{unit}</span>}</p>
      </div>
    </div>
  );
};

const Odometer = ({ value, label }) => {
  const [currentValue, setCurrentValue] = React.useState(0);

  React.useEffect(() => {
    if (value === 0) return;
    let start = 0;
    const duration = 1000;
    const interval = 20;
    const increment = value / (duration / interval);
    const timer = setInterval(() => {
      start += increment;
      if (start >= value) {
        start = value;
        clearInterval(timer);
      }
      setCurrentValue(start);
    }, interval);
    return () => clearInterval(timer);
  }, [value]);

  const digits = Math.floor(currentValue).toString().padStart(6, '0').split('');
  return (
    <div className="flex flex-col items-center justify-center p-3">
      <div className="flex bg-slate-900 border-2 border-slate-700 p-1 rounded shadow-inner mb-2 bg-gradient-to-b from-slate-950 to-slate-800">
        {digits.map((d, i) => (
          <div key={i} className={`
            w-6 h-8 flex items-center justify-center text-lg font-mono font-bold
            bg-slate-100 text-slate-900 border-r border-slate-300 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]
            ${i === digits.length - 1 ? 'bg-red-100 text-red-900 border-r-0' : ''}
          `}>
            {d}
          </div>
        ))}
      </div>
      <p className="text-xs font-bold text-slate-400 tracking-wider uppercase">{label}</p>
    </div>
  );
};

export default function CarDashboardPanel({ vehiclesCount, maintenancesCount, thisMonthCost, totalCost }) {
  const { t } = useTranslation();

  return (
    <div className="w-full bg-slate-950 rounded-3xl p-6 md:p-8 shadow-2xl mb-8 border border-slate-800 relative overflow-hidden group">
      {/* Glossy reflection effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent pointer-events-none" />
      <div className="absolute -top-[50%] -left-[10%] w-[120%] h-full bg-gradient-to-b from-white/[0.05] to-transparent transform -skew-y-12 pointer-events-none" />

      {/* Decorative dashboard lights */}
      <div className="absolute top-4 right-6 flex gap-3">
        <div className={`w-2 h-2 rounded-full ${vehiclesCount > 0 ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-red-500 shadow-[0_0_8px_#ef4444]'}`} />
        <div className={`w-2 h-2 rounded-full ${maintenancesCount > 0 ? 'bg-blue-500 shadow-[0_0_8px_#3b82f6]' : 'bg-slate-700'}`} />
        <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_#f59e0b] animate-pulse" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end justify-items-center">
        {/* Left Gauge: Vehicles (RPM style) */}
        <div className="w-full flex justify-center md:justify-end pr-0 md:pr-4">
          <Gauge 
            title={t('home.vehicles')}
            label="GARAGEM" 
            value={vehiclesCount} 
            max={8} 
            unit="x1000"
            strokeColor="stroke-red-500"
          />
        </div>

        {/* Center: Odometer */}
        <div className="w-full flex justify-center z-10 border-x border-slate-800/50 px-4">
          <Odometer value={totalCost} label={t('home.total_spent')} />
        </div>

        {/* Right Gauge: Maintenances (Speedometer style) */}
        <div className="w-full flex justify-center md:justify-start pl-0 md:pl-4">
          <Gauge 
            title={t('home.maintenances')}
            label="SERVIÇOS" 
            value={maintenancesCount} 
            max={50} // Arbitrary max
            unit="km/h"
            strokeColor="stroke-cyan-500"
          />
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-slate-800/50 flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-full border border-slate-800">
            <DollarSign className="w-3.5 h-3.5 text-amber-500" />
            <span className="font-mono text-slate-500 text-xs">{t('home.this_month')}: R$ {thisMonthCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-full border border-slate-800 hidden md:flex">
            <Settings className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-mono text-slate-500 text-xs">SISTEMA OK</span>
          </div>
        </div>
        
        <div className="flex flex-wrap justify-center gap-4">
          <Link to={createPageUrl('NewMaintenance')} className="group flex flex-col items-center gap-2">
            <div className="w-14 h-14 rounded-full bg-slate-900 border-2 border-slate-700 shadow-[inset_0_-2px_6px_rgba(0,0,0,0.6),0_4px_8px_rgba(0,0,0,0.8)] flex items-center justify-center group-hover:bg-slate-800 group-hover:border-blue-500/50 transition-all group-active:shadow-[inset_0_2px_6px_rgba(0,0,0,0.6)] group-active:translate-y-0.5">
              <Plus className="w-6 h-6 text-blue-500 drop-shadow-[0_0_4px_rgba(59,130,246,0.6)]" />
            </div>
            <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">{t('home.new_maintenance')}</span>
          </Link>

          <Link to={createPageUrl('Vehicles')} className="group flex flex-col items-center gap-2">
            <div className="w-14 h-14 rounded-full bg-slate-900 border-2 border-slate-700 shadow-[inset_0_-2px_6px_rgba(0,0,0,0.6),0_4px_8px_rgba(0,0,0,0.8)] flex items-center justify-center group-hover:bg-slate-800 group-hover:border-slate-500/50 transition-all group-active:shadow-[inset_0_2px_6px_rgba(0,0,0,0.6)] group-active:translate-y-0.5">
              <Car className="w-6 h-6 text-slate-300 drop-shadow-[0_0_4px_rgba(203,213,225,0.4)]" />
            </div>
            <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">{t('home.my_vehicles')}</span>
          </Link>

          <Link to={createPageUrl('History')} className="group flex flex-col items-center gap-2">
            <div className="w-14 h-14 rounded-full bg-slate-900 border-2 border-slate-700 shadow-[inset_0_-2px_6px_rgba(0,0,0,0.6),0_4px_8px_rgba(0,0,0,0.8)] flex items-center justify-center group-hover:bg-slate-800 group-hover:border-slate-500/50 transition-all group-active:shadow-[inset_0_2px_6px_rgba(0,0,0,0.6)] group-active:translate-y-0.5">
              <Wrench className="w-6 h-6 text-slate-300 drop-shadow-[0_0_4px_rgba(203,213,225,0.4)]" />
            </div>
            <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">{t('home.history')}</span>
          </Link>

          <Link to={createPageUrl('Reports')} className="group flex flex-col items-center gap-2">
            <div className="w-14 h-14 rounded-full bg-slate-900 border-2 border-slate-700 shadow-[inset_0_-2px_6px_rgba(0,0,0,0.6),0_4px_8px_rgba(0,0,0,0.8)] flex items-center justify-center group-hover:bg-slate-800 group-hover:border-purple-500/50 transition-all group-active:shadow-[inset_0_2px_6px_rgba(0,0,0,0.6)] group-active:translate-y-0.5">
              <FileText className="w-6 h-6 text-purple-400 drop-shadow-[0_0_4px_rgba(192,132,252,0.6)]" />
            </div>
            <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">{t('home.ai_reports')}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
