# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary:** Dueños de pequeños comercios en Perú (bodegas, minimarkets, farmacias, tiendas de barrio) que operan 1–5 sucursales y necesitan un POS moderno, cloud-first, que funcione offline.

**Situation:** Trabajan 12–14h/día, a menudo sin conexión estable a internet. Manejan efectivo, tarjetas, transferencias (Yape/Plin). Tienen poco tiempo para configurar software complejo.

**Job:** "Quiero abrir mi negocio, escanear productos, cobrar y cerrar caja en < 15 min, sin que se me caiga el sistema si se va la luz o el internet."

**Secondary:** Contadores/gestores que revisan reportes de ventas e inventario semanalmente.

## Product Purpose

SaaS POS multi-tenant para comercios minoristas en Perú. Cloud-first con sincronización offline-first (IndexedDB + service worker), multi-sucursal nativo, generación de códigos de barra/QR por producto, Stripe Terminal (mock) + pagos manuales, reportes vía materialized views, suscripción Stripe (Starter/Growth/Pro).

**Success:** Tenant hace su primera venta en < 15 min post-signup; POS funciona 4h offline y sincroniza sin conflictos; cierre de caja cuadra con ≤ 0.5% error.

## Positioning

Único POS cloud en Perú con: (1) generación nativa de EAN-13/Code128/QR por producto con URL firmada HMAC anti-spoofing, (2) modo offline-first real con ULID cliente + stock server-authoritative, (3) Stripe Terminal integrado (mock v1) + pagos manuales Yape/Plin/efectivo en un solo flujo, (4) dark mode global para cajeros (fatiga visual en turnos nocturnos).

## Operating Context

- **Entorno físico:** Mostrador, luz variable, ruido, manos ocupadas. UI densa pero escaneable, touch-friendly (44px mínimo), atajos teclado F1–F7.
- **Documentos:** DNI (8 dígitos), RUC (11 dígitos), comprobantes SUNAT (no fiscales en MVP).
- **Materiales:** Impresoras térmicas 58/80mm (ESC/POS - v2), scanner cámara (Web Barcode API) + hardware HID.
- **Rituales:** Apertura caja → ventas → cierre/arqueo → Z-report. Cortes diarios obligatorios.
- **Herramientas actuales:** Excel, cuadernos, POS legacy Windows (no cloud, no multi-sucursal).

## Capabilities and Constraints

### Confirmed
- Multi-tenant: schema-per-tenant (PostgreSQL), shared tables en `public`
- Auth: JWT access/refresh, RBAC (Owner/Admin/Manager/Cashier)
- Catálogo: productos, variantes, categorías, impuestos (IGV 18%, EXONERADO, INAFECTO), CSV import
- Inventario: stock por sucursal, mínimos/máximos, transferencias, ajustes auditados
- Compras: proveedores, OC (borrador→enviada→parcial→recibida), recepción actualiza costo promedio
- Ventas POS: carrito, selector cliente opcional (DNI/RUC/nombre/teléfono), descuentos línea/global, multi-pago (efectivo, tarjeta, transferencia, crédito, Yape, Plin, mixto), devoluciones, hold/recall
- Caja: apertura con fondo, movimientos IN/OUT, arqueo por denominaciones, cierre Z
- Clientes: Natural (DNI) / Jurídica (RUC), crédito tienda, historial
- Reportes: MVs horarias (ventas, inventario, caja, categorías), export CSV/Excel/PDF
- Códigos: EAN-13, Code128, UPC-A, QR (HMAC signed URL), plantillas Avery/custom
- Storage: Cloudinary (signed upload directo frontend), QR/barcode generado backend
- Billing: Stripe Checkout + Portal, planes Starter (1 sucursal, 200 prod), Growth (≤5 suc, prod ilimitados), Pro (multi-suc + API)
- i18n: es-PE base (S/., DD/MM/YYYY, IGV 18%, DNI/RUC), next-intl ready
- Offline: Dexie (IndexedDB), background sync, ULID cliente, server-wins stock

### Constraints
- No facturación electrónica SUNAT (v2)
- No hardware ESC/POS real en v1 (solo PDF receipt + download/email/WhatsApp)
- Stripe Terminal: solo mock/simulator
- Impresoras: configurables por sucursal (IP/puerto), test print en settings

### Undecided
- Webhooks Stripe para automatizar upgrade/downgrade (pendiente Stripe CLI local)
- Notificaciones push (OneSignal/Firebase) v2
- Multi-almacén con ubicaciones (racks) v2

## Brand Commitments

- **Nombre:** POS SaaS (working title)
- **Voice:** Práctico, directo, sin jerga técnica innecesaria. "Tú" informal pero respetuoso.
- **Assets:** Logo placeholder, sin brand book formal aún.
- **Color commitment:** Indigo (#2563EB) como acento principal (ya en globals.css). Dark mode obligatorio.
- **Typography commitment:** Plus Jakarta Sans (display) + Inter (body) + JetBrains Mono (data). Variable fonts.

## Evidence on Hand

- **API funcionando:** Swagger en `/api/v1/docs`, seed con 2 tenants Perú-realistas (DNI, RUC, IGV 18%, S/.)
- **Seed data:** 15 productos, 5 clientes, 3 proveedores, 5 OC, 2 transferencias, 3 sesiones caja, 10 ventas, 2 devoluciones, 8 movimientos inventario
- **Auth flow:** Signup → tenant + owner + subscription TRIAL → onboarding wizard → POS
- **Multi-tenant:** Header `X-Tenant-Slug` o subdominio, middleware setea `search_path`
- **Reportes:** 4 MVs (_mv_sales_daily, _mv_inventory_valuation, _mv_sales_by_category, _mv_cash_summary) + refresh job BullMQ
- **Cloudinary:** Signed upload params endpoint (`POST /api/v1/uploads/sign`)
- **Stripe:** Prices creados, Checkout Session + Customer Portal funcionando
- **Docs:** PLAN-MVP-POS-SAAS.md completo, TESTING_FLOW.md, DEPLOY-RENDER.md

## Product Principles

1. **Offline-first by default** — La red es un bonus, no un requisito. Cada acción crítica persiste local primero.
2. **Densidad con claridad** — Cajeros escanean 50+ items/hora. UI compacta, atajos visibles, feedback inmediato.
3. **Stock server-authoritative** — Cliente propone (ULID), servidor resuelve (optimistic lock `version`).
4. **Perú first, no Perú only** — DNI/RUC/IGV/Soles hoy; arquitectura lista para CFDI/NC/DTE v2.
5. **Dark mode no es opcional** — Turnos nocturnos, fatiga visual, confianza del cajero.
6. **Config sobre código** — Wizard onboarding + settings tabs reemplazan hardcoded defaults.

## Accessibility & Inclusion

- WCAG 2.1 AA target: contraste ≥ 4.5:1 (dark mode verificado), focus visible (indigo ring), etiquetas ARIA en formularios, skip links, landmarks semánticos.
- Touch targets ≥ 44×44px (POS touchscreen).
- Atajos teclado documentados (F1–F7) + screen reader announcements para estados (offline, sync, error).
- Idioma: es-PE por defecto, next-intl listo para es-CO/es-AR/es-CL/pt-BR/en-US.