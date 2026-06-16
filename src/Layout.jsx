import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Home, Car, History, Plus, Wrench } from 'lucide-react';
import { motion } from 'framer-motion';
import UserMenu from '@/components/layout/UserMenu';
import { useTranslation } from 'react-i18next';

export default function Layout({ children }) {
  const location = useLocation();
  const { t } = useTranslation();

  const isActive = (pageName) => {
    return location.pathname.includes(pageName);
  };

  const navItemsLeft = [
    { name: 'Home', icon: Home, label: t('nav.home') },
    { name: 'Vehicles', icon: Car, label: t('nav.vehicles') },
  ];

  const navItemsRight = [
    { name: 'History', icon: History, label: t('nav.history') },
    { name: 'Workshops', icon: Wrench, label: t('nav.workshops') },
  ];

  return (
    <div className="min-h-[100dvh] pb-24 md:pb-0 bg-slate-50 overflow-x-hidden flex flex-col">
      {/* Top bar with user menu - desktop only */}
      <div className="hidden md:flex items-center justify-between px-6 py-3 bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <Car className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-slate-800 text-lg">EnjoyCar</span>
        </div>
        <UserMenu />
      </div>

      {/* Mobile Top Bar */}
      <div className="flex md:hidden items-center justify-between px-4 py-3 bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <Car className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-slate-800 text-base">EnjoyCar</span>
        </div>
        <UserMenu />
      </div>

      {children}

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 md:hidden z-50">
        <div className="flex items-center justify-between px-6 py-2">
          {navItemsLeft.map(item => (
            <Link 
              key={item.name}
              to={createPageUrl(item.name)}
              className={`flex flex-col items-center p-2 transition-colors ${
                isActive(item.name) 
                  ? 'text-blue-600' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <item.icon className="w-6 h-6 mb-1" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          ))}
          
          <div className="relative -mt-8 flex justify-center">
            <Link to={createPageUrl('NewMaintenance')}>
              <motion.div 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                animate={{ 
                  boxShadow: ["0px 0px 0px 0px rgba(37,99,235,0)", "0px 0px 0px 8px rgba(37,99,235,0.1)", "0px 0px 0px 0px rgba(37,99,235,0)"]
                }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xl border-4 border-white"
              >
                <Plus className="w-8 h-8" />
              </motion.div>
            </Link>
          </div>

          {navItemsRight.map(item => (
            <Link 
              key={item.name}
              to={createPageUrl(item.name)}
              className={`flex flex-col items-center p-2 transition-colors ${
                isActive(item.name) 
                  ? 'text-blue-600' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <item.icon className="w-6 h-6 mb-1" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}