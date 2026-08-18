const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? '';
const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? '';

const CLOUDINARY_API = `https://api.cloudinary.com/v1_1/${cloudName}`;

export interface UploadResult {
  url: string;
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
  format: string;
}

/** Upload directo a Cloudinary desde el frontend usando signed upload preset */
export async function uploadImage(file: File, folder?: string): Promise<UploadResult> {
  if (!cloudName) {
    throw new Error(
      'Cloudinary no está configurado. Configura NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME en .env',
    );
  }
  if (!uploadPreset) {
    throw new Error(
      'Cloudinary upload preset no está configurado. Configura NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET en .env',
    );
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  if (folder) formData.append('folder', folder);

  const res = await fetch(`${CLOUDINARY_API}/image/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    const msg = err?.error?.message ?? `Error de Cloudinary (${res.status})`;

    if (msg.includes('permissions') || msg.includes('unsigned')) {
      throw new Error(
        `El preset "${uploadPreset}" requiere permisos. Crea un upload preset UNSIGNED en Cloudinary Dashboard → Settings → Upload.`,
      );
    }
    throw new Error(msg);
  }

  return res.json();
}

/** Obtener URL optimizada para un public_id */
export function imageUrl(publicId: string, transforms?: string): string {
  const base = `https://res.cloudinary.com/${cloudName}/image/upload`;
  if (transforms) return `${base}/${transforms}/${publicId}`;
  return `${base}/${publicId}`;
}

/** URL para thumbnail (150x150, face detection) */
export function thumbnailUrl(publicId: string): string {
  return imageUrl(publicId, 'c_fill,f_auto,q_auto,w_150,h_150,g_auto');
}
