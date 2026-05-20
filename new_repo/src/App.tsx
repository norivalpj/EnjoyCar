import React from 'react';
import { FileUp } from 'lucide-react';

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileUp size={32} />
        </div>
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight mb-2">
          Base44 App
        </h1>
        <p className="text-gray-500 mb-6">
          Parece que o conteúdo do arquivo não foi enviado completamente. Por favor, cole o conteúdo do arquivo no chat ou tente fazer o upload novamente.
        </p>
      </div>
    </div>
  );
}
