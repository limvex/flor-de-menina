'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  MIN_PRODUCT_IMAGE_HEIGHT,
  MIN_PRODUCT_IMAGE_WIDTH,
  measureImageFile,
  snapshotImageFile,
} from '@/lib/prepare-image-upload';
import { cn } from '@/lib/utils';

export interface PendingPhoto {
  id: string;
  file: File;
  previewUrl: string;
}

interface PhotoUploaderProps {
  files: PendingPhoto[];
  onChange: (files: PendingPhoto[]) => void;
  disabled?: boolean;
}

async function fileToPending(source: File): Promise<PendingPhoto> {
  const file = await snapshotImageFile(source);
  return {
    id: `${file.name}-${file.size}-${file.lastModified}`,
    file,
    previewUrl: URL.createObjectURL(file),
  };
}

export function PhotoUploader({ files, onChange, disabled }: PhotoUploaderProps) {
  const [processing, setProcessing] = useState(false);

  const onDrop = useCallback(
    async (accepted: File[]) => {
      if (accepted.length === 0 || disabled) return;
      setProcessing(true);
      try {
        const added: PendingPhoto[] = [];

        for (const raw of accepted) {
          try {
            const { width, height } = await measureImageFile(raw);

            if (width < MIN_PRODUCT_IMAGE_WIDTH || height < MIN_PRODUCT_IMAGE_HEIGHT) {
              toast.error(
                `A foto ${raw.name} é muito pequena (${width}×${height}px). Use imagens de no mínimo ${MIN_PRODUCT_IMAGE_WIDTH}×${MIN_PRODUCT_IMAGE_HEIGHT}px para boa qualidade na vitrine.`,
              );
              continue;
            }

            const pending = await fileToPending(raw);
            if (
              !files.some((p) => p.id === pending.id) &&
              !added.some((p) => p.id === pending.id)
            ) {
              added.push(pending);
            }
          } catch {
            toast.error(`Não foi possível ler a foto ${raw.name}.`);
          }
        }

        if (added.length > 0) {
          onChange([...files, ...added]);
        }
      } finally {
        setProcessing(false);
      }
    },
    [files, onChange, disabled],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (accepted) => void onDrop(accepted),
    accept: { 'image/jpeg': [], 'image/png': [], 'image/webp': [] },
    multiple: true,
    disabled: disabled || processing,
  });

  const filesRef = useRef(files);
  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  useEffect(() => {
    return () => {
      for (const f of filesRef.current) {
        URL.revokeObjectURL(f.previewUrl);
      }
    };
  }, []);

  const removeAt = (index: number) => {
    const removed = files[index];
    if (removed) URL.revokeObjectURL(removed.previewUrl);
    onChange(files.filter((_, i) => i !== index));
  };

  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-serif text-lg text-flor-800">Fotos</h2>
        <p className="text-sm text-muted-foreground mt-1">
          A primeira foto é a que aparece na vitrine. Use boa qualidade.
        </p>
      </div>

      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 sm:p-10 text-center cursor-pointer transition-colors w-full',
          (disabled || processing) && 'pointer-events-none opacity-60',
          isDragActive
            ? 'border-flor-500 bg-flor-50'
            : 'border-bege-300 hover:border-flor-400 bg-white',
        )}
      >
        <input {...getInputProps()} />
        <Upload size={28} className="mx-auto mb-3 text-flor-400" />
        <p className="text-sm font-medium text-flor-800">
          {processing
            ? 'Preparando fotos…'
            : isDragActive
              ? 'Solte as fotos aqui'
              : 'Arraste fotos ou toque para escolher'}
        </p>
        <p className="text-xs text-muted-foreground mt-2">JPG, PNG ou WebP</p>
        <p className="text-xs text-stone-500 mt-3">
          Dica: a primeira foto vira a capa do produto na vitrine.
        </p>
      </div>

      <p className="text-xs text-stone-500">
        Tamanho mínimo: {MIN_PRODUCT_IMAGE_WIDTH}×{MIN_PRODUCT_IMAGE_HEIGHT}px (ideal: 1080×1440px
        ou maior)
      </p>

      {files.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {files.map((item, index) => (
            <div
              key={item.id}
              className="relative aspect-[3/4] overflow-hidden rounded-md border border-stone-200 bg-stone-50"
            >
              {index === 0 && (
                <div className="absolute left-2 top-2 z-10 rounded bg-black/70 px-2 py-1 text-xs text-white">
                  Foto principal
                </div>
              )}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.previewUrl}
                alt={`Foto ${index + 1}`}
                className="absolute inset-0 h-full w-full object-cover"
              />
              <button
                type="button"
                disabled={disabled}
                onClick={() => removeAt(index)}
                className="absolute right-2 top-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                aria-label={`Remover foto ${item.file.name}`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
