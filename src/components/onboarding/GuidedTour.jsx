import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X, ChevronRight, ChevronLeft } from "lucide-react";
import { motion } from "framer-motion";

const GuidedTour = ({ steps, onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightElement, setHighlightElement] = useState(null);

  useEffect(() => {
    const step = steps[currentStep];
    if (step?.selector) {
      const element = document.querySelector(step.selector);
      if (element) {
        setHighlightElement(element);
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentStep, steps]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onSkip();
  };

  const step = steps[currentStep];

  const getElementPosition = () => {
    if (!highlightElement) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    
    const rect = highlightElement.getBoundingClientRect();
    const isBottom = rect.top < window.innerHeight / 2;
    
    return {
      top: isBottom ? rect.bottom + window.scrollY + 20 : rect.top + window.scrollY - 20,
      left: rect.left + rect.width / 2,
      transform: isBottom ? 'translateX(-50%)' : 'translate(-50%, -100%)',
    };
  };

  return (
    <>
      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 z-50"
        onClick={handleSkip}
      />

      {/* Highlight */}
      {highlightElement && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            position: 'absolute',
            top: highlightElement.getBoundingClientRect().top + window.scrollY,
            left: highlightElement.getBoundingClientRect().left,
            width: highlightElement.getBoundingClientRect().width,
            height: highlightElement.getBoundingClientRect().height,
            border: '3px solid #3b82f6',
            borderRadius: '12px',
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)',
            pointerEvents: 'none',
            zIndex: 51,
          }}
        />
      )}

      {/* Tour Card */}
      <motion.div
        key={currentStep}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        style={{
          position: 'absolute',
          ...getElementPosition(),
          zIndex: 52,
          maxWidth: '400px',
          width: '90vw',
        }}
      >
        <Card className="shadow-2xl border-2 border-blue-500">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{step.icon}</span>
                <h3 className="font-bold text-lg text-slate-800">{step.title}</h3>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSkip}
                className="h-8 w-8 -mt-2 -mr-2"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <p className="text-slate-600 mb-4">{step.description}</p>

            {step.tip && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-blue-700">💡 {step.tip}</p>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex gap-1">
                {steps.map((_, index) => (
                  <div
                    key={index}
                    className={`h-2 w-2 rounded-full transition-all ${
                      index === currentStep ? 'bg-blue-600 w-4' : 'bg-slate-300'
                    }`}
                  />
                ))}
              </div>

              <div className="flex gap-2">
                {currentStep > 0 && (
                  <Button variant="outline" size="sm" onClick={handlePrev}>
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Anterior
                  </Button>
                )}
                <Button size="sm" onClick={handleNext} className="bg-blue-600 hover:bg-blue-700">
                  {currentStep === steps.length - 1 ? 'Concluir' : 'Próximo'}
                  {currentStep < steps.length - 1 && <ChevronRight className="w-4 h-4 ml-1" />}
                </Button>
              </div>
            </div>

            <p className="text-xs text-slate-400 mt-3 text-center">
              Passo {currentStep + 1} de {steps.length}
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </>
  );
};

export default GuidedTour;