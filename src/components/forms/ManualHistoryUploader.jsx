import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, FileImage, CheckCircle, X, BookOpen } from "lucide-react";
import { base44 } from '@/api/base44Client';

const ManualHistoryUploader = ({ onHistoryExtracted }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setIsUploading(true);
    
    try {
      // Upload all files
      const uploadPromises = files.map(file => 
        base44.integrations.Core.UploadFile({ file })
      );
      const results = await Promise.all(uploadPromises);
      const fileUrls = results.map(r => r.file_url);
      
      setUploadedFiles(prev => [...prev, ...fileUrls]);
      setIsUploading(false);
      setIsExtracting(true);

      // Extract maintenance history from all uploaded pages
      const extractionPromises = fileUrls.map(file_url =>
        base44.integrations.Core.ExtractDataFromUploadedFile({
          file_url,
          json_schema: {
            type: "object",
            properties: {
              maintenances: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    date: { type: "string", description: "Data da manutenção no formato YYYY-MM-DD" },
                    mileage: { type: "number", description: "Quilometragem registrada" },
                    description: { type: "string", description: "Descrição do serviço realizado" },
                    workshop_name: { type: "string", description: "Nome da oficina se mencionado" },
                    type: { 
                      type: "string",
                      enum: ["oil_change", "tire", "brake", "filter", "battery", "alignment", "suspension", "electrical", "engine", "transmission", "air_conditioning", "general_review", "other"],
                      description: "Tipo de manutenção baseado na descrição"
                    }
                  }
                }
              }
            }
          }
        })
      );

      const extractionResults = await Promise.all(extractionPromises);
      
      // Combine all maintenances from all pages
      const allMaintenances = extractionResults
        .filter(r => r.status === 'success' && r.output?.maintenances)
        .flatMap(r => r.output.maintenances);

      setIsExtracting(false);
      
      if (allMaintenances.length > 0) {
        onHistoryExtracted(allMaintenances);
      } else {
        alert("Não foi possível extrair dados ou nenhum dado encontrado neste manual.");
        onHistoryExtracted([]);
      }
    } catch (error) {
      console.error('Error processing manual:', error);
      alert("Houve um erro na comunicação com o servidor ao processar o manual.");
      setIsUploading(false);
      setIsExtracting(false);
    }
  };

  const clearFiles = () => {
    setUploadedFiles([]);
    onHistoryExtracted([]);
  };

  if (uploadedFiles.length > 0) {
    return (
      <Card className="border-2 border-dashed border-green-300 bg-green-50/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              {isExtracting ? (
                <Loader2 className="w-6 h-6 animate-spin text-green-600" />
              ) : (
                <CheckCircle className="w-6 h-6 text-green-600" />
              )}
            </div>
            
            <div className="flex-1">
              {isExtracting ? (
                <p className="text-sm text-green-700 font-medium">
                  Extraindo histórico de manutenções...
                </p>
              ) : (
                <>
                  <p className="text-sm text-green-700 font-medium">
                    {uploadedFiles.length} foto(s) do manual processada(s)
                  </p>
                  <p className="text-xs text-green-600 mt-0.5">
                    Histórico extraído com sucesso
                  </p>
                </>
              )}
            </div>

            <Button 
              variant="ghost" 
              size="icon" 
              onClick={clearFiles}
              disabled={isExtracting}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-dashed border-slate-200">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          Histórico do Manual (Seminovo)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center mx-auto mb-4">
            {isUploading ? (
              <Loader2 className="w-7 h-7 text-blue-500 animate-spin" />
            ) : (
              <FileImage className="w-7 h-7 text-blue-500" />
            )}
          </div>
          
          <h3 className="font-medium text-slate-700 mb-1">
            Fotos das páginas do manual
          </h3>
          <p className="text-sm text-slate-400 mb-4">
            Envie fotos das páginas de manutenção do manual do veículo
          </p>

          <label>
            <input 
              type="file" 
              accept="image/*" 
              multiple
              className="hidden" 
              onChange={handleFileUpload}
              disabled={isUploading}
            />
            <Button 
              type="button" 
              variant="outline" 
              className="cursor-pointer" 
              asChild
              disabled={isUploading}
            >
              <span>
                <Upload className="w-4 h-4 mr-2" />
                {isUploading ? 'Enviando...' : 'Selecionar Fotos'}
              </span>
            </Button>
          </label>
        </div>
      </CardContent>
    </Card>
  );
};

export default ManualHistoryUploader;