import type { HomePageContentResponse, UpdateHomePageContentInput } from '@flor/types';
import { ApiError, messageForHttpStatus, readErrorFromResponse } from '@/lib/errors';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333';

export async function fetchHomeContent(): Promise<HomePageContentResponse> {
  try {
    const res = await fetch(`${API_URL}/home-content`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return emptyContent();
    return res.json() as Promise<HomePageContentResponse>;
  } catch {
    return emptyContent();
  }
}

function emptyContent(): HomePageContentResponse {
  return {
    bannerImageUrl: null,
    bannerTitle: null,
    bannerSubtitle: null,
    bannerButtonText: null,
    bannerButtonUrl: null,
    aboutTitle: null,
    aboutText: null,
    whatsappNumber: null,
    instagramUrl: null,
    updatedAt: new Date().toISOString(),
  };
}

async function adminFetch<T>(path: string, token: string, options?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Cookie: `access_token=${token}`,
        ...options?.headers,
      },
      credentials: 'include',
      cache: 'no-store',
    });
  } catch (cause) {
    if (cause instanceof TypeError) {
      throw new ApiError(messageForHttpStatus(0), 0, { cause });
    }
    throw cause;
  }

  if (!res.ok) {
    await readErrorFromResponse(res);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export async function fetchAdminHomeContent(token: string): Promise<HomePageContentResponse> {
  return adminFetch<HomePageContentResponse>('/home-content', token);
}

export async function updateHomeContent(
  token: string,
  data: UpdateHomePageContentInput,
): Promise<HomePageContentResponse> {
  return adminFetch<HomePageContentResponse>('/home-content/admin', token, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export interface UploadBannerError {
  error: 'INVALID_FORMAT' | 'FILE_TOO_LARGE' | 'UPLOAD_FAILED' | 'NETWORK_ERROR';
  maxMb?: number;
}

export function uploadBannerImage(
  file: File,
  onProgress?: (pct: number) => void,
): Promise<{ url: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('file', file);

    xhr.open('POST', `${API_URL}/home-content/admin/banner-image`);
    xhr.withCredentials = true;

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText) as { url: string });
      } else {
        try {
          const body = JSON.parse(xhr.responseText) as UploadBannerError;
          reject(body);
        } catch {
          reject({ error: 'UPLOAD_FAILED' } satisfies UploadBannerError);
        }
      }
    };

    xhr.onerror = () => reject({ error: 'NETWORK_ERROR' } satisfies UploadBannerError);
    xhr.send(formData);
  });
}
