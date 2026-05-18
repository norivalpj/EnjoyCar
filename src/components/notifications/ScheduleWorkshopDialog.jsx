import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Send, MessageSquare, Star } from "lucide-react";

const ScheduleWorkshopDialog = ({ open, onClose, vehicle, plan }) => {
  const [selectedWorkshopId, setSelectedWorkshopId] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [sending, setSending] = useState(false);

  const { data: workshops = [] } = useQuery({
    queryKey: ['workshops'],
    queryFn: () => base44.entities.Workshop.list('-created_date')
  });

  const selectedWorkshop = workshops.find(w => w.id === selectedWorkshopId);

  // Generate default message
  const defaultMessage = vehicle && plan ? `Olá! Gostaria de agendar uma manutenção:

Veículo: ${vehicle.brand} ${vehicle.model} ${vehicle.year ? `(${vehicle.year})` : ''}
Placa: ${vehicle.license_plate}
Quilometragem: ${vehicle.current_mileage?.toLocaleString('pt-BR')} km

Serviço: ${plan.maintenance_type}
${plan.description ? `Descrição: ${plan.description}` : ''}

Poderia me informar disponibilidade de horário?

Obrigado!` : '';

  const handleSend = async () => {
    if (!selectedWorkshop) return;

    setSending(true);
    try {
      const message = customMessage || defaultMessage;
      const whatsappNumber = selectedWorkshop.phone.replace(/\D/g, '');
      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/55${whatsappNumber}?text=${encodedMessage}`;
      
      window.open(whatsappUrl, '_blank');
      
      // Close dialog after a short delay
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            Agendar com Oficina
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Workshop Selection */}
          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">
              Selecione a Oficina
            </label>
            {workshops.length === 0 ? (
              <Card className="border-amber-200 bg-amber-50">
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-amber-800">
                    Você não tem oficinas cadastradas.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Select value={selectedWorkshopId} onValueChange={setSelectedWorkshopId}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha uma oficina" />
                </SelectTrigger>
                <SelectContent>
                  {workshops.map(workshop => (
                    <SelectItem key={workshop.id} value={workshop.id}>
                      <div className="flex items-center gap-2">
                        {workshop.is_favorite && (
                          <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                        )}
                        <span>{workshop.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Selected Workshop Info */}
          {selectedWorkshop && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <p className="text-sm font-medium text-slate-800 mb-1">
                  {selectedWorkshop.name}
                </p>
                {selectedWorkshop.address && (
                  <p className="text-xs text-slate-600 mb-1">{selectedWorkshop.address}</p>
                )}
                <p className="text-xs text-slate-600">{selectedWorkshop.phone}</p>
              </CardContent>
            </Card>
          )}

          {/* Message Preview/Edit */}
          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">
              Mensagem (WhatsApp)
            </label>
            <Textarea 
              value={customMessage || defaultMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={12}
              className="text-sm font-mono"
            />
            <p className="text-xs text-slate-500 mt-1">
              Você pode editar a mensagem antes de enviar
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSend}
              disabled={!selectedWorkshop || sending || workshops.length === 0}
              className="bg-green-600 hover:bg-green-700"
            >
              {sending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Enviar WhatsApp
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleWorkshopDialog;