import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Loader2, Plus, Trash2 } from "lucide-react";
import PhotoGallery from '../shared/PhotoGallery';

const maintenanceTypes = [
  { value: "oil_change", label: "Troca de Óleo" },
  { value: "tire", label: "Pneus" },
  { value: "brake", label: "Freios" },
  { value: "filter", label: "Filtros" },
  { value: "battery", label: "Bateria" },
  { value: "alignment", label: "Alinhamento" },
  { value: "suspension", label: "Suspensão" },
  { value: "electrical", label: "Elétrica" },
  { value: "engine", label: "Motor" },
  { value: "transmission", label: "Transmissão" },
  { value: "air_conditioning", label: "Ar Condicionado" },
  { value: "general_review", label: "Revisão Geral" },
  { value: "other", label: "Outros" }
];

const MaintenanceForm = ({ 
  vehicles, 
  initialData = {}, 
  extractedData = null,
  invoiceUrl = null,
  onSubmit, 
  onCancel,
  isLoading 
}) => {
  const [formData, setFormData] = useState({
    vehicle_id: '',
    date: new Date().toISOString().split('T')[0],
    type: 'other',
    description: '',
    mileage: '',
    cost: '',
    workshop_name: '',
    invoice_number: '',
    parts_replaced: [],
    photo_urls: [],
    next_maintenance_date: '',
    next_maintenance_mileage: '',
    ...initialData,
    photo_urls: initialData.photo_urls || []
  });

  // Apply extracted data when available
  useEffect(() => {
    if (extractedData) {
      setFormData(prev => ({
        ...prev,
        date: extractedData.date || prev.date,
        type: extractedData.maintenance_type || prev.type,
        description: extractedData.description || prev.description,
        cost: extractedData.total_cost || prev.cost,
        workshop_name: extractedData.workshop_name || prev.workshop_name,
        invoice_number: extractedData.invoice_number || prev.invoice_number,
        mileage: extractedData.vehicle_info?.mileage || prev.mileage,
        parts_replaced: extractedData.parts?.map(p => ({
          name: p.name,
          quantity: p.quantity || 1,
          unit_price: p.unit_price || 0
        })) || prev.parts_replaced
      }));
    }
  }, [extractedData]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addPart = () => {
    setFormData(prev => ({
      ...prev,
      parts_replaced: [...prev.parts_replaced, { name: '', quantity: 1, unit_price: 0 }]
    }));
  };

  const updatePart = (index, field, value) => {
    setFormData(prev => {
      const parts = [...prev.parts_replaced];
      parts[index] = { ...parts[index], [field]: value };
      return { ...prev, parts_replaced: parts };
    });
  };

  const removePart = (index) => {
    setFormData(prev => ({
      ...prev,
      parts_replaced: prev.parts_replaced.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      mileage: formData.mileage ? Number(formData.mileage) : null,
      cost: formData.cost ? Number(formData.cost) : null,
      next_maintenance_mileage: formData.next_maintenance_mileage ? Number(formData.next_maintenance_mileage) : null,
      invoice_url: invoiceUrl
    };
    onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Informações Básicas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vehicle">Veículo *</Label>
              <Select 
                value={formData.vehicle_id} 
                onValueChange={(v) => handleChange('vehicle_id', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o veículo" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map(v => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.brand} {v.model} - {v.license_plate}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Tipo de Manutenção *</Label>
              <Select 
                value={formData.type} 
                onValueChange={(v) => handleChange('type', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {maintenanceTypes.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Data *</Label>
              <Input 
                type="date" 
                value={formData.date}
                onChange={(e) => handleChange('date', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mileage">Quilometragem</Label>
              <Input 
                type="number" 
                placeholder="Ex: 45000"
                value={formData.mileage}
                onChange={(e) => handleChange('mileage', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição do Serviço</Label>
            <Textarea 
              placeholder="Descreva o que foi feito..."
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
            />
            </div>

            <PhotoGallery 
            photos={formData.photo_urls}
            onPhotosChange={(urls) => handleChange('photo_urls', urls)}
            maxPhotos={3}
            label="Fotos da Manutenção"
            />
            </CardContent>
            </Card>

            <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Dados da Nota/Oficina</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="workshop">Nome da Oficina</Label>
              <Input 
                placeholder="Ex: Auto Center XYZ"
                value={formData.workshop_name}
                onChange={(e) => handleChange('workshop_name', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="invoice">Número da Nota</Label>
              <Input 
                placeholder="Ex: NF-12345"
                value={formData.invoice_number}
                onChange={(e) => handleChange('invoice_number', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cost">Valor Total (R$)</Label>
              <Input 
                type="number" 
                step="0.01"
                placeholder="0,00"
                value={formData.cost}
                onChange={(e) => handleChange('cost', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4 flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Peças Substituídas</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={addPart}>
            <Plus className="w-4 h-4 mr-1" /> Adicionar
          </Button>
        </CardHeader>
        <CardContent>
          {formData.parts_replaced.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">
              Nenhuma peça adicionada
            </p>
          ) : (
            <div className="space-y-3">
              {formData.parts_replaced.map((part, index) => (
                <div key={index} className="flex gap-3 items-start">
                  <div className="flex-1">
                    <Input 
                      placeholder="Nome da peça"
                      value={part.name}
                      onChange={(e) => updatePart(index, 'name', e.target.value)}
                    />
                  </div>
                  <div className="w-20">
                    <Input 
                      type="number"
                      placeholder="Qtd"
                      value={part.quantity}
                      onChange={(e) => updatePart(index, 'quantity', Number(e.target.value))}
                    />
                  </div>
                  <div className="w-28">
                    <Input 
                      type="number"
                      step="0.01"
                      placeholder="Preço"
                      value={part.unit_price}
                      onChange={(e) => updatePart(index, 'unit_price', Number(e.target.value))}
                    />
                  </div>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon"
                    onClick={() => removePart(index)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Próxima Manutenção (Opcional)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data Prevista</Label>
              <Input 
                type="date"
                value={formData.next_maintenance_date}
                onChange={(e) => handleChange('next_maintenance_date', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Quilometragem Prevista</Label>
              <Input 
                type="number"
                placeholder="Ex: 50000"
                value={formData.next_maintenance_mileage}
                onChange={(e) => handleChange('next_maintenance_mileage', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button 
          type="submit" 
          disabled={isLoading || !formData.vehicle_id}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Salvar Manutenção
        </Button>
      </div>
    </form>
  );
};

export default MaintenanceForm;