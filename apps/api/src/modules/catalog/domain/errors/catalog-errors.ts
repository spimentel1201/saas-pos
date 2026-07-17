export class ProductNotFoundError extends Error {
  constructor(id: string) {
    super(`Producto no encontrado: ${id}`);
    this.name = 'ProductNotFoundError';
  }
}

export class ProductSkuAlreadyExistsError extends Error {
  constructor(sku: string) {
    super(`SKU ya existe: ${sku}`);
    this.name = 'ProductSkuAlreadyExistsError';
  }
}

export class ProductBarcodeAlreadyExistsError extends Error {
  constructor(barcode: string) {
    super(`Código de barras ya existe: ${barcode}`);
    this.name = 'ProductBarcodeAlreadyExistsError';
  }
}

export class CategoryNotFoundError extends Error {
  constructor(id: string) {
    super(`Categoría no encontrada: ${id}`);
    this.name = 'CategoryNotFoundError';
  }
}

export class CategoryHasChildrenError extends Error {
  constructor(id: string) {
    super(`La categoría tiene subcategorías, no se puede eliminar: ${id}`);
    this.name = 'CategoryHasChildrenError';
  }
}

export class ProductHasVariantsError extends Error {
  constructor(id: string) {
    super(`El producto tiene variantes, no se puede eliminar: ${id}`);
    this.name = 'ProductHasVariantsError';
  }
}
