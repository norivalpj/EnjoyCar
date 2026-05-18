import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Settings, Droplet, Shield, BookOpen } from "lucide-react";

const TechnicalSpecsDisplay = ({ plan }) => {
  if (!plan.technical_specs && !plan.safety_procedures && !plan.manual_page_reference) {
    return null;
  }

  return (
    <div className="mt-4 space-y-3">
      {/* Technical Specifications */}
      {plan.technical_specs && (
        <Card className="bg-slate-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Settings className="w-4 h-4 text-slate-600" />
              Especificações Técnicas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {plan.technical_specs.parts && plan.technical_specs.parts.length > 0 && (
              <div>
                <p className="text-xs font-medium text-slate-600 mb-1">Peças:</p>
                <div className="flex flex-wrap gap-1">
                  {plan.technical_specs.parts.map((part, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {part}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {plan.technical_specs.fluids && Object.keys(plan.technical_specs.fluids).length > 0 && (
              <div>
                <p className="text-xs font-medium text-slate-600 mb-1 flex items-center gap-1">
                  <Droplet className="w-3 h-3" />
                  Fluidos:
                </p>
                <div className="text-xs text-slate-700 space-y-1 ml-4">
                  {Object.entries(plan.technical_specs.fluids).map(([key, value]) => (
                    <div key={key}>
                      <span className="font-medium">{key}:</span> {value}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {plan.technical_specs.torque_specs && plan.technical_specs.torque_specs.length > 0 && (
              <div>
                <p className="text-xs font-medium text-slate-600 mb-1">Torque:</p>
                <div className="text-xs text-slate-700 space-y-1 ml-4">
                  {plan.technical_specs.torque_specs.map((spec, i) => (
                    <div key={i}>• {spec}</div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Safety Procedures */}
      {plan.safety_procedures && plan.safety_procedures.length > 0 && (
        <Card className="bg-amber-50 border-amber-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-600" />
              Procedimentos de Segurança
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ul className="text-xs text-amber-900 space-y-2">
              {plan.safety_procedures.map((procedure, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-amber-600 mt-0.5">⚠</span>
                  <span>{procedure}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Manual Reference */}
      {plan.manual_page_reference && (
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <BookOpen className="w-3 h-3" />
          <span>Referência do manual: {plan.manual_page_reference}</span>
          {plan.extracted_from_pdf && (
            <Badge variant="outline" className="text-xs">PDF</Badge>
          )}
        </div>
      )}
    </div>
  );
};

export default TechnicalSpecsDisplay;