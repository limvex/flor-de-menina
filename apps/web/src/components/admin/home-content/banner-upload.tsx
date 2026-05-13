'use client';

import { useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import { Upload, X, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { uploadBannerImage, type UploadBannerError } from '@/lib/api/home-content';

interface BannerUploadProps {
  currentUrl: string | null;
  onUploadComplete: (url: string) => void;
  onError: (msg: string) => void;
}

export function BannerUpload({ currentUrl, onUploadComplete, onError }: BannerUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  function uploadError(err: UploadBannerError) {
    if (err.error === 'FILE_TOO_LARGE') {
      onError(`Arquivo muito grande. Máximo ${err.maxMb ?? 5} MB.`);
    } else if (err.error === 'INVALID_FORMAT') {
      onError('Formato inválido. Use JPG, PNG ou WebP.');
    } else {
      onError('Erro ao enviar a imagem. Tente novamente.');
    }
  }

  const handleFile = useCallback(
    async (file: File) => {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        onError('Formato inválido. Use JPG, PNG ou WebP.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        onError('Arquivo muito grande. Máximo 5 MB.');
        return;
      }

      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
      setProgress(0);

      try {
        const result = await uploadBannerImage(file, (pct) => setProgress(pct));
        onUploadComplete(result.url);
      } catch (err) {
        setPreview(null);
        uploadError(err as UploadBannerError);
      } finally {
        setProgress(null);
        URL.revokeObjectURL(objectUrl);
      }
    },
    [onError, onUploadComplete],
  );

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
    e.target.value = '';
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) void handleFile(file);
  }

  const displayUrl = preview ?? currentUrl;

  return (
    <div className="space-y-3">
      <div
        className={cn(
          'relative flex min-h-[140px] cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed transition-colors',
          isDragging ? 'border-flor-400 bg-flor-50' : 'border-flor-200 hover:border-flor-300',
          progress !== null && 'pointer-events-none opacity-70',
        )}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        aria-label="Área de upload do banner"
      >
        {displayUrl ? (
          <>
            <Image
              src={displayUrl}
              alt="Preview do banner"
              width={800}
              height={220}
              className="max-h-[220px] w-full rounded-md object-cover"
              unoptimized={displayUrl.startsWith('blob:')}
            />
            {preview && (
              <button
                type="button"
                className="absolute right-2 top-2 rounded-full bg-white/80 p-1 text-flor-600 shadow hover:bg-white"
                onClick={(e) => {
                  e.stopPropagation();
                  setPreview(null);
                }}
                aria-label="Remover preview"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </>
        ) : (
          <>
            <ImageIcon className="h-8 w-8 text-flor-300" aria-hidden />
            <p className="text-center text-sm text-flor-500">
              Arraste uma imagem ou{' '}
              <span className="font-medium text-flor-700 underline">clique para selecionar</span>
            </p>
          </>
        )}

        {progress !== null && (
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-lg bg-white/80">
            <div className="h-2 w-48 overflow-hidden rounded-full bg-flor-100">
              <div
                className="h-full bg-flor-600 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-flor-500">{progress}%</p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={progress !== null}
          className="gap-2"
        >
          <Upload className="h-3.5 w-3.5" />
          {displayUrl ? 'Trocar imagem' : 'Selecionar imagem'}
        </Button>
        <p className="text-xs text-flor-400">
          JPG, PNG ou WebP · Máximo 5 MB · Recomendado: 1440×600 px
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={onInputChange}
        aria-hidden
      />
    </div>
  );
}
