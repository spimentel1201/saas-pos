import Dexie, { type Table } from 'dexie';

export interface OfflineProduct {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  price: number;
  costPrice: number;
  taxRate: number;
  categoryId: string;
  categoryName?: string;
  imageUrl?: string;
  stock: Record<string, number>;
  active: boolean;
  cachedAt: number;
}

export interface OfflineCategory {
  id: string;
  name: string;
  description?: string;
  cachedAt: number;
}

export interface PendingMutation {
  id?: number;
  method: 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  path: string;
  body?: unknown;
  createdAt: number;
  retries: number;
}

class POSDatabase extends Dexie {
  products!: Table<OfflineProduct>;
  categories!: Table<OfflineCategory>;
  pendingMutations!: Table<PendingMutation>;

  constructor() {
    super('pos-offline-db');
    this.version(1).stores({
      products: 'id, sku, barcode, categoryId, name',
      categories: 'id, name',
      pendingMutations: '++id, createdAt',
    });
  }
}

export const db = new POSDatabase();

// ---- Products ----

export async function cacheProducts(products: OfflineProduct[]): Promise<void> {
  const now = Date.now();
  const items = products.map((p) => ({ ...p, cachedAt: now }));
  await db.products.bulkPut(items);
}

export async function getCachedProducts(): Promise<OfflineProduct[]> {
  return db.products.toArray();
}

export async function getCachedProduct(id: string): Promise<OfflineProduct | undefined> {
  return db.products.get(id);
}

export async function searchCachedProducts(query: string): Promise<OfflineProduct[]> {
  const q = query.toLowerCase();
  return db.products
    .filter((p) => {
      if (p.name.toLowerCase().includes(q)) return true;
      if (p.sku.toLowerCase().includes(q)) return true;
      if (p.barcode && p.barcode.includes(q)) return true;
      return false;
    })
    .toArray();
}

export async function updateProductStock(
  productId: string,
  branchCode: string,
  delta: number,
): Promise<void> {
  const product = await db.products.get(productId);
  if (!product) return;
  const stock = { ...product.stock };
  stock[branchCode] = (stock[branchCode] ?? 0) + delta;
  await db.products.update(productId, { stock });
}

// ---- Categories ----

export async function cacheCategories(categories: OfflineCategory[]): Promise<void> {
  const now = Date.now();
  const items = categories.map((c) => ({ ...c, cachedAt: now }));
  await db.categories.bulkPut(items);
}

export async function getCachedCategories(): Promise<OfflineCategory[]> {
  return db.categories.toArray();
}

// ---- Pending Mutations ----

export async function addPendingMutation(
  mutation: Omit<PendingMutation, 'id' | 'createdAt' | 'retries'>,
): Promise<number> {
  return db.pendingMutations.add({
    ...mutation,
    createdAt: Date.now(),
    retries: 0,
  });
}

export async function getPendingMutations(): Promise<PendingMutation[]> {
  return db.pendingMutations.orderBy('createdAt').toArray();
}

export async function getPendingMutationsCount(): Promise<number> {
  return db.pendingMutations.count();
}

export async function removePendingMutation(id: number): Promise<void> {
  await db.pendingMutations.delete(id);
}

export async function incrementRetries(id: number): Promise<void> {
  const mutation = await db.pendingMutations.get(id);
  if (mutation) {
    await db.pendingMutations.update(id, { retries: mutation.retries + 1 });
  }
}

export async function clearPendingMutations(): Promise<void> {
  await db.pendingMutations.clear();
}
