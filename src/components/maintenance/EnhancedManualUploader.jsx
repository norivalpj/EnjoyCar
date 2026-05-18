import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, Image, CheckCircle, Loader2, AlertCircle, BookOpen } from "lucide-react";

const EnhancedManualUploader = ({ vehicleId, onComplete }) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const acceptedFormats = {
    'application/pdf': ['.pdf'],
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/webp': ['.webp']
  };

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
    setError(null);
  };

  const handleUploadAndExtract = async () => {
    if (files.length === 0) return;

    setUploading(true);
    setProgress(10);
    setError(null);

    try {
      // Upload files
      const uploadPromises = files.map(file => base44.integrations.Core.UploadFile({ file }));
      const uploadResults = await Promise.all(uploadPromises);
      const fileUrls = uploadResults.map(r => r.file_url);
      
      setProgress(40);
      setUploading(false);
      setExtracting(true);

      // Extract maintenance plan data using AI
      const extractionPrompt = `Analise ${files.length > 1 ? 'estes documentos' : 'este documento'} de manual do proprietário de veículo e extraia TODAS as informações de manutenção preventiva.

Para cada manutenção encontrada, extraia:
1. Tipo de manutenção (troca de óleo, filtros, pneus, etc)
2. Descrição detalhada
3. Quilometragem recomendada
4. Intervalo de repetição (km e meses)
5. Prioridade (alta, média, baixa)
6. Especificações técnicas (peças, fluidos, torque)
7. Procedimentos de segurança importantes
8. Referência da página do manual

IMPORTANTE: 
- Extraia o máximo de detalhes técnicos possível
- Inclua especificações de fluidos (viscosidade, tipo, quantidade)
- Liste procedimentos de segurança críticos
- Identifique a página/seção do manual

Retorne um array com TODAS as manutenções encontradas, mesmo que sejam muitas.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: extractionPrompt,
        file_urls: fileUrls,
        response_json_schema: {
          type: "object",
          properties: {
            maintenance_items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  maintenance_type: { type: "string" },
                  description: { type: "string" },
                  recommended_mileage: { type: "number" },
                  recommended_interval_km: { type: "number" },
                  recommended_interval_months: { type: "number" },
                  priority: { type: "string", enum: ["low", "medium", "high"] },
                  technical_specs: {
                    type: "object",
                    properties: {
                      parts: { type: "array", items: { type: "string" } },
                      fluids: { type: "object" },
                      torque_specs: { type: "array", items: { type: "string" } }
                    }
                  },
                  safety_procedures: { type: "array", items: { type: "string" } },
                  manual_page_reference: { type: "string" }
                }
              }
            },
            vehicle_specifications: {
              type: "object",
              properties: {
                engine_type: { type: "string" },
                oil_capacity: { type: "string" },
                fuel_type: { type: "string" },
                tire_pressure: { type: "string" }
              }
            }
          }
        }
      });

      setProgress(70);

      // Save all maintenance plans
      if (response.maintenance_items && response.maintenance_items.length > 0) {
        const planPromises = response.maintenance_items.map(item => 
          base44.entities.MaintenancePlan.create({
            vehicle_id: vehicleId,
            maintenance_type: item.maintenance_type,
            description: item.description,
            recommended_mileage: item.recommended_mileage,
            recommended_interval_km: item.recommended_interval_km,
            recommended_interval_months: item.recommended_interval_months,
            priority: item.priority || 'medium',
            manual_images: fileUrls,
            technical_specs: item.technical_specs,
            safety_procedures: item.safety_procedures,
            manual_page_reference: item.manual_page_reference,
            extracted_from_pdf: files[0].type === 'application/pdf',
            is_completed: false
          })
        );

        await Promise.all(planPromises);
        setProgress(100);
        setResult({
          count: response.maintenance_items.length,
          specs: response.vehicle_specifications
        });

        if (onComplete) {
          onComplete(response);
        }
      } else {
        setError('Nenhuma informação de manutenção foi encontrada nos documentos.');
      }

      setExtracting(false);
    } catch (err) {
      console.error('Error processing manual:', err);
      setError('Erro ao processar o manual. Tente novamente.');
      setUploading(false);
      setExtracting(false);
    }
  };

  const reset = () => {
    setFiles([]);
    setResult(null);
    setError(null);
    setProgress(0);
  };

  if (result) {
    return (
      <Card className="border-green-200 bg-green-50/50">
        <CardContent className="p-6">
          <div className="text-center">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-green-800 mb-2">
              Plano Criado com Sucesso! 🎉
            </h3>
            <p className="text-green-700 mb-4">
              {result.count} {result.count === 1 ? 'item de manutenção foi extraído' : 'itens de manutenção foram extraídos'} do manual
            </p>
            
            {result.specs && Object.keys(result.specs).length > 0 && (
              <div className="bg-white rounded-lg p-4 mb-4 text-left">
                <p className="text-sm font-semibold text-slate-700 mb-2">Especificações do Veículo:</p>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                  {Object.entries(result.specs).map(([key, value]) => (
                    value && <div key={key}>
                      <span className="font-medium">{key.replace(/_/g, ' ')}:</span> {value}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button onClick={reset} variant="outline" className="mt-2">
              Fazer Novo Upload
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (uploading || extracting) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-800 mb-2">
              {uploading ? 'Enviando documentos...' : 'Extraindo informações do manual...'}
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              {extracting && 'A IA está analisando o manual e extraindo especificações técnicas'}
            </p>
            <Progress value={progress} className="mb-2" />
            <p className="text-xs text-slate-500">{progress}% concluído</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-blue-600" />
          Upload de Manual do Proprietário
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800 mb-2">
            📘 Envie o manual do proprietário em PDF ou imagens
          </p>
          <p className="text-xs text-blue-600">
            A IA irá extrair automaticamente:
          </p>
          <ul className="text-xs text-blue-600 mt-2 space-y-1 ml-4">
            <li>• Intervalos de manutenção recomendados</li>
            <li>• Especificações técnicas de peças e fluidos</li>
            <li>• Procedimentos de segurança importantes</li>
            <li>• Referências de páginas do manual</li>
          </ul>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
          <input
            type="file"
            multiple
            accept="application/pdf,image/jpeg,image/png,image/webp"
            onChange={handleFileSelect}
            className="hidden"
            id="manual-upload"
          />
          <label htmlFor="manual-upload" className="cursor-pointer">
            <Upload className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-700 font-medium mb-1">
              Clique para selecionar ou arraste arquivos
            </p>
            <p className="text-xs text-slate-500">
              PDF, JPG, PNG ou WebP (múltiplos arquivos aceitos)
            </p>
          </label>
        </div>

        {files.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700">
              Arquivos selecionados:
            </p>
            {files.map((file, index) => (
              <div key={index} className="flex items-center gap-2 p-2 bg-slate-50 rounded">
                {file.type === 'application/pdf' ? (
                  <FileText className="w-4 h-4 text-red-500" />
                ) : (
                  <Image className="w-4 h-4 text-blue-500" />
                )}
                <span className="text-sm text-slate-700 flex-1 truncate">{file.name}</span>
                <Badge variant="secondary" className="text-xs">
                  {(file.size / 1024 / 1024).toFixed(1)} MB
                </Badge>
              </div>
            ))}
          </div>
        )}

        <Button 
          onClick={handleUploadAndExtract}
          disabled={files.length === 0}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          <Upload className="w-4 h-4 mr-2" />
          Processar Manual com IA
        </Button>
      </CardContent>
    </Card>
  );
};

export default EnhancedManualUploader;