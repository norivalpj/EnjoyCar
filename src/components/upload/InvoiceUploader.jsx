import React, { useState, useCallback } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Camera, FileImage, Loader2, CheckCircle, X } from "lucide-react";
import { base44 } from '@/api/base44Client';

const InvoiceUploader = ({ onDataExtracted, onFileUploaded }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const processFile = async (file) => {
    if (!file) return;
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      alert('Por favor, envie uma imagem (JPG, PNG) ou PDF');
      return;
    }

    setIsUploading(true);
    setUploadedFile(file);

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreviewUrl(e.target.result);
      reader.readAsDataURL(file);
    }

    try {
      // Upload file
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      onFileUploaded(file_url);
      
      setIsUploading(false);
      setIsExtracting(true);

      // Extract data from invoice
      const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: {
          type: "object",
          properties: {
            date: { type: "string", description: "Data da nota/recibo no formato YYYY-MM-DD" },
            workshop_name: { type: "string", description: "Nome da oficina ou estabelecimento" },
            invoice_number: { type: "string", description: "Número da nota fiscal ou recibo" },
            total_cost: { type: "number", description: "Valor total em reais" },
            description: { type: "string", description: "Descrição do serviço realizado" },
            maintenance_type: { 
              type: "string", 
              enum: ["oil_change", "tire", "brake", "filter", "battery", "alignment", "suspension", "electrical", "engine", "transmission", "air_conditioning", "general_review", "other"],
              description: "Tipo de manutenção baseado no serviço descrito"
            },
            parts: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  quantity: { type: "number" },
                  unit_price: { type: "number" }
                }
              },
              description: "Lista de peças ou itens discriminados na nota"
            },
            vehicle_info: {
              type: "object",
              properties: {
                license_plate: { type: "string", description: "Placa do veículo se visível" },
                mileage: { type: "number", description: "Quilometragem se mencionada" }
              }
            }
          }
        }
      });

      setIsExtracting(false);

      if (result.status === 'success' && result.output) {
        onDataExtracted(result.output);
      } else {
        alert("Não foi possível processar a nota/recibo: " + (result.error || "Tente novamente mais tarde."));
        onDataExtracted(null);
      }
    } catch (error) {
      console.error('Error processing file:', error);
      alert("Houve um erro na comunicação com o servidor ao processar o arquivo.");
      setIsUploading(false);
      setIsExtracting(false);
    }
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    processFile(file);
  }, []);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    processFile(file);
  };

  const clearUpload = () => {
    setUploadedFile(null);
    setPreviewUrl(null);
    onFileUploaded(null);
    onDataExtracted(null);
  };

  if (uploadedFile) {
    return (
      <Card className="border-2 border-dashed border-green-300 bg-green-50/50">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            {previewUrl ? (
              <img src={previewUrl} alt="Preview" className="w-20 h-20 object-cover rounded-lg" />
            ) : (
              <div className="w-20 h-20 bg-slate-100 rounded-lg flex items-center justify-center">
                <FileImage className="w-8 h-8 text-slate-400" />
              </div>
            )}
            
            <div className="flex-1">
              <div className="flex items-center gap-2">
                {isUploading && (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                    <span className="text-sm text-slate-600">Enviando arquivo...</span>
                  </>
                )}
                {isExtracting && (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                    <span className="text-sm text-slate-600">Extraindo dados da nota...</span>
                  </>
                )}
                {!isUploading && !isExtracting && (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-green-600 font-medium">Arquivo processado</span>
                  </>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1 truncate">{uploadedFile.name}</p>
            </div>

            <Button 
              variant="ghost" 
              size="icon" 
              onClick={clearUpload}
              disabled={isUploading || isExtracting}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className={`border-2 border-dashed transition-all duration-300 ${
        isDragging 
          ? 'border-blue-400 bg-blue-50/50' 
          : 'border-slate-200 hover:border-slate-300'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <CardContent className="p-8">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center mb-4">
            <Upload className="w-7 h-7 text-blue-500" />
          </div>
          
          <h3 className="font-medium text-slate-700 mb-1">
            Envie a nota fiscal ou recibo
          </h3>
          <p className="text-sm text-slate-400 mb-4">
            Arraste uma imagem ou clique para selecionar
          </p>

          <div className="flex gap-3">
            <label>
              <input 
                type="file" 
                accept="image/*,.pdf" 
                className="hidden" 
                onChange={handleFileSelect}
              />
              <Button variant="outline" className="cursor-pointer" asChild>
                <span>
                  <FileImage className="w-4 h-4 mr-2" />
                  Galeria
                </span>
              </Button>
            </label>

            <label>
              <input 
                type="file" 
                accept="image/*" 
                capture="environment"
                className="hidden" 
                onChange={handleFileSelect}
              />
              <Button className="cursor-pointer bg-blue-600 hover:bg-blue-700" asChild>
                <span>
                  <Camera className="w-4 h-4 mr-2" />
                  Câmera
                </span>
              </Button>
            </label>
          </div>

          <p className="text-xs text-slate-300 mt-4">
            JPG, PNG ou PDF • Máximo 10MB
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default InvoiceUploader;