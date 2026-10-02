/**
 * Normaliza la imagen de un producto a una URL utilizable en <img src>.
 *
 * La API devuelve `images` como array de objetos `{ publicId, url, isPrimary }`
 * (no de strings) y, desde el DTO, también un `imageUrl` de conveniencia.
 * Castear `images[0]` a string producía `src="[object Object]"`.
 */

export interface ProductImageLike {
  publicId?: string;
  url?: string;
  isPrimary?: boolean;
}

export interface ProductWithImage {
  images?: readonly unknown[] | null;
  imageUrl?: string | null;
}

function toImage(raw: unknown): ProductImageLike | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const img = raw as ProductImageLike;
  return typeof img.url === 'string' && img.url.length > 0 ? img : undefined;
}

export function productImage(product: ProductWithImage): ProductImageLike | undefined {
  const images = product.images;
  if (Array.isArray(images) && images.length > 0) {
    const candidates = images.map(toImage).filter((img): img is ProductImageLike => !!img);
    const primary = candidates.find((img) => img.isPrimary) ?? candidates[0];
    if (primary) return primary;
  }
  return undefined;
}

export function productImageUrl(product: ProductWithImage): string | undefined {
  return productImage(product)?.url ?? product.imageUrl ?? undefined;
}
