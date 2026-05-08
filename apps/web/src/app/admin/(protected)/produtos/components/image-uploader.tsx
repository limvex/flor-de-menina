'use client';

import { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import Image from 'next/image';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  horizontalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { X, Upload, Loader2 } from 'lucide-react';
import { uploadsApi } from '@/lib/api/uploads';
import { cn } from '@/lib/utils';

export interface UploadedImageItem {
  id: string;
  thumbUrl: string;
  cardUrl: string;
  fullUrl: string;
  preview?: string;
  uploading?: boolean;
}

interface ImageUploaderProps {
  productId: string;
  initialImages?: UploadedImageItem[];
  onChange: (images: UploadedImageItem[]) => void;
}

export function ImageUploader({ productId, initialImages = [], onChange }: ImageUploaderProps) {
  const [images, setImages] = useState<UploadedImageItem[]>(initialImages);
  const [error, setError] = useState<string | null>(null);

  // Sincroniza parent sempre que images mudar (exceto uploading)
  useEffect(() => {
    onChange(images.filter((img) => !img.uploading));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setError(null);

      const tempItems: UploadedImageItem[] = acceptedFiles.map((f) => ({
        id: `temp-${crypto.randomUUID()}`,
        thumbUrl: URL.createObjectURL(f),
        cardUrl: URL.createObjectURL(f),
        fullUrl: URL.createObjectURL(f),
        preview: URL.createObjectURL(f),
        uploading: true,
      }));

      setImages((prev) => [...prev, ...tempItems]);

      await Promise.all(
        acceptedFiles.map(async (file, idx) => {
          const tempId = tempItems[idx].id;
          try {
            const result = await uploadsApi.uploadProductImage(productId, file);
            setImages((prev) =>
              prev.map((img) =>
                img.id === tempId
                  ? {
                      id: result.id,
                      thumbUrl: result.urls.thumb,
                      cardUrl: result.urls.card,
                      fullUrl: result.urls.full,
                      uploading: false,
                    }
                  : img,
              ),
            );
          } catch {
            setError('Erro ao fazer upload de uma ou mais imagens');
            setImages((prev) => prev.filter((img) => img.id !== tempId));
          }
        }),
      );
    },
    [productId],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': [], 'image/png': [], 'image/webp': [] },
    multiple: true,
  });

  const handleDelete = async (imageId: string) => {
    if (!imageId.startsWith('temp-')) {
      try {
        await uploadsApi.deleteProductImage(imageId);
      } catch {
        setError('Erro ao remover imagem');
        return;
      }
    }
    setImages((prev) => prev.filter((img) => img.id !== imageId));
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setImages((prev) => {
      const oldIdx = prev.findIndex((img) => img.id === active.id);
      const newIdx = prev.findIndex((img) => img.id === over.id);
      const reordered = arrayMove(prev, oldIdx, newIdx);
      const ids = reordered.filter((img) => !img.uploading).map((img) => img.id);
      uploadsApi.reorderImages(productId, ids).catch(() => null);
      return reordered;
    });
  };

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-md p-6 text-center cursor-pointer transition-colors',
          isDragActive ? 'border-flor-500 bg-flor-50' : 'border-bege-300 hover:border-flor-400',
        )}
      >
        <input {...getInputProps()} />
        <Upload size={24} className="mx-auto mb-2 text-flor-400" />
        <p className="text-sm text-muted-foreground">
          {isDragActive ? 'Solte as imagens aqui' : 'Arraste imagens ou clique para selecionar'}
        </p>
        <p className="text-xs text-muted-foreground mt-1">JPG, PNG ou WebP — mínimo 600×800px</p>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      {images.length > 0 && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={images.map((i) => i.id)} strategy={horizontalListSortingStrategy}>
            <div className="flex flex-wrap gap-3">
              {images.map((img, idx) => (
                <SortableImage
                  key={img.id}
                  image={img}
                  index={idx}
                  onDelete={() => handleDelete(img.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

function SortableImage({
  image,
  index,
  onDelete,
}: {
  image: UploadedImageItem;
  index: number;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: image.id,
  });

  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="relative group">
      {index === 0 && (
        <span className="absolute top-1 left-1 z-10 bg-flor-600 text-white text-[10px] px-1 rounded">
          Capa
        </span>
      )}
      <Image
        src={image.preview ?? image.thumbUrl}
        alt="preview"
        width={80}
        height={80}
        className="rounded object-cover w-20 h-20"
      />
      {image.uploading && (
        <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded">
          <Loader2 size={16} className="animate-spin text-flor-600" />
        </div>
      )}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X size={10} />
      </button>
    </div>
  );
}
