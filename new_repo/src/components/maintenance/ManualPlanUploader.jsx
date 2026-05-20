import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { base44 } from '@/api/base44Client';
import { Upload, Loader2, BookOpen, CheckCircle, Camera } from "lucide-react";

const ManualPlanUploader = ({ vehicleId, onPlanExtracted }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [extractedPlan, setExtractedPlan] = useState(null);

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setIsUploading(true);
    try {
      const uploadPromises = files.map(file => 
        base44.integrations.Core.UploadFile({ file })
      );
      const results = await Promise.all(uploadPromises);
      const urls = results.map(r => r.file_url);
      
      setUploadedImages(prev => [...prev, ...urls]);
      setIsUploading(false);
      
      // Extract maintenance plan
      setIsExtracting(true);
      await extractMaintenancePlan([...uploadedImages, ...urls]);
    } catch (error) {
      console.error('Error uploading files:', error);
      setIsUploading(false);
      setIsExtracting(false);
    }
  };

  const extractMaintenancePlan = async (imageUrls) => {
    try {
      const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url: imageUrls[0],
        json_schema: {
          type: "object",
          properties: {
            maintenance_schedule: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  maintenance_type: { type: "string", description: "Tipo de manutenção" },
                  description: { type: "string", description: "Descrição da manutenção" },
                  recommended_mileage: { type: "number", description: "Quilometragem inicial recomendada em km" },
                  recommended_interval_km: { type: "number", description: "Intervalo em km para repetição" },
                  recommended_interval_months: { type: "number", description: "Intervalo em meses" },
                  priority: { type: "string", enum: ["low", "medium", "high"], description: "Prioridade" }
                }
              }
            }
          }
        }
      });

      setIsExtracting(false);

      if (result.status === 'success' && result.output?.maintenance_schedule) {
        const plan = result.output.maintenance_schedule.map(item => ({
          ...item,
          vehicle_id: vehicleId,
          manual_images: imageUrls,
          is_completed: false
        }));
        
        setExtractedPlan(plan);
        
        // Save to database
        await base44.entities.MaintenancePlan.bulkCreate(plan);
        
        if (onPlanExtracted) {
          onPlanExtracted(plan);
        }
      }
    } catch (error) {
      console.error('Error extracting maintenance plan:', error);
      setIsExtracting(false);
    }
  };

  const handleClear = () => {
    setUploadedImages([]);
    setExtractedPlan(null);
  };

  if (extractedPlan) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-green-800 mb-1">
                Plano de Manutenção Criado!
              </h3>
              <p className="text-sm text-green-700 mb-3">
                {extractedPlan.length} manutenções foram extraídas do manual e salvas
              </p>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleClear}
                  className="bg-white"
                >
                  Enviar Mais Páginas
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (uploadedImages.length > 0 && !extractedPlan) {
    return (
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-800 mb-1">
                Processando manual...
              </h3>
              <p className="text-sm text-blue-700">
                Extraindo plano de manutenção das imagens enviadas
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          Manual de Manutenção
        </CardTitle>
        <p className="text-sm text-slate-500 font-normal">
          Envie fotos do manual com as manutenções recomendadas e quilometragens
        </p>
      </CardHeader>
      <CardContent>
        <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center mx-auto mb-4">
            {isUploading || isExtracting ? (
              <Loader2 className="w-7 h-7 text-blue-500 animate-spin" />
            ) : (
              <Camera className="w-7 h-7 text-blue-500" />
            )}
          </div>
          <h3 className="font-medium text-slate-700 mb-2">
            Envie fotos do manual de manutenção
          </h3>
          <p className="text-sm text-slate-500 mb-4">
            O plano de manutenção será criado automaticamente
          </p>
          <label>
            <input 
              type="file" 
              accept="image/*" 
              multiple
              className="hidden" 
              onChange={handleFileUpload}
              disabled={isUploading || isExtracting}
            />
            <Button 
              type="button" 
              variant="outline" 
              className="cursor-pointer" 
              asChild
              disabled={isUploading || isExtracting}
            >
              <span>
                <Upload className="w-4 h-4 mr-2" />
                {isUploading ? 'Enviando...' : isExtracting ? 'Extraindo...' : 'Selecionar Fotos'}
              </span>
            </Button>
          </label>
        </div>
      </CardContent>
    </Card>
  );
};

export default ManualPlanUploader;