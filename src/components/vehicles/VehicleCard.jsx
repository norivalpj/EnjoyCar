import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Car, Gauge } from "lucide-react";

const VehicleCard = ({ vehicle, onClick, isSelected }) => {
  return (
    <Card 
      className={`cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
        isSelected ? 'ring-2 ring-blue-500 shadow-lg' : ''
      }`}
      onClick={() => onClick(vehicle)}
    >
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          {(vehicle.photo_urls?.[0] || vehicle.photo_url) ? (
            <img 
              src={vehicle.photo_urls?.[0] || vehicle.photo_url} 
              alt={`${vehicle.brand} ${vehicle.model}`}
              className="w-20 h-20 rounded-xl object-cover"
            />
          ) : (
            <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
              <Car className="w-8 h-8 text-slate-400" />
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base text-slate-800 truncate leading-tight">
              {vehicle.brand} {vehicle.model}
            </h3>
            {vehicle.year && (
              <p className="text-xs text-slate-400 mb-1">{vehicle.year}</p>
            )}
            <Badge variant="secondary" className="bg-blue-50 text-blue-700 font-mono text-xs border-blue-100">
              {vehicle.license_plate}
            </Badge>
            
            {vehicle.current_mileage && (
              <div className="flex items-center gap-1 mt-2 text-sm text-slate-500">
                <Gauge className="w-3.5 h-3.5 text-blue-400" />
                <span className="font-medium">{vehicle.current_mileage.toLocaleString('pt-BR')} km</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VehicleCard;