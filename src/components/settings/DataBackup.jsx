import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { base44 } from '@/api/base44Client';

export default function DataBackup() {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const [vehicles, maintenances, plans, workshops] = await Promise.all([
        base44.entities.Vehicle.list(),
        base44.entities.Maintenance.list(),
        base44.entities.MaintenancePlan.list(),
        base44.entities.Workshop.list()
      ]);

      const data = {
        exportDate: new Date().toISOString(),
        version: "1.0",
        vehicles,
        maintenances,
        plans,
        workshops
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `enjoycar_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export error:", error);
      alert("Erro ao exportar dados.");
    }
    setIsExporting(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-slate-800">Exportar Dados</h3>
          <p className="text-sm text-slate-500 mt-1">
            Baixe todos os seus veículos e históricos no formato JSON para fazer backup local seguro.
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={handleExport} 
          disabled={isExporting}
        >
          {isExporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
          Exportar JSON
        </Button>
      </div>
    </div>
  );
}
