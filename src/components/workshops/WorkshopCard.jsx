import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, Mail, Star, Pencil, Trash2 } from "lucide-react";

const WorkshopCard = ({ workshop, onEdit, onDelete }) => {
  return (
    <Card className={workshop.is_favorite ? 'border-yellow-300 bg-yellow-50/30' : ''}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-slate-800">{workshop.name}</h3>
              {workshop.is_favorite && (
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              )}
            </div>

            <div className="space-y-1 text-sm text-slate-600">
              {workshop.address && (
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <span>{workshop.address}</span>
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <a href={`tel:${workshop.phone}`} className="hover:text-blue-600">
                  {workshop.phone}
                </a>
              </div>

              {workshop.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <a href={`mailto:${workshop.email}`} className="hover:text-blue-600">
                    {workshop.email}
                  </a>
                </div>
              )}
            </div>

            {workshop.specialties && workshop.specialties.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3">
                {workshop.specialties.map((spec, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {spec}
                  </Badge>
                ))}
              </div>
            )}

            {workshop.notes && (
              <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                {workshop.notes}
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              className="h-8 w-8"
              onClick={() => onEdit(workshop)}
            >
              <Pencil className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              className="h-8 w-8 text-red-500 hover:text-red-600"
              onClick={() => onDelete(workshop)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WorkshopCard;