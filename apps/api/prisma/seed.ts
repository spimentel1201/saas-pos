/**
 * Seed script para poblar la base de datos con datos de prueba.
 *
 * Uso:
 *   pnpm --filter @pos/api db:seed
 *
 * Este script crea:
 *  - 2 tenants con schemas PostgreSQL propios
 *  - 3 usuarios (1 admin, 1 cajero, 1 manager)
 *  - 3 sucursales por tenant
 *  - 5 categorías, 5 impuestos, 15 productos por tenant
 *  - 5 clientes por tenant
 *  - 3 proveedores por tenant
 *  - Sesiones de caja y ventas de ejemplo
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PrismaClient } from '@prisma/client';
import pg from 'pg';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const TENANT_SLUGS = ['comercio-demo-1', 'comercio-demo-2'];
const TENANT_NAMES = ['Mi Comercio Demo', 'Tienda Express'];

const USERS = [
  { email: 'admin@demo.com', password: 'Admin123!', name: 'Admin Principal', role: 'OWNER' },
  { email: 'cajero@demo.com', password: 'Cajero123!', name: 'Juan Cajero', role: 'CASHIER' },
  { email: 'manager@demo.com', password: 'Manager123!', name: 'Ana Manager', role: 'MANAGER' },
];

const BRANCHES = [
  { name: 'Sucursal Centro', code: 'CEN01', city: 'Lima' },
  { name: 'Sucursal Norte', code: 'NOR01', city: 'Trujillo' },
  { name: 'Sucursal Sur', code: 'SUR01', city: 'Arequipa' },
];

const CATEGORIES = [
  { id: 'cat-electro', name: 'Electrónica' },
  { id: 'cat-ropa', name: 'Ropa' },
  { id: 'cat-alimentos', name: 'Alimentos' },
  { id: 'cat-hogar', name: 'Hogar' },
  { id: 'cat-deportes', name: 'Deportes' },
];

const TAXES = [
  { id: 'tax-igv', name: 'IGV 18%', rate: 0.18, type: 'PERCENT' },
  { id: 'tax-exento', name: 'Exento', rate: 0, type: 'EXEMPT' },
  { id: 'tax-ivap', name: 'IVAP 4%', rate: 0.04, type: 'PERCENT' },
  { id: 'tax-isv-hn', name: 'ISV Honduras 15%', rate: 0.15, type: 'PERCENT' },
  { id: 'tax-iva-co', name: 'IVA Colombia 19%', rate: 0.19, type: 'PERCENT' },
];

const PRODUCTS = [
  { sku: 'ELEC-001', name: 'Laptop HP 15"', price: 2800, cost: 2100, category: 'cat-electro', tax: 'tax-igv', type: 'GOOD' },
  { sku: 'ELEC-002', name: 'Mouse Logitech', price: 120, cost: 65, category: 'cat-electro', tax: 'tax-igv', type: 'GOOD' },
  { sku: 'ELEC-003', name: 'Teclado Mecánico', price: 350, cost: 180, category: 'cat-electro', tax: 'tax-igv', type: 'GOOD' },
  { sku: 'ROPA-001', name: 'Polo Básico', price: 89, cost: 35, category: 'cat-ropa', tax: 'tax-exento', type: 'GOOD' },
  { sku: 'ROPA-002', name: 'Jeans Clásico', price: 199, cost: 85, category: 'cat-ropa', tax: 'tax-exento', type: 'GOOD' },
  { sku: 'ROPA-003', name: 'Zapatillas Running', price: 399, cost: 210, category: 'cat-ropa', tax: 'tax-igv', type: 'GOOD' },
  { sku: 'ALIM-001', name: 'Arroz 5kg', price: 25, cost: 18, category: 'cat-alimentos', tax: 'tax-exento', type: 'GOOD' },
  { sku: 'ALIM-002', name: 'Aceite de Oliva 1L', price: 45, cost: 30, category: 'cat-alimentos', tax: 'tax-exento', type: 'GOOD' },
  { sku: 'ALIM-003', name: 'Café Molido 500g', price: 38, cost: 22, category: 'cat-alimentos', tax: 'tax-exento', type: 'GOOD' },
  { sku: 'HOGA-001', name: 'Sartén Antiadherente', price: 120, cost: 55, category: 'cat-hogar', tax: 'tax-igv', type: 'GOOD' },
  { sku: 'HOGA-002', name: 'Juego de Sábanas', price: 180, cost: 75, category: 'cat-hogar', tax: 'tax-exento', type: 'GOOD' },
  { sku: 'HOGA-003', name: 'Aspiradora Portátil', price: 450, cost: 280, category: 'cat-hogar', tax: 'tax-igv', type: 'GOOD' },
  { sku: 'DEPO-001', name: 'Balón de Fútbol', price: 85, cost: 40, category: 'cat-deportes', tax: 'tax-igv', type: 'GOOD' },
  { sku: 'DEPO-002', name: 'Raqueta de Tenis', price: 320, cost: 160, category: 'cat-deportes', tax: 'tax-igv', type: 'GOOD' },
  { sku: 'DEPO-003', name: 'Mancuernas 10kg', price: 150, cost: 80, category: 'cat-deportes', tax: 'tax-igv', type: 'GOOD' },
];

const CUSTOMERS = [
  { name: 'Carlos Pérez', email: 'carlos@email.com', phone: '999111222', type: 'INDIVIDUAL', documentType: 'DNI', documentNumber: '12345678' },
  { name: 'María García', email: 'maria@email.com', phone: '999222333', type: 'INDIVIDUAL', documentType: 'DNI', documentNumber: '87654321' },
  { name: 'Distribuidora ABC SAC', email: 'ventas@abc.com', phone: '999333444', type: 'BUSINESS', documentType: 'RUC', documentNumber: '20123456789' },
  { name: 'Juan López', email: 'juan@email.com', phone: '999444555', type: 'INDIVIDUAL', documentType: 'CE', documentNumber: 'CE12345' },
  { name: 'Restaurantes Unidos', email: 'pedidos@ru.com', phone: '999555666', type: 'BUSINESS', documentType: 'RUC', documentNumber: '20987654321' },
];

const SUPPLIERS = [
  { id: 'sup-distrib', name: 'Distribuidora Mayorista SAC', contact: 'Pedro Vendedor', email: 'ventas@dm.com', phone: '999888777' },
  { id: 'sup-import', name: 'Importaciones Global', contact: 'Laura Import', email: 'compras@ig.com', phone: '999777666' },
  { id: 'sup-local', name: 'Productores Locales', contact: 'Miguel Campo', email: 'miguel@pl.com', phone: '999666555' },
];

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

async function seedTenantSchema(schemaName: string, tenantId: string) {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL no definida');

  // Crear schema usando create-schema.ts
  const createSchemaPath = resolve(import.meta.dirname, 'tenants', 'create-schema.ts');
  const { execSync } = await import('node:child_process');
  execSync(`tsx "${createSchemaPath}" ${schemaName}`, { env: process.env, stdio: 'inherit' });

  // Conectar directamente al schema del tenant
  const client = new pg.Client({ connectionString: url });
  await client.connect();

  try {
    await client.query(`SET search_path TO ${schemaName}`);

    // Branches (en shared schema ya están, pero las insertamos en tenant schema también)
    for (const b of BRANCHES) {
      await client.query(
        `INSERT INTO branches (id, name, code, city) VALUES (gen_random_uuid(), $1, $2, $3) ON CONFLICT (code) DO NOTHING`,
        [b.name, b.code, b.city],
      );
    }

    // Obtener branch IDs
    const branchResult = await client.query(`SELECT id, code FROM branches ORDER BY code`);
    const branchIds = branchResult.rows as { id: string; code: string }[];

    // Categories
    for (const c of CATEGORIES) {
      await client.query(
        `INSERT INTO categories (id, name) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING`,
        [c.id, c.name],
      );
    }

    // Taxes
    for (const t of TAXES) {
      await client.query(
        `INSERT INTO taxes (id, name, rate, type) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING`,
        [t.id, t.name, t.rate, t.type],
      );
    }

    // Products
    const productIds: string[] = [];
    for (const p of PRODUCTS) {
      const productId = `prod-${p.sku.toLowerCase()}`;
      productIds.push(productId);
      await client.query(
        `INSERT INTO products (id, sku, name, price, cost, category_id, tax_id, type, track_stock)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
         ON CONFLICT (sku) DO NOTHING`,
        [productId, p.sku, p.name, p.price, p.cost, p.category, p.tax, p.type],
      );
    }

    // Customers
    const customerIds: string[] = [];
    for (const c of CUSTOMERS) {
      const result = await client.query(
        `INSERT INTO customers (name, email, phone, type, document_type, document_number)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT DO NOTHING
         RETURNING id`,
        [c.name, c.email, c.phone, c.type, c.documentType, c.documentNumber],
      );
      if (result.rows.length > 0) {
        customerIds.push(result.rows[0].id);
      }
    }

    // Suppliers
    for (const s of SUPPLIERS) {
      await client.query(
        `INSERT INTO suppliers (id, name, contact, email, phone)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO NOTHING`,
        [s.id, s.name, s.contact, s.email, s.phone],
      );
    }

    // Inventory stocks (for first branch)
    if (branchIds.length > 0) {
      const defaultBranchId = branchIds[0].id;
      for (const pid of productIds) {
        const stock = Math.floor(Math.random() * 50) + 10;
        await client.query(
          `INSERT INTO inventory_stocks (branch_id, product_id, qty, min_qty, max_qty, avg_cost)
           VALUES ($1, $2, $3, 5, 100, $4)
           ON CONFLICT (branch_id, product_id) DO NOTHING`,
          [defaultBranchId, pid, stock, stock * 0.6],
        );
      }
    }

    // Purchase Orders (3 per tenant)
    for (let i = 0; i < 3; i++) {
      const poId = `po-${schemaName}-${i + 1}`;
      const branchId = branchIds[i % branchIds.length].id;
      const items = [
        { productId: productIds[i * 3], qty: 10, unitCost: PRODUCTS[i * 3].cost },
        { productId: productIds[i * 3 + 1], qty: 20, unitCost: PRODUCTS[i * 3 + 1].cost },
      ];
      const total = items.reduce((sum, item) => sum + item.qty * item.unitCost, 0);

      await client.query(
        `INSERT INTO purchase_orders (id, branch_id, supplier_id, status, total, items, created_by)
         VALUES ($1, $2, $3, 'RECEIVED', $4, $5, 'seed')
         ON CONFLICT (id) DO NOTHING`,
        [poId, branchId, SUPPLIERS[i].id, total, JSON.stringify(items)],
      );
    }

    // Cash Sessions (2 per tenant)
    for (let i = 0; i < 2; i++) {
      const branchId = branchIds[i].id;
      const openingBalance = 500;
      const salesInSession = 200 + i * 100;
      const expectedBalance = openingBalance + salesInSession;

      await client.query(
        `INSERT INTO cash_sessions (branch_id, user_id, opening_balance, expected_balance, counted_balance, difference, status, closed_at)
         VALUES ($1, 'seed-user', $2, $3, $3, 0, 'CLOSED', now())
         RETURNING id`,
        [branchId, openingBalance, expectedBalance],
      );
    }

    // Sales (5 per tenant)
    for (let i = 0; i < 5; i++) {
      const saleId = `sale-${schemaName}-${String(i + 1).padStart(3, '0')}`;
      const branchId = branchIds[i % branchIds.length].id;
      const productId = productIds[i % productIds.length];
      const product = PRODUCTS[i % PRODUCTS.length];
      const qty = Math.floor(Math.random() * 5) + 1;
      const subtotal = product.price * qty;
      const taxAmount = product.tax === 'tax-igv' ? subtotal * 0.18 : 0;
      const total = subtotal + taxAmount;

      await client.query(
        `INSERT INTO sales (id, branch_id, user_id, number_seq, customer_id, subtotal, tax, total, status)
         VALUES ($1, $2, 'seed-user', $3, $4, $5, $6, $7, 'COMPLETED')
         ON CONFLICT (id) DO NOTHING`,
        [saleId, branchId, i + 1, customerIds[i % customerIds.length], subtotal, taxAmount, total],
      );

      // Sale items
      await client.query(
        `INSERT INTO sale_items (sale_id, product_id, qty, unit_price, tax_amount, total)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [saleId, productId, qty, product.price, taxAmount, total],
      );

      // Sale payments
      await client.query(
        `INSERT INTO sale_payments (sale_id, method, amount)
         VALUES ($1, 'CASH', $2)`,
        [saleId, total],
      );
    }

    console.log(`✅ Tenant ${schemaName} poblado correctamente`);
  } finally {
    await client.end();
  }
}

async function main() {
  console.log('🌱 Iniciando seed...');

  // Limpiar datos existentes (opcional, solo en desarrollo)
  if (process.env.CLEAN_SEED === 'true') {
    console.log('🧹 Limpiando datos existentes...');
    await prisma.usageCounter.deleteMany();
    await prisma.subscription.deleteMany();
    await prisma.tenantUser.deleteMany();
    await prisma.branch.deleteMany();
    await prisma.user.deleteMany();
    await prisma.tenant.deleteMany();
  }

  for (let i = 0; i < TENANT_SLUGS.length; i++) {
    const slug = TENANT_SLUGS[i];
    const tenantName = TENANT_NAMES[i];
    const schemaName = `tenant_${slug.replace(/-/g, '_')}`;

    // Verificar si el tenant ya existe
    const existing = await prisma.tenant.findUnique({ where: { slug } });
    if (existing) {
      console.log(`⏭️  Tenant ${slug} ya existe, saltando...`);
      continue;
    }

    // Crear tenant
    const tenant = await prisma.tenant.create({
      data: {
        name: tenantName,
        slug,
        schemaName,
        plan: 'STARTER',
        status: 'ACTIVE',
      },
    });
    console.log(`✅ Tenant ${tenantName} creado (${tenant.id})`);

    // Crear schema en PostgreSQL
    await seedTenantSchema(schemaName, tenant.id);

    // Crear usuarios
    const userIds: string[] = [];
    for (const u of USERS) {
      const passwordHash = await hashPassword(u.password);
      const emailSuffix = i === 0 ? '' : `+tenant${i}`;
      const userEmail = u.email.replace('@', `${emailSuffix}@`);

      const user = await prisma.user.upsert({
        where: { email: userEmail },
        update: {},
        create: {
          email: userEmail,
          passwordHash,
          name: u.name,
          emailVerified: new Date(),
        },
      });

      await prisma.tenantUser.upsert({
        where: { userId_tenantId: { userId: user.id, tenantId: tenant.id } },
        update: {},
        create: {
          userId: user.id,
          tenantId: tenant.id,
          role: u.role as any,
        },
      });

      userIds.push(user.id);
    }
    console.log(`  👤 ${USERS.length} usuarios creados`);

    // Crear suscripción (trial de 14 días)
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 14);

    await prisma.subscription.create({
      data: {
        tenantId: tenant.id,
        status: 'TRIALING',
        currentPeriodEnd: trialEnd,
      },
    });
    console.log(`  💳 Suscripción TRIAL creada`);

    // Crear contador de uso
    const now = new Date();
    const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    await prisma.usageCounter.create({
      data: {
        tenantId: tenant.id,
        period,
        branchCount: BRANCHES.length,
        productCount: PRODUCTS.length,
        saleCount: 5,
      },
    });
    console.log(`  📊 Contador de uso creado`);
  }

  console.log('\n🎉 Seed completado exitosamente!');
  console.log('\n📋 Credenciales de prueba:');
  console.log('  Admin:   admin@demo.com / Admin123!');
  console.log('  Cajero:  cajero@demo.com / Cajero123!');
  console.log('  Manager: manager@demo.com / Manager123!');
  console.log('\n🏪 Tenants:');
  TENANT_SLUGS.forEach((slug, i) => {
    console.log(`  ${TENANT_NAMES[i]}: ${slug}`);
  });
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
