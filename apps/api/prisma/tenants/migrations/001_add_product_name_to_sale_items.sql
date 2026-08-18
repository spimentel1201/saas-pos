-- Migracion: agregar product_name y product_sku a sale_items
-- Ejecutar contra cada schema de tenant existente.

ALTER TABLE sale_items
  ADD COLUMN IF NOT EXISTS product_name text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS product_sku text;
