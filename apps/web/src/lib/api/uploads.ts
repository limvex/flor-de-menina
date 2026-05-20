import { snapshotImageFile } from '@/lib/prepare-image-upload';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333';

export interface UploadedImage {
  id: string;
  urls: {
    thumb: string;
    card: string;
    full: string;
  };
}

export const uploadsApi = {
  uploadProductImage: async (productId: string, file: File): Promise<UploadedImage> => {
    const prepared = await snapshotImageFile(file);

    const formData = new FormData();
    formData.append('file', prepared, prepared.name);

    const res = await fetch(`${API_URL}/uploads/product-image/${productId}`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error((err as { message?: string }).message ?? res.statusText);
    }

    return res.json() as Promise<UploadedImage>;
  },

  deleteProductImage: async (imageId: string): Promise<void> => {
    const res = await fetch(`${API_URL}/uploads/product-image/${imageId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Erro ao deletar imagem');
  },

  reorderImages: async (productId: string, imageIds: string[]): Promise<void> => {
    const res = await fetch(`${API_URL}/uploads/product-image/${productId}/reorder`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageIds }),
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Erro ao reordenar imagens');
  },
};
