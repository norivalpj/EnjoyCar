import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { X, Upload, Loader2, ZoomIn } from "lucide-react";
import { base44 } from '@/api/base44Client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const PhotoGallery = ({ photos = [], onPhotosChange, maxPhotos = 8, label = "Fotos" }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState(null);

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const remainingSlots = maxPhotos - photos.length;
    const filesToUpload = files.slice(0, remainingSlots);

    setIsUploading(true);
    try {
      const uploadPromises = filesToUpload.map(file => 
        base44.integrations.Core.UploadFile({ file })
      );
      const results = await Promise.all(uploadPromises);
      const newUrls = results.map(r => r.file_url);
      onPhotosChange([...photos, ...newUrls]);
    } catch (error) {
      console.error('Error uploading photos:', error);
    }
    setIsUploading(false);
  };

  const removePhoto = (index) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    onPhotosChange(newPhotos);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-700">
          {label} ({photos.length}/{maxPhotos})
        </label>
        {photos.length < maxPhotos && (
          <label>
            <input 
              type="file" 
              accept="image/*" 
              multiple
              className="hidden" 
              onChange={handlePhotoUpload}
              disabled={isUploading}
            />
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              className="cursor-pointer" 
              asChild
              disabled={isUploading}
            >
              <span>
                {isUploading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                Adicionar
              </span>
            </Button>
          </label>
        )}
      </div>

      {photos.length > 0 ? (
        <div className="grid grid-cols-4 gap-3">
          {photos.map((photo, index) => (
            <div key={index} className="relative group">
              <img 
                src={photo} 
                alt={`Foto ${index + 1}`}
                className="w-full h-24 object-cover rounded-lg border cursor-pointer"
                onClick={() => setPreviewPhoto(photo)}
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                <Button 
                  type="button"
                  variant="secondary" 
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setPreviewPhoto(photo)}
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
                <Button 
                  type="button"
                  variant="secondary" 
                  size="icon"
                  className="h-7 w-7 text-red-500 hover:text-red-600"
                  onClick={() => removePhoto(index)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="border-2 border-dashed border-slate-200 rounded-lg p-8 text-center">
          <p className="text-sm text-slate-400">Nenhuma foto adicionada</p>
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={!!previewPhoto} onOpenChange={() => setPreviewPhoto(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Visualizar Foto</DialogTitle>
          </DialogHeader>
          {previewPhoto && (
            <img 
              src={previewPhoto} 
              alt="Preview"
              className="w-full rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PhotoGallery;