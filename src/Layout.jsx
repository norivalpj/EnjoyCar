import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Home, Car, History, Plus, Wrench } from 'lucide-react';
import UserMenu from '@/components/layout/UserMenu';

export default function Layout({ children }) {
  const location = useLocation();

  useEffect(() => {
    // Register Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    // Create manifest dynamically
    const manifest = {
      name: 'Gestão de Veículos',
      short_name: 'Veículos',
      description: 'Gerencie seus veículos e manutenções',
      start_url: '/',
      display: 'standalone',
      background_color: '#ffffff',
      theme_color: '#2563eb',
      orientation: 'portrait',
      icons: [
        {
          src: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="100" fill="%232563eb"/><path d="M256 160c-53 0-96 43-96 96s43 96 96 96 96-43 96-96-43-96-96-96zm0 160c-35.3 0-64-28.7-64-64s28.7-64 64-64 64 28.7 64 64-28.7 64-64 64z" fill="white"/><circle cx="256" cy="256" r="32" fill="white"/></svg>',
          sizes: '512x512',
          type: 'image/svg+xml',
          purpose: 'any maskable'
        }
      ]
    };

    const manifestBlob = new Blob([JSON.stringify(manifest)], { type: 'application/json' });
    const manifestURL = URL.createObjectURL(manifestBlob);
    
    let link = document.querySelector('link[rel="manifest"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'manifest';
      document.head.appendChild(link);
    }
    link.href = manifestURL;

    // Add PWA meta tags
    const metaTags = [
      { name: 'theme-color', content: '#2563eb' },
      { name: 'mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
      { name: 'apple-mobile-web-app-title', content: 'Veículos' }
    ];

    metaTags.forEach(({ name, content }) => {
      let meta = document.querySelector(`meta[name="${name}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = name;
        document.head.appendChild(meta);
      }
      meta.content = content;
    });

    // Service Worker code
    const swCode = `
      const CACHE_NAME = 'vehicle-app-v1';
      const urlsToCache = ['/'];

      self.addEventListener('install', event => {
        event.waitUntil(
          caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
        );
      });

      self.addEventListener('fetch', event => {
        event.respondWith(
          caches.match(event.request).then(response => {
            return response || fetch(event.request);
          })
        );
      });

      self.addEventListener('activate', event => {
        event.waitUntil(
          caches.keys().then(cacheNames => {
            return Promise.all(
              cacheNames.map(cacheName => {
                if (cacheName !== CACHE_NAME) {
                  return caches.delete(cacheName);
                }
              })
            );
          })
        );
      });
    `;

    const swBlob = new Blob([swCode], { type: 'application/javascript' });
    const swURL = URL.createObjectURL(swBlob);
    
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register(swURL).catch(() => {});
    }
  }, []);
  
  const isActive = (pageName) => {
    return location.pathname.includes(pageName);
  };

  const navItems = [
    { name: 'Home', icon: Home, label: 'Início' },
    { name: 'Vehicles', icon: Car, label: 'Veículos' },
    { name: 'History', icon: History, label: 'Histórico' },
    { name: 'Workshops', icon: Wrench, label: 'Oficinas' },
  ];

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      {/* Top bar with user menu - desktop only */}
      <div className="hidden md:flex items-center justify-end px-6 py-2 bg-white border-b border-slate-100">
        <UserMenu />
      </div>

      {children}

      {/* Mobile Top Bar */}
      <div className="flex md:hidden items-center justify-between px-4 py-2 bg-white border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
            <Car className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-slate-800 text-sm">EnjoyCar</span>
        </div>
        <UserMenu />
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 md:hidden z-50">
        <div className="flex items-center justify-around py-2">
          {navItems.map(item => (
            <Link 
              key={item.name}
              to={createPageUrl(item.name)}
              className={`flex flex-col items-center px-4 py-2 transition-colors ${
                isActive(item.name) 
                  ? 'text-blue-600' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          ))}
          
          <Link 
            to={createPageUrl('NewMaintenance')}
            className="flex flex-col items-center px-4 py-2"
          >
            <div className="w-12 h-12 -mt-6 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-200">
              <Plus className="w-6 h-6" />
            </div>
          </Link>
        </div>
      </nav>
    </div>
  );
}