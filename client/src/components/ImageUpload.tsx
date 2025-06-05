import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { Upload, Image, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface ImageUploadProps {
  onImageUploaded: (imageUrl: string) => void;
  currentImageUrl?: string;
  className?: string;
}

export function ImageUpload({ onImageUploaded, currentImageUrl, className }: ImageUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(currentImageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const uploadImage = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Erro",
        description: "Por favor, selecione apenas arquivos de imagem",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB
      toast({
        title: "Erro",
        description: "A imagem deve ter no máximo 10MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
        credentials: 'include', // Para incluir cookies de sessão
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Erro ao fazer upload');
      }

      setPreviewImage(result.imageUrl);
      onImageUploaded(result.imageUrl);
      
      toast({
        title: "Sucesso",
        description: "Imagem enviada com sucesso!",
      });
    } catch (error) {
      console.error('Erro no upload:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao fazer upload da imagem",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      uploadImage(files[0]);
    }
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      uploadImage(files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const removeImage = () => {
    setPreviewImage(null);
    onImageUploaded('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all
          ${isDragOver ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-gray-400'}
          ${isUploading ? 'pointer-events-none opacity-60' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {isUploading ? (
          <div className="flex flex-col items-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
            <p className="text-sm text-gray-600">Enviando imagem...</p>
          </div>
        ) : previewImage ? (
          <div className="relative">
            <img
              src={previewImage}
              alt="Preview"
              className="max-w-full max-h-48 mx-auto rounded-lg object-cover"
            />
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2"
              onClick={(e) => {
                e.stopPropagation();
                removeImage();
              }}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <Upload className="w-8 h-8 text-gray-400 mb-2" />
            <p className="text-sm text-gray-600 mb-1">
              Arraste uma imagem aqui ou clique para selecionar
            </p>
            <p className="text-xs text-gray-400">
              PNG, JPG, JPEG até 10MB
            </p>
          </div>
        )}
      </div>

      {previewImage && (
        <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <Image className="w-4 h-4 text-green-600 mr-2" />
            <span className="text-sm text-green-700">Imagem carregada com sucesso</span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={removeImage}
            className="text-green-600 hover:text-green-700"
          >
            Remover
          </Button>
        </div>
      )}
    </div>
  );
} 