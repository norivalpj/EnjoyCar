import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, RefreshCw } from "lucide-react";
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";

export default function StorageMonitor({ user }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  // Users can see their own storage quota usage
  const isAdmin = true;

  const fetchStats = async () => {
    setLoading(true);
    try {
      // Simplistic way to estimate local usage (since free tier is mostly firestore reads/writes/storage)
      // We will count how many documents exist for this user, which approximates Firestore usage mapping.
      const [vehicles, maintenances, plans, workshops] = await Promise.all([
        base44.entities.Vehicle.list(),
        base44.entities.Maintenance.list(),
        base44.entities.MaintenancePlan.list(),
        base44.entities.Workshop.list()
      ]);
      
      let totalPhotos = 0;
      maintenances.forEach(m => {
        if (m.photo_urls && m.photo_urls.length) {
          totalPhotos += m.photo_urls.length;
        }
      });
      vehicles.forEach(v => {
        if (v.photo_url) totalPhotos += 1;
      });

      const docsCount = vehicles.length + maintenances.length + plans.length + workshops.length;
      
      // Calculate total localStorage size being used for cache
      let cacheSize = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('base44_cache_')) {
          cacheSize += localStorage.getItem(key).length;
        }
      }
      
      setStats({
        docsCount,
        totalPhotos,
        cacheSizeKb: (cacheSize / 1024).toFixed(2)
      });
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) {
      fetchStats();
    }
  }, [isAdmin]);

  if (!isAdmin) return null;

  return (
    <Card className="border-purple-200 bg-purple-50">
      <CardHeader className="pb-3 border-b border-purple-100 flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2 text-purple-800">
          <Database className="w-5 h-5" />
          Painel de Armazenamento
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={fetchStats} disabled={loading} className="text-purple-700 hover:text-purple-900 hover:bg-purple-100">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent className="pt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white p-3 rounded-lg border border-purple-100 shadow-sm">
          <p className="text-xs text-slate-500 font-medium mb-1 uppercase">Documentos</p>
          <div className="text-2xl font-bold text-slate-800">{stats?.docsCount || 0}</div>
          <p className="text-[10px] text-slate-400 mt-1">Limite free: 50K reads/dia</p>
        </div>
        <div className="bg-white p-3 rounded-lg border border-purple-100 shadow-sm">
          <p className="text-xs text-slate-500 font-medium mb-1 uppercase">Imagens / Arquivos</p>
          <div className="text-2xl font-bold text-slate-800">{stats?.totalPhotos || 0}</div>
          <p className="text-[10px] text-slate-400 mt-1">Estimativa de uso Base64</p>
        </div>
        <div className="bg-white p-3 rounded-lg border border-purple-100 shadow-sm">
          <p className="text-xs text-slate-500 font-medium mb-1 uppercase">Cache LocalStorage</p>
          <div className="text-2xl font-bold text-slate-800 flex items-baseline gap-1">
            {stats?.cacheSizeKb || 0} <span className="text-sm font-normal">KB</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Fallback offline limit: 5MB</p>
        </div>
      </CardContent>
    </Card>
  );
}
