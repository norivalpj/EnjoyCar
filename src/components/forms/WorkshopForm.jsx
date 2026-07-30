import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Save, Loader2, Search, MapPin, Phone, Star, ExternalLink } from "lucide-react";

const WorkshopForm = ({ initialData = {}, onSubmit, onCancel, isLoading }) => {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    specialties: [],
    notes: '',
    rating: 0,
    is_favorite: false,
    ...initialData,
    specialties: initialData.specialties || []
  });

  const [searching, setSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchError, setSearchError] = useState('');
  const [newSpecialty, setNewSpecialty] = useState('');

  const searchWorkshops = async () => {
    if (!searchQuery.trim()) return;
    setSearchError('');
    setSearchResults([]);
    setSearching(true);

    try {
      const res = await fetch('/api/search-places', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery })
      });
      const data = await res.json();
      
      if (res.ok && data.results?.length > 0) {
        setSearchResults(data.results);
      } else if (res.ok && data.results?.length === 0) {
        setSearchError('Nenhuma oficina encontrada na web com esse nome. Tente um termo diferente.');
      } else if (res.status === 429 || data.error?.includes('Quota') || data.error?.includes('429')) {
        setSearchError('LIMITE DIÁRIO ATINGIDO: A cota gratuita de buscas diárias da IA acabou.');
      } else {
        setSearchError(data.error || 'Erro ao buscar dados na internet.');
      }
    } catch (err) {
      console.error('API /search-places error:', err);
      setSearchError('Erro de conexão com o servidor de busca.');
    } finally {
      setSearching(false);
    }
  };

  const openGoogleMaps = () => {
    const query = encodeURIComponent(`oficina mecânica ${searchQuery}`);
    window.open(`https://www.google.com/maps/search/${query}`, '_blank');
  };

  const selectWorkshop = (workshop) => {
    setFormData(prev => ({
      ...prev,
      name: workshop.name,
      address: workshop.address,
      phone: workshop.phone || '',
      rating: workshop.rating || prev.rating,
      specialties: workshop.specialties?.length ? workshop.specialties : prev.specialties
    }));
    setSearchResults([]);
    setSearchQuery('');
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addSpecialty = () => {
    if (newSpecialty.trim() && !formData.specialties.includes(newSpecialty.trim())) {
      handleChange('specialties', [...formData.specialties, newSpecialty.trim()]);
      setNewSpecialty('');
    }
  };

  const removeSpecialty = (specialty) => {
    handleChange('specialties', formData.specialties.filter(s => s !== specialty));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Google Search */}
      <Card className="border-blue-200 bg-blue-50/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Search className="w-4 h-4 text-blue-600" />
            Buscar oficina pelo nome ou cidade
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder='Ex: "Auto Mecânica Silva, SP" ou "Iguatemi, Sorocaba"'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), searchWorkshops())}
            />
            <Button
              type="button"
              onClick={searchWorkshops}
              disabled={!searchQuery.trim() || searching}
              className="bg-blue-600 hover:bg-blue-700 shrink-0"
            >
              {searching ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </Button>
          </div>



          {searchError && (
            <div className="mt-2 space-y-2">
              <p className="text-xs text-red-600 bg-red-50 rounded p-2 border border-red-200">
                {searchError}
              </p>
              {searchError.includes('LIMITE DIÁRIO') && (
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  className="w-full text-xs"
                  onClick={openGoogleMaps}
                >
                  <ExternalLink className="w-3 h-3 mr-2" />
                  Pesquisar manualmente no Google Maps
                </Button>
              )}
            </div>
          )}

          {searchResults.length > 0 && (
            <div className="mt-3 space-y-2 max-h-72 overflow-y-auto">
              {searchResults.map((result, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => selectWorkshop(result)}
                  className="w-full text-left p-3 bg-white rounded-lg border hover:border-blue-400 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-800 text-sm truncate">{result.name}</p>
                        {result.rating > 0 && (
                          <span className="text-xs text-amber-600 flex items-center gap-0.5 shrink-0">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            {result.rating.toFixed(1)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{result.address}</p>
                      {result.phone && (
                        <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {result.phone}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manual Form */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Nome da Oficina *</Label>
          <Input
            placeholder="Ex: Auto Mecânica Silva"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Endereço</Label>
          <Input
            placeholder="Rua, número, bairro, cidade"
            value={formData.address}
            onChange={(e) => handleChange('address', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Telefone *</Label>
            <Input
              placeholder="(11) 98765-4321"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              type="email"
              placeholder="contato@oficina.com"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Especialidades</Label>
          <div className="flex gap-2">
            <Input
              placeholder="Ex: Suspensão, Motor, Elétrica"
              value={newSpecialty}
              onChange={(e) => setNewSpecialty(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSpecialty())}
            />
            <Button type="button" onClick={addSpecialty} variant="outline">
              Adicionar
            </Button>
          </div>
          {formData.specialties.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.specialties.map((spec, idx) => (
                <Badge key={idx} variant="secondary" className="cursor-pointer" onClick={() => removeSpecialty(spec)}>
                  {spec} ×
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label>Observações</Label>
          <Textarea
            placeholder="Horário de atendimento, observações importantes..."
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            rows={3}
          />
        </div>

        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
          <div>
            <Label>Oficina Favorita</Label>
            <p className="text-xs text-slate-500">Priorizar esta oficina nas sugestões</p>
          </div>
          <Switch
            checked={formData.is_favorite}
            onCheckedChange={(checked) => handleChange('is_favorite', checked)}
          />
        </div>
      </div>

      <div className="flex gap-3 justify-end pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Salvar Oficina
        </Button>
      </div>
    </form>
  );
};

export default WorkshopForm;