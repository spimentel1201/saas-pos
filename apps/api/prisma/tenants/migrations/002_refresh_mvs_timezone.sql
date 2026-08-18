-- Migracion: recrear materialized views con AT TIME ZONE b.timezone
-- Ejecutar una sola vez para tenants existentes que fueorn creados antes del fix de timezone.

DROP MATERIALIZED VIEW IF EXISTS _mv_sales_daily;
DROP MATERIALIZED VIEW IF EXISTS _mv_sales_by_category;
DROP MATERIALIZED VIEW IF EXISTS _mv_cash_summary;
-- _mv_inventory_valuation no usa fechas, no necesita cambio

CREATE MATERIALIZED VIEW _mv_sales_daily AS
SELECT
  s.branch_code,
  b.name AS branch_name,
  date_trunc('day', s.created_at AT TIME ZONE b.timezone) AS day,
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
JOIN branches b ON b.code = s.branch_code
JOIN sale_items si ON si.sale_id = s.id
JOIN products p ON p.id = si.product_id
LEFT JOIN categories c ON c.id = p.category_id
WHERE s.status = 'COMPLETED'
GROUP BY s.branch_code, b.name, date_trunc('day', s.created_at AT TIME ZONE b.timezone), si.product_id, p.name, p.category_id, c.name, s.user_id
WITH NO DATA;

CREATE UNIQUE INDEX ON _mv_sales_daily (branch_code, day, product_id);

CREATE MATERIALIZED VIEW _mv_sales_by_category AS
SELECT
  s.branch_code,
  b.name AS branch_name,
  date_trunc('day', s.created_at AT TIME ZONE b.timezone) AS day,
  p.category_id,
  cat.name AS category_name,
  sum(si.total) AS gross_total,
  sum(si.total - si.qty * p.cost) AS gross_profit,
  sum(si.qty) AS qty_sold
FROM sales s
JOIN branches b ON b.code = s.branch_code
JOIN sale_items si ON si.sale_id = s.id
JOIN products p ON p.id = si.product_id
JOIN categories cat ON cat.id = p.category_id
WHERE s.status = 'COMPLETED'
GROUP BY s.branch_code, b.name, date_trunc('day', s.created_at AT TIME ZONE b.timezone), p.category_id, cat.name
WITH NO DATA;

CREATE UNIQUE INDEX ON _mv_sales_by_category (branch_code, day, category_id);

CREATE MATERIALIZED VIEW _mv_cash_summary AS
SELECT
  cs.branch_code,
  b.name AS branch_name,
  date_trunc('day', cs.opened_at AT TIME ZONE b.timezone) AS day,
  count(*) AS session_count,
  sum(cs.opening_balance) AS total_opening,
  coalesce(sum(cs.expected_balance), 0) AS total_expected,
  coalesce(sum(cs.counted_balance), 0) AS total_counted,
  coalesce(sum(cs.difference), 0) AS total_difference
FROM cash_sessions cs
JOIN branches b ON b.code = cs.branch_code
WHERE cs.status = 'CLOSED'
GROUP BY cs.branch_code, b.name, date_trunc('day', cs.opened_at AT TIME ZONE b.timezone)
WITH NO DATA;

CREATE UNIQUE INDEX ON _mv_cash_summary (branch_code, day);
