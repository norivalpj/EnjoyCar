import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Loader2, Upload, FileText, Sparkles } from "lucide-react";
import { base44 } from '@/api/base44Client';
import PhotoGallery from '../shared/PhotoGallery';
import ManualHistoryUploader from './ManualHistoryUploader';

const VehicleForm = ({ initialData = {}, onSubmit, onCancel, isLoading }) => {
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    year: '',
    license_plate: '',
    color: '',
    current_mileage: '',
    photo_url: '',
    photo_urls: [],
    purchase_date: '',
    purchase_store: '',
    purchase_cnpj: '',
    purchase_price: '',
    purchase_mileage: '',
    purchase_invoice_url: '',
    purchase_notes: '',
    ...initialData,
    photo_urls: initialData.photo_urls || []
  });
  const [isUploading, setIsUploading] = useState(false);
  const [isExtractingInvoice, setIsExtractingInvoice] = useState(false);
  const [invoicePreview, setInvoicePreview] = useState(initialData.purchase_invoice_url || null);
  const [extractedHistory, setExtractedHistory] = useState([]);
  const [brandSearch, setBrandSearch] = useState('');
  const [modelSearch, setModelSearch] = useState('');
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [suggestedBrands, setSuggestedBrands] = useState([]);
  const [suggestedModels, setSuggestedModels] = useState([]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const searchBrands = async (query) => {
    if (!query || query.length < 2) {
      setSuggestedBrands([]);
      return;
    }

    setLoadingBrands(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Liste as 10 marcas de veículos (carros, motos, caminhões) mais relevantes que começam com ou contêm "${query}". Inclua marcas populares e menos conhecidas. Retorne apenas nomes de marcas reais existentes no mercado mundial.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            brands: {
              type: "array",
              items: { type: "string" }
            }
          }
        }
      });

      setSuggestedBrands(response.brands || []);
    } catch (error) {
      console.error('Error searching brands:', error);
    } finally {
      setLoadingBrands(false);
    }
  };

  const searchModels = async (brand, query = '') => {
    if (!brand) return;

    setLoadingModels(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Liste os modelos de veículos da marca ${brand}${query ? ` que contenham "${query}"` : ' (os 15 mais populares)'}. Retorne apenas modelos reais e atuais dessa marca.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            models: {
              type: "array",
              items: { type: "string" }
            }
          }
        }
      });

      setSuggestedModels(response.models || []);
    } catch (error) {
      console.error('Error searching models:', error);
    } finally {
      setLoadingModels(false);
    }
  };

  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (brandSearch) {
        searchBrands(brandSearch);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [brandSearch]);

  React.useEffect(() => {
    if (formData.brand) {
      const timer = setTimeout(() => {
        searchModels(formData.brand, modelSearch);
      }, 500);

      return () => clearTimeout(timer);
    } else {
      setSuggestedModels([]);
    }
  }, [formData.brand, modelSearch]);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      handleChange('photo_url', file_url);
    } catch (error) {
      console.error('Error uploading photo:', error);
    }
    setIsUploading(false);
  };

  const handleInvoiceUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // Upload file
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      handleChange('purchase_invoice_url', file_url);
      setInvoicePreview(file_url);
      
      setIsUploading(false);
      setIsExtractingInvoice(true);

      // Extract data from invoice
      const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: {
          type: "object",
          properties: {
            store_name: { type: "string", description: "Nome da loja ou concessionária" },
            cnpj: { type: "string", description: "CNPJ da loja no formato XX.XXX.XXX/XXXX-XX" },
            purchase_date: { type: "string", description: "Data da compra no formato YYYY-MM-DD" },
            total_price: { type: "number", description: "Valor total da compra em reais" },
            vehicle_brand: { type: "string", description: "Marca do veículo" },
            vehicle_model: { type: "string", description: "Modelo do veículo" },
            vehicle_year: { type: "number", description: "Ano do veículo" },
            vehicle_color: { type: "string", description: "Cor do veículo" },
            license_plate: { type: "string", description: "Placa do veículo se visível" },
            mileage: { type: "number", description: "Quilometragem do veículo no momento da compra" }
          }
        }
      });

      setIsExtractingInvoice(false);

      if (result.status === 'success' && result.output) {
        const extracted = result.output;
        
        // Update form with extracted data
        if (extracted.store_name) handleChange('purchase_store', extracted.store_name);
        if (extracted.cnpj) handleChange('purchase_cnpj', extracted.cnpj);
        if (extracted.purchase_date) handleChange('purchase_date', extracted.purchase_date);
        if (extracted.total_price) handleChange('purchase_price', extracted.total_price);
        if (extracted.mileage) {
          handleChange('purchase_mileage', extracted.mileage);
          // Also set as current mileage if not set
          if (!formData.current_mileage) handleChange('current_mileage', extracted.mileage);
        }
        
        // Fill vehicle data if not already set
        if (extracted.vehicle_brand && !formData.brand) handleChange('brand', extracted.vehicle_brand);
        if (extracted.vehicle_model && !formData.model) handleChange('model', extracted.vehicle_model);
        if (extracted.vehicle_year && !formData.year) handleChange('year', extracted.vehicle_year);
        if (extracted.vehicle_color && !formData.color) handleChange('color', extracted.vehicle_color);
        if (extracted.license_plate && !formData.license_plate) handleChange('license_plate', extracted.license_plate.toUpperCase());
      } else {
        alert("Não foi possível processar a nota fiscal: " + (result.error || "Tente novamente mais tarde."));
      }
    } catch (error) {
      console.error('Error processing invoice:', error);
      alert("Houve um erro na comunicação com o servidor ao processar a nota fiscal.");
      setIsUploading(false);
      setIsExtractingInvoice(false);
    }
  };

  const handleHistoryExtracted = (history) => {
    setExtractedHistory(history);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      year: formData.year ? Number(formData.year) : null,
      current_mileage: formData.current_mileage ? Number(formData.current_mileage) : null,
      purchase_price: formData.purchase_price ? Number(formData.purchase_price) : null,
      purchase_mileage: formData.purchase_mileage ? Number(formData.purchase_mileage) : null,
      photo_url: formData.photo_urls[0] || formData.photo_url || null
    };
    onSubmit(submitData, extractedHistory);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Invoice Upload - First Priority */}
      <Card className="mb-6 border-2 border-blue-200 bg-blue-50/30">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            Nota Fiscal de Compra (Opcional)
          </CardTitle>
          <p className="text-sm text-slate-500 font-normal">
            Envie a nota fiscal para preencher automaticamente os dados do veículo e da compra
          </p>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-blue-300 rounded-xl p-6 text-center bg-white">
            {invoicePreview ? (
              <div className="space-y-4">
                <img 
                  src={invoicePreview} 
                  alt="Nota fiscal"
                  className="max-h-48 mx-auto rounded-lg border"
                />
                {isExtractingInvoice && (
                  <div className="flex items-center justify-center gap-2 text-blue-600">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm font-medium">Extraindo dados da nota fiscal...</span>
                  </div>
                )}
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setInvoicePreview(null);
                    handleChange('purchase_invoice_url', '');
                  }}
                  disabled={isExtractingInvoice}
                >
                  Remover Nota
                </Button>
              </div>
            ) : (
              <>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mx-auto mb-4">
                  {isUploading || isExtractingInvoice ? (
                    <Loader2 className="w-7 h-7 text-white animate-spin" />
                  ) : (
                    <FileText className="w-7 h-7 text-white" />
                  )}
                </div>
                <h3 className="font-semibold text-slate-800 mb-1">
                  Envie a nota fiscal de compra
                </h3>
                <p className="text-sm text-slate-500 mb-4">
                  Preenche automaticamente: marca, modelo, ano, cor, placa, loja, CNPJ, data, valor e quilometragem
                </p>
                <label>
                  <input 
                    type="file" 
                    accept="image/*,.pdf" 
                    className="hidden" 
                    onChange={handleInvoiceUpload}
                    disabled={isUploading || isExtractingInvoice}
                  />
                  <Button 
                    type="button" 
                    className="cursor-pointer bg-blue-600 hover:bg-blue-700" 
                    asChild
                    disabled={isUploading || isExtractingInvoice}
                  >
                    <span>
                      <Upload className="w-4 h-4 mr-2" />
                      {isUploading ? 'Enviando...' : isExtractingInvoice ? 'Processando...' : 'Selecionar Nota Fiscal'}
                    </span>
                  </Button>
                </label>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="basic" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic">Dados Básicos</TabsTrigger>
          <TabsTrigger value="purchase">Dados da Compra</TabsTrigger>
          <TabsTrigger value="history">Histórico Manual</TabsTrigger>
        </TabsList>

        <TabsContent value="basic">
          <Card>
            <CardContent className="p-6 space-y-6">
              {/* Photo Gallery */}
              <PhotoGallery 
                photos={formData.photo_urls}
                onPhotosChange={(urls) => handleChange('photo_urls', urls)}
                maxPhotos={8}
                label="Fotos do Veículo"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 relative">
              <Label htmlFor="brand">Marca *</Label>
              <Input 
                placeholder="Digite para buscar marcas..."
                value={formData.brand || brandSearch}
                onChange={(e) => {
                  const value = e.target.value;
                  setBrandSearch(value);
                  handleChange('brand', value);
                  if (!value) {
                    handleChange('model', '');
                  }
                }}
                required
              />
              {loadingBrands && (
                <div className="absolute right-3 top-9">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                </div>
              )}
              {suggestedBrands.length > 0 && brandSearch && !formData.brand && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {suggestedBrands.map((brand, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="w-full text-left px-3 py-2 hover:bg-blue-50 text-sm"
                      onClick={() => {
                        handleChange('brand', brand);
                        setBrandSearch('');
                        setSuggestedBrands([]);
                      }}
                    >
                      {brand}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2 relative">
              <Label htmlFor="model">Modelo *</Label>
              <Input 
                placeholder="Digite para buscar modelos..."
                value={formData.model || modelSearch}
                onChange={(e) => {
                  const value = e.target.value;
                  setModelSearch(value);
                  handleChange('model', value);
                }}
                required
                disabled={!formData.brand}
              />
              {loadingModels && (
                <div className="absolute right-3 top-9">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                </div>
              )}
              {suggestedModels.length > 0 && (modelSearch || !formData.model) && formData.brand && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {suggestedModels.map((model, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="w-full text-left px-3 py-2 hover:bg-blue-50 text-sm"
                      onClick={() => {
                        handleChange('model', model);
                        setModelSearch('');
                        setSuggestedModels([]);
                      }}
                    >
                      {model}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="year">Ano</Label>
              <Input 
                type="number"
                placeholder="Ex: 2020"
                value={formData.year}
                onChange={(e) => handleChange('year', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="license_plate">Placa *</Label>
              <Input 
                placeholder="Ex: ABC-1234"
                value={formData.license_plate}
                onChange={(e) => handleChange('license_plate', e.target.value.toUpperCase())}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">Cor</Label>
              <Input 
                placeholder="Ex: Prata"
                value={formData.color}
                onChange={(e) => handleChange('color', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mileage">Quilometragem Atual</Label>
              <Input 
                type="number"
                placeholder="Ex: 45000"
                value={formData.current_mileage}
                onChange={(e) => handleChange('current_mileage', e.target.value)}
              />
            </div>
          </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="purchase">
          <Card>
            <CardContent className="p-6 space-y-6">
              {invoicePreview && (
                <div className="border border-green-200 bg-green-50 rounded-lg p-4 flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-green-800">Nota fiscal anexada</p>
                    <p className="text-xs text-green-600 mt-0.5">Os dados foram extraídos automaticamente</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome da Loja/Concessionária</Label>
                  <Input 
                    placeholder="Ex: Auto Center XYZ"
                    value={formData.purchase_store}
                    onChange={(e) => handleChange('purchase_store', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>CNPJ</Label>
                  <Input 
                    placeholder="XX.XXX.XXX/XXXX-XX"
                    value={formData.purchase_cnpj}
                    onChange={(e) => handleChange('purchase_cnpj', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Data da Compra</Label>
                  <Input 
                    type="date"
                    value={formData.purchase_date}
                    onChange={(e) => handleChange('purchase_date', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Valor da Compra (R$)</Label>
                  <Input 
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={formData.purchase_price}
                    onChange={(e) => handleChange('purchase_price', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Quilometragem na Compra</Label>
                  <Input 
                    type="number"
                    placeholder="Ex: 45000"
                    value={formData.purchase_mileage}
                    onChange={(e) => handleChange('purchase_mileage', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Observações sobre a Compra</Label>
                <Textarea 
                  placeholder="Informações adicionais sobre a compra..."
                  value={formData.purchase_notes}
                  onChange={(e) => handleChange('purchase_notes', e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <div className="space-y-4">
            <ManualHistoryUploader onHistoryExtracted={handleHistoryExtracted} />
            
            {extractedHistory.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Histórico Extraído ({extractedHistory.length} manutenções)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-green-600 mb-4">
                    ✓ As manutenções abaixo serão criadas automaticamente após salvar o veículo
                  </p>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {extractedHistory.map((item, index) => (
                      <div key={index} className="p-3 bg-slate-50 rounded-lg border text-sm">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-medium text-slate-800">{item.description}</span>
                          {item.date && (
                            <span className="text-slate-500">{new Date(item.date).toLocaleDateString('pt-BR')}</span>
                          )}
                        </div>
                        <div className="flex gap-3 text-xs text-slate-500">
                          {item.mileage && <span>{item.mileage.toLocaleString('pt-BR')} km</span>}
                          {item.workshop_name && <span>• {item.workshop_name}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex gap-3 justify-end pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button 
          type="submit" 
          disabled={isLoading || isUploading || isExtractingInvoice}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Salvar Veículo
        </Button>
      </div>
    </form>
  );
};

export default VehicleForm;