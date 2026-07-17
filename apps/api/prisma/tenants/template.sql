-- Template SQL para crear el schema de un nuevo tenant.
-- La API ejecuta este script contra {DATABASE_URL} con el nombre de schema
-- sustituido en lugar de la variable :schema_name.
--
-- En ejecucion se usa `psql -v schema_name=tenant_xxx -f template.sql`.
-- Las tablas usan `search_path` relativo al schema recien creado.

CREATE SCHEMA IF NOT EXISTS :schema_name;
SET search_path TO :schema_name;

-- --------------------------------------------------------
--  SUCURSALES
-- --------------------------------------------------------

CREATE TABLE branches (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  code        text NOT NULL,
  address     text,
  city        text,
  timezone    text NOT NULL DEFAULT 'America/Lima',
  active      boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX idx_branches_code ON branches(code);

-- --------------------------------------------------------
--  CATALOGO
-- --------------------------------------------------------

CREATE TABLE categories (
  id          text PRIMARY KEY,
  parent_id   text REFERENCES categories(id) ON DELETE SET NULL,
  name        text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_categories_parent ON categories(parent_id);

CREATE TABLE taxes (
  id    text PRIMARY KEY,
  name  text NOT NULL,
  rate  numeric(5,4) NOT NULL,
  type  text NOT NULL CHECK (type IN ('PERCENT','EXEMPT','FIXED')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE products (
  id              text PRIMARY KEY,
  sku             text NOT NULL,
  barcode         text,
  name            text NOT NULL,
  description     text,
  category_id     text REFERENCES categories(id) ON DELETE SET NULL,
  tax_id          text REFERENCES taxes(id),
  cost            numeric(14,4) NOT NULL DEFAULT 0,
  price           numeric(14,4) NOT NULL DEFAULT 0,
  type            text NOT NULL DEFAULT 'GOOD' CHECK (type IN ('GOOD','SERVICE','BUNDLE')),
  track_stock     boolean NOT NULL DEFAULT true,
  is_active       boolean NOT NULL DEFAULT true,
  image_public_id text,
  image_url       text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uq_products_sku ON products(sku);
CREATE UNIQUE INDEX uq_products_barcode ON products(barcode) WHERE barcode IS NOT NULL;
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active ON products(is_active);

CREATE TABLE product_variants (
  id          text PRIMARY KEY,
  product_id  text NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku         text NOT NULL,
  barcode     text,
  attributes  jsonb NOT NULL DEFAULT '{}',
  price       numeric(14,4) NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uq_variants_sku ON product_variants(sku);
CREATE INDEX idx_variants_product ON product_variants(product_id);

-- --------------------------------------------------------
--  CLIENTES
-- --------------------------------------------------------

CREATE TABLE customers (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  email           text,
  phone           text,
  type            text NOT NULL DEFAULT 'INDIVIDUAL' CHECK (type IN ('INDIVIDUAL','BUSINESS')),
  document_type   text CHECK (document_type IN ('DNI','RUC','CE','PASSPORT')),
  document_number text,
  address         text,
  city            text,
  state           text,
  zip_code        text,
  tax_id          text,
  credit_balance  numeric(14,4) NOT NULL DEFAULT 0,
  notes           text,
  active          boolean NOT NULL DEFAULT true,
  created_by      text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX idx_customers_document ON customers(document_type, document_number) WHERE document_number IS NOT NULL;
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_name ON customers USING gin(to_tsvector('spanish', name));

-- --------------------------------------------------------
--  CONFIGURACION
-- --------------------------------------------------------

CREATE TABLE tenant_settings (
  id          serial PRIMARY KEY,
  key         text UNIQUE NOT NULL,
  value       jsonb NOT NULL,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

INSERT INTO tenant_settings (key, value) VALUES
  ('currency', '"PEN"'),
  ('timezone', '"America/Lima"'),
  ('tax_included', 'true'),
  ('ticket_header', '{"business_name": "", "logo_url": "", "address": "", "phone": ""}'),
  ('ticket_footer', '{"message": "Gracias por su compra!", "return_policy": ""}'),
  ('brand_color', '"#3B82F6"');

-- --------------------------------------------------------
--  INVENTARIO
-- --------------------------------------------------------

CREATE TABLE inventory_stocks (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  branch_id    uuid NOT NULL REFERENCES branches(id),
  product_id   text NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  qty          numeric(14,4) NOT NULL DEFAULT 0,
  reserved     numeric(14,4) NOT NULL DEFAULT 0,
  min_qty      numeric(14,4) NOT NULL DEFAULT 0,
  max_qty      numeric(14,4) NOT NULL DEFAULT 0,
  avg_cost     numeric(14,4) NOT NULL DEFAULT 0,
  version      integer NOT NULL DEFAULT 1,
  updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uq_stock_branch_product ON inventory_stocks(branch_id, product_id);

CREATE TABLE inventory_movements (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  stock_id      bigint NOT NULL REFERENCES inventory_stocks(id) ON DELETE CASCADE,
  type          text NOT NULL CHECK (type IN ('PURCHASE','SALE','ADJUSTMENT','TRANSFER','RETURN','LOSS')),
  delta         numeric(14,4) NOT NULL,
  reason        text,
  ref           text,
  branch_id     uuid NOT NULL,
  user_id       text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_movements_stock ON inventory_movements(stock_id, created_at DESC);
CREATE INDEX idx_movements_branch_date ON inventory_movements(branch_id, created_at DESC);

CREATE TABLE stock_transfers (
  id              text PRIMARY KEY,
  from_branch_id  uuid NOT NULL,
  to_branch_id    uuid NOT NULL,
  status          text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','SHIPPED','RECEIVED','CANCELED')),
  items           jsonb NOT NULL,
  created_by      text NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_transfers_status ON stock_transfers(status);

-- --------------------------------------------------------
--  COMPRAS
-- --------------------------------------------------------

CREATE TABLE suppliers (
  id        text PRIMARY KEY,
  name      text NOT NULL,
  contact   text,
  tax_id    text,
  email     text,
  phone     text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE purchase_orders (
  id            text PRIMARY KEY,
  branch_id     uuid NOT NULL,
  supplier_id   text NOT NULL REFERENCES suppliers(id),
  status        text NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','SENT','PARTIAL','RECEIVED','CANCELED')),
  total         numeric(14,4) NOT NULL DEFAULT 0,
  items         jsonb NOT NULL,
  created_by    text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_po_status ON purchase_orders(status);

CREATE TABLE purchase_receipts (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  po_id         text NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  received_at   timestamptz NOT NULL DEFAULT now(),
  received_by   text NOT NULL,
  items         jsonb NOT NULL
);
CREATE INDEX idx_receipts_po ON purchase_receipts(po_id);

-- --------------------------------------------------------
--  VENTAS / POS
-- --------------------------------------------------------

CREATE TABLE sales (
  id                  text PRIMARY KEY,
  branch_id           uuid NOT NULL,
  user_id             text NOT NULL,
  cashier_session_id  bigint,
  number_seq          integer NOT NULL,
  customer_id         uuid REFERENCES customers(id),
  subtotal            numeric(14,4) NOT NULL,
  tax                 numeric(14,4) NOT NULL DEFAULT 0,
  discount            numeric(14,4) NOT NULL DEFAULT 0,
  total               numeric(14,4) NOT NULL,
  status              text NOT NULL DEFAULT 'COMPLETED' CHECK (status IN ('COMPLETED','VOID','RETURNED','PARTIAL_RETURN')),
  meta                jsonb NOT NULL DEFAULT '{}',
  created_at          timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uq_sales_number_seq_day ON sales(branch_id, created_at, number_seq);
CREATE INDEX idx_sales_created ON sales(branch_id, created_at DESC);
CREATE INDEX idx_sales_status ON sales(status);
CREATE INDEX idx_sales_customer ON sales(customer_id) WHERE customer_id IS NOT NULL;

CREATE TABLE sale_items (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  sale_id       text NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id    text NOT NULL,
  variant_id    text,
  qty           numeric(14,4) NOT NULL,
  unit_price    numeric(14,4) NOT NULL,
  tax_amount    numeric(14,4) NOT NULL DEFAULT 0,
  discount      numeric(14,4) NOT NULL DEFAULT 0,
  total         numeric(14,4) NOT NULL
);
CREATE INDEX idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX idx_sale_items_product ON sale_items(product_id);

CREATE TABLE sale_payments (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  sale_id       text NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  method        text NOT NULL CHECK (method IN ('CASH','CARD','TRANSFER','CREDIT','MIXED')),
  amount        numeric(14,4) NOT NULL,
  ref           text
);
CREATE INDEX idx_sale_payments_sale ON sale_payments(sale_id);

CREATE TABLE returns (
  id          text PRIMARY KEY,
  sale_id     text NOT NULL REFERENCES sales(id),
  reason      text,
  items       jsonb NOT NULL,
  total       numeric(14,4) NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_returns_sale ON returns(sale_id);

-- --------------------------------------------------------
--  CAJA
-- --------------------------------------------------------

CREATE TABLE cash_sessions (
  id                bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  branch_id         uuid NOT NULL,
  user_id           text NOT NULL,
  opened_at         timestamptz NOT NULL DEFAULT now(),
  closed_at         timestamptz,
  opening_balance   numeric(14,4) NOT NULL DEFAULT 0,
  expected_balance  numeric(14,4),
  counted_balance   numeric(14,4),
  difference        numeric(14,4),
  status            text NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','CLOSED','RECONCILING')),
  notes             text
);
CREATE INDEX idx_cash_session_branch_status ON cash_sessions(branch_id, status);
CREATE INDEX idx_cash_session_user ON cash_sessions(user_id);

CREATE TABLE cash_movements (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  session_id    bigint NOT NULL REFERENCES cash_sessions(id) ON DELETE CASCADE,
  type          text NOT NULL CHECK (type IN ('IN','OUT','SALE','REFUND')),
  amount        numeric(14,4) NOT NULL,
  reason        text,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_cash_movements_session ON cash_movements(session_id);

-- --------------------------------------------------------
--  MATERIALIZED VIEWS (reports)
-- --------------------------------------------------------

CREATE MATERIALIZED VIEW _mv_sales_daily AS
SELECT
  s.branch_id,
  b.name AS branch_name,
  date_trunc('day', s.created_at) AS day,
  si.product_id,
  p.name AS product_name,
  p.category_id,
  c.name AS category_name,
  s.user_id,
  count(*) AS sales_count,
  sum(si.qty) AS qty_sold,
  sum(si.total) AS gross_total,
  sum(si.total - si.qty * p.cost) AS gross_profit
FROM sales s
JOIN branches b ON b.id = s.branch_id
JOIN sale_items si ON si.sale_id = s.id
JOIN products p ON p.id = si.product_id
LEFT JOIN categories c ON c.id = p.category_id
WHERE s.status = 'COMPLETED'
GROUP BY s.branch_id, b.name, date_trunc('day', s.created_at), si.product_id, p.name, p.category_id, c.name, s.user_id
WITH NO DATA;

CREATE UNIQUE INDEX ON _mv_sales_daily (branch_id, day, product_id);

CREATE MATERIALIZED VIEW _mv_inventory_valuation AS
SELECT
  ist.branch_id,
  b.name AS branch_name,
  ist.product_id,
  p.name AS product_name,
  ist.qty,
  ist.avg_cost,
  ist.qty * ist.avg_cost AS valuation
FROM inventory_stocks ist
JOIN branches b ON b.id = ist.branch_id
JOIN products p ON p.id = ist.product_id
WITH NO DATA;

CREATE UNIQUE INDEX ON _mv_inventory_valuation (branch_id, product_id);

CREATE MATERIALIZED VIEW _mv_sales_by_category AS
SELECT
  s.branch_id,
  b.name AS branch_name,
  date_trunc('day', s.created_at) AS day,
  p.category_id,
  cat.name AS category_name,
  sum(si.total) AS gross_total,
  sum(si.total - si.qty * p.cost) AS gross_profit,
  sum(si.qty) AS qty_sold
FROM sales s
JOIN branches b ON b.id = s.branch_id
JOIN sale_items si ON si.sale_id = s.id
JOIN products p ON p.id = si.product_id
JOIN categories cat ON cat.id = p.category_id
WHERE s.status = 'COMPLETED'
GROUP BY s.branch_id, b.name, date_trunc('day', s.created_at), p.category_id, cat.name
WITH NO DATA;

CREATE UNIQUE INDEX ON _mv_sales_by_category (branch_id, day, category_id);

CREATE MATERIALIZED VIEW _mv_cash_summary AS
SELECT
  cs.branch_id,
  b.name AS branch_name,
  date_trunc('day', cs.opened_at) AS day,
  count(*) AS session_count,
  sum(cs.opening_balance) AS total_opening,
  coalesce(sum(cs.expected_balance), 0) AS total_expected,
  coalesce(sum(cs.counted_balance), 0) AS total_counted,
  coalesce(sum(cs.difference), 0) AS total_difference
FROM cash_sessions cs
JOIN branches b ON b.id = cs.branch_id
WHERE cs.status = 'CLOSED'
GROUP BY cs.branch_id, b.name, date_trunc('day', cs.opened_at)
WITH NO DATA;

CREATE UNIQUE INDEX ON _mv_cash_summary (branch_id, day);

RESET search_path;
