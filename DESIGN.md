---
name: "POS SaaS"
description: "Cloud-first POS multi-tenant para comercios peruanos — offline-first, dark mode global, es-PE"
colors:
  # Dark mode (primary - cajeros)
  bg: "#0b0f17"
  bg-soft: "#111827"
  fg: "#e5e7eb"
  fg-muted: "#94a3b8"
  accent: "#6366f1"
  accent-2: "#06b6d4"
  border: "#1f2937"
  # Light mode (admin)
  bg-light: "#ffffff"
  bg-soft-light: "#f8fafc"
  fg-light: "#0f172a"
  fg-muted-light: "#64748b"
  accent-light: "#2563eb"
  accent-2-light: "#0891b2"
  border-light: "#e2e8f0"
  # Semantic
  success: "#059669"
  success-soft: "#d1fae5"
  warning: "#d97706"
  warning-soft: "#fef3c7"
  danger: "#dc2626"
  danger-soft: "#fee2e2"
  # Brand
  brand-indigo: "#2563eb"
  brand-cyan: "#06b6d4"
typography:
  display:
    fontFamily: "Plus Jakarta Sans, Inter, system-ui, sans-serif"
    fontSize: "clamp(2rem, 5vw, 3.5rem)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Plus Jakarta Sans, Inter, system-ui, sans-serif"
    fontSize: "clamp(1.5rem, 3vw, 2.25rem)"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Plus Jakarta Sans, Inter, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.3
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
    maxLineLength: "65ch"
  label:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.01em"
    textTransform: "none"
  mono:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  sm: "4px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  full: "9999px"
spacing:
  1: "4px"
  2: "8px"
  3: "12px"
  4: "16px"
  5: "20px"
  6: "24px"
  8: "32px"
  10: "40px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.fg-inverse}"
    rounded: "{rounded.md}"
    padding: "14px 24px"
    fontSize: "1rem"
    fontWeight: 600
  button-primary-hover:
    backgroundColor: "#4f46e5"
    textColor: "{colors.fg-inverse}"
    rounded: "{rounded.md}"
    padding: "14px 24px"
  button-secondary:
    backgroundColor: "{colors.bg-soft}"
    textColor: "{colors.fg}"
    rounded: "{rounded.md}"
    padding: "14px 24px"
    border: "1px solid {colors.border}"
    fontSize: "1rem"
    fontWeight: 600
  card:
    backgroundColor: "{colors.bg-soft}"
    border: "1px solid {colors.border}"
    rounded: "{rounded.lg}"
    padding: "24px"
  input:
    backgroundColor: "{colors.bg}"
    border: "1px solid {colors.border}"
    rounded: "{rounded.md}"
    padding: "12px 16px"
    fontSize: "1rem"
    color: "{colors.fg}"
  input-focus:
    outline: "2px solid {colors.accent}"
    outlineOffset: "1px"
  tag:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.fg-muted}"
    border: "1px solid {colors.border}"
    rounded: "{rounded.full}"
    padding: "4px 8px"
    fontSize: "0.75rem"
    fontWeight: 600
  form:
    backgroundColor: "{colors.bg-soft}"
    border: "1px solid {colors.border}"
    rounded: "{rounded.lg}"
    padding: "32px"
    maxWidth: "480px"
    gap: "16px"
  grid:
    gap: "16px"
    minColumnWidth: "220px"
  main:
    maxWidth: "960px"
    paddingX: "24px"
    paddingY: "64px"
---

# Design System: POS SaaS

## Overview

**Creative North Star: "El Tablero de Control Nocturno"**

Un sistema de diseño oscuro-primero para cajeros que trabajan turnos de 12-14 horas en entornos de luz variable. La paleta indigo-cian sobre fondo profundo (#0b0f17) reduce la fatiga visual, mientras que el modo claro complementario sirve a gestores en oficina. La tipografía Plus Jakarta Sans + Inter transmite tecnología accesible — geométrica pero humana, legible a 44px en pantallas táctiles grasientas.

**Key Characteristics:**
- Dark mode primario (cajeros), light mode secundario (admin/gestores)
- Paleta indigo (#2563EB) + cian (#06B6D4) — evita el default "cream/terracotta" de AI
- Variable fonts únicas (Plus Jakarta Sans + Inter + JetBrains Mono)
- Espaciado base 4px, radius 4/8/12/16px — sin valores mágicos
- Touch targets ≥44px, focus rings indigo visibles
- es-PE locale nativo: S/., DD/MM/YYYY, IGV 18%, DNI/RUC

## Colors

Paleta dual dark-first / light-second. Indigo como acento principal (compromiso de marca), cian como acento secundario para estados interactivos. Neutrales profundos en dark, suaves en light.

### Primary

- **Indigo Eléctrico** (#2563EB / oklch(55% 0.25 265)): Acento principal — botones primarios, focus rings, enlaces, indicadores de estado activo. Derivado del brand commitment en PRODUCT.md.
- **Indigo Profundo** (#1E40AF): Hover/active de primario.

### Secondary

- **Cian Vibrante** (#06B6D4 / oklch(70% 0.18 195)): Acento secundario — enlaces, estados info, acento en gradientes. Complementa indigo sin competir.

### Tertiary (opcional)
- **Verde Éxito** (#059669): Estados positivos, stock OK, pagos completados.
- **Ámbar Advertencia** (#D97706): Stock bajo, pendientes, cortes de caja con diferencia.
- **Rojo Peligro** (#DC2626): Acciones destructivas, errores, stock crítico.

### Neutral (Dark Mode)
- **Negro Profundo** (#0B0F17): Fondo página principal.
- **Gris Muy Oscuro** (#111827): Superficies, tarjetas, modales.
- **Gris Medio Oscuro** (#1F2937): Bordes, divisores, inputs.
- **Gris Claro** (#94A3B8): Texto secundario, placeholders, iconos muted.
- **Blanco Suave** (#E5E7EB): Texto primario, iconos activos.

### Neutral (Light Mode)
- **Blanco Puro** (#FFFFFF): Fondo página.
- **Gris Muy Claro** (#F8FAFC): Superficies, tarjetas.
- **Gris Claro** (#E2E8F0): Bordes, divisores.
- **Gris Medio** (#64748B): Texto secundario.
- **Gris Oscuro** (#0F172A): Texto primario.

### Named Rules

**The One Voice Rule.** El acento indigo (#2563EB) aparece en ≤10% de cualquier pantalla dada. Su rareza es el punto — guía la acción principal sin ruido visual.

**The Dual-Mode Rule.** Cada token de color tiene su contraparte light/dark. No hardcodear valores hex en componentes; usar variables semánticas (`var(--accent)`, `var(--bg)`).

**The Semantic Pairing Rule.** Peligro siempre con fondo danger-soft; éxito con success-soft; advertencia con warning-soft. Nunca mezclar semánticas.

## Typography

Display: **Plus Jakarta Sans** (variable, wght 400-800) — geométrica, distintiva, legible a tamaños grandes.  
Body: **Inter** (variable, wght 400-700) — la más legible a tamaños pequeños, neutral pero con personalidad.  
Mono: **JetBrains Mono** — datos, códigos, montos, SKUs.

**Character:** La pareja Plus Jakarta Sans + Inter evita el default "serif cálido + sans genérica" de AI. Transmite tecnología accesible: precisa pero no fría.

### Hierarchy

- **Display** (700, clamp(2rem, 5vw, 3.5rem), 1.1, -0.02em): Hero headlines, landing, onboarding steps. Solo una por pantalla.
- **Headline** (600, clamp(1.5rem, 3vw, 2.25rem), 1.2, -0.01em): Section headers, page titles, card titles importantes.
- **Title** (600, 1.25rem, 1.3): Sub-secciones, tabs activos, headers de tabla.
- **Body** (400/500, 1rem, 1.5, 65ch max): Texto corrido, descripciones, ayuda.
- **Label** (500, 0.875rem, 1.4, 0.01em): Labels de formulario, captions, badges, metadata.
- **Mono** (400/500, 0.875rem, 1.5): Montos (S/. 123.45), SKUs, códigos, DNI/RUC, timestamps.

### Named Rules

**The Single Display Rule.** Una sola `Display` por viewport. Si hay dos secciones que compiten, la secundaria usa `Headline`.

**The Mono-for-Data Rule.** Todo dato transaccional (precios, cantidades, códigos, documentos) usa JetBrains Mono. Nunca Inter para montos.

**The No-All-Caps Rule.** Labels usan sentence case. No uppercase tracking-wide para "UI kit" — solo en badges de estado muy cortos (OK, ERR).

## Layout

Grid fluido 12-column con container max 960px (landing) / 1440px (app). Espaciado base 4px (--space-1). Rhythm vertical: 16px (gap estándar), 24px (secciones), 32px (major), 64px (hero).

### Container
- **Landing/Marketing:** max-width 960px, padding 24px móvil / 64px desktop.
- **App Shell:** Full viewport, sidebar 280px (colapsible 72px) + main flexible.
- **POS:** Fullscreen sin chrome, grid 3-col (categorías 240px / productos flex / carrito 360px sticky).

### Breakpoints
- **Mobile:** < 640px — bottom tabs, stack 1-col, sheets full-screen
- **Tablet:** 640–1023px — drawer sidebar, 2-col grids
- **Desktop:** 1024–1439px — sidebar persistente 280px
- **Wide:** ≥ 1440px — max-width 1440px centrado, whitespace generoso

### Density
- **Comfortable (default):** 16px gap, 24px card padding, 44px touch targets
- **Compact (POS):** 12px gap, 16px card padding, 40px touch targets — densidad para velocidad de cajero

## Elevation & Depth

Sistema tonal (flat-by-default) + sombras solo en respuesta a estado (hover, focus, elevation explícita). No sombras ambientales en reposo.

### Shadow Vocabulary
- **Ambient Low** (`0 1px 2px rgba(0,0,0,0.05)`): Cards en reposo (light mode only).
- **Elevation 1** (`0 4px 8px rgba(0,0,0,0.08)`): Dropdowns, tooltips, popovers.
- **Elevation 2** (`0 8px 24px rgba(0,0,0,0.12)`): Modals, sheets, dialogs.
- **Focus Ring** (`0 0 0 3px var(--accent-soft)`): Focus visible en ambos modos.
- **Dark Mode Glow** (`0 0 0 3px oklch(55% 0.25 265 / 0.4)`): Focus ring en dark mode (más visible).

### Named Rules

**The Flat-By-Default Rule.** Superficies son planas en reposo. Sombras aparecen solo como respuesta a estado (hover, focus, elevation explícita via `data-elevation`).

**The Dark-Mode Depth Rule.** En dark mode, profundidad se comunica via tonal layering (bg → bg-soft → bg-hover) y bordes sutiles (border), no sombras.

## Shapes

Radio de esquina en escala 4px: 4/8/12/16px + full. Sin valores intermedios.

- **sm (4px):** Inputs, badges, chips, botones pequeños
- **md (8px):** Botones, selects, toggles, tooltips
- **lg (12px):** Cards, modals, sheets, forms
- **xl (16px):** Hero sections, containers principales
- **full (9999px):** Pills, avatares, tags, progress rings

Bordes: 1px solid `var(--border)` en light; 1px solid `var(--border)` en dark (más sutil). Sin bordes en inputs en dark mode — solo fondo + focus ring.

### Named Rules

**The Radius Ladder Rule.** Radius solo toma valores de la escala {sm, md, lg, xl, full}. No `border-radius: 6px` ni `10px`.

**The Pill-Only-Full Rule.** `full` solo para elementos inline que son inherentemente "píldoras": tags, status badges, avatares, botones icono-only.

## Components

### Buttons
- **Shape:** radius md (8px), padding 14px 24px, font-weight 600
- **Primary:** bg `var(--accent)`, text white, hover `#4F46E5`, focus ring indigo
- **Secondary:** bg `var(--bg-soft)`, border `var(--border)`, text `var(--fg)`, hover `var(--bg-hover)`
- **Ghost:** transparent bg, text `var(--fg)`, hover `var(--bg-hover)`
- **Danger:** bg `var(--danger)`, text white, hover darker
- **Icon-only:** 40×40px (touch), radius md, aria-label obligatorio
- **Loading:** spinner inline, disabled state, mismo tamaño

### Cards
- **Shape:** radius lg (12px), border 1px `var(--border)`, bg `var(--bg-soft)`
- **Padding:** 24px (comfortable) / 16px (compact POS)
- **Shadow:** none en reposo; elevation 1 en hover (light mode only)
- **Hover:** border `var(--accent)` + elevation 1 (light only)

### Inputs / Fields
- **Style:** bg `var(--bg)`, border 1px `var(--border)`, radius md, padding 12px 16px
- **Focus:** outline 2px `var(--accent)`, outline-offset 1px, border transparente
- **Error:** border `var(--danger)`, focus ring `var(--danger-soft)`
- **Disabled:** bg `var(--bg-soft)`, text `var(--fg-muted)`, cursor not-allowed
- **Label:** `var(--fg-muted)`, 0.875rem, 500 weight, mb 4px
- **Helper/Error text:** 0.875rem, `var(--fg-muted)` / `var(--danger)`

### Tags / Badges
- **Style:** inline-flex, px 8 py 4, radius full, font 0.75rem 600
- **Default:** bg `var(--bg)`, text `var(--fg-muted)`, border `var(--border)`
- **Status variants:** success/warning/danger con fondos soft + texto fuerte
- **Selected:** bg `var(--accent)`, text white

### Forms
- **Container:** max-width 480px, bg `var(--bg-soft)`, border `var(--border)`, radius lg, padding 32px
- **Gap:** 16px entre campos
- **Submit:** primary button, full-width en móvil
- **Validation:** inline error bajo campo, focus ring en error

### Navigation (App Shell)
- **Top Bar:** 64px h, bg `var(--bg-soft)`, border-bottom `var(--border)`
- **Sidebar:** 280px (expanded) / 72px (collapsed), bg `var(--bg)`, border-right `var(--border)`
- **Items:** px 16 py 12, gap 8px icon-label, radius md, hover `var(--bg-hover)`, active `var(--accent-soft)` + border-left 3px `var(--accent)`
- **Collapsed:** solo icono, tooltip en hover
- **Mobile:** drawer + bottom tabs (5 max: Dashboard, POS, Catalog, Cash, More)

### POS-Specific
- **Product Grid:** virtualized, min 160px/card, click=add, long-press=qty picker
- **Cart (Sticky):** right 360px desktop / bottom sheet mobile, radius lg top-only
- **Cart Line:** swipe-delete, stepper qty, discount inline, mono para montos
- **Payment Buttons:** F1–F6 shortcuts visibles, 60px height, icon + label
- **Scanner Modal:** fullscreen cámara, overlay guides, torch toggle
- **Receipt Preview:** modal centered, mono font, print/email/whatsapp/download

### Tables (TanStack Table v8)
- **Header:** label weight 500, text `var(--fg-muted)`, py 12px, border-bottom `var(--border)`
- **Row:** py 12px, hover `var(--bg-hover)`, border-bottom `var(--border)` (light only)
- **Cell:** mono para datos numéricos, truncate con tooltip en texto largo
- **Selection:** checkbox col 1, highlight row `var(--accent-soft)`
- **Empty State:** illustration + copy accionable + CTA primary

### Charts (Recharts)
- **Palette:** indigo, cyan, success, warning, danger, muted (semantic mapping)
- **Grid:** `var(--border)` stroke, 1px, dasharray 4 4
- **Tooltip:** bg `var(--bg-soft)`, border `var(--border)`, radius md, shadow elevation 2
- **Legend:** label 0.875rem, `var(--fg-muted)`, inline dots 8px

## Do's and Don'ts

### Do:
- **Do** usar variables semánticas (`var(--accent)`, `var(--bg)`) en todo componente — nunca hex hardcodeado.
- **Do** respetar la escala de spacing 4px: 4, 8, 12, 16, 20, 24, 32, 40px.
- **Do** usar `var(--mono)` para montos, SKUs, códigos, DNI/RUC, timestamps.
- **Do** proveer ambos modos (light/dark) para cada token de color.
- **Do** mantener touch targets ≥44px (40px en POS compact).
- **Do** usar `var(--accent)` para focus rings en ambos modos.
- **Do** seguir la radius ladder: sm/md/lg/xl/full únicamente.
- **Do** usar Plus Jakarta Sans para Display/Headline/Title, Inter para Body/Label.
- **Do** probar en dark mode primero — es el modo primario para cajeros.
- **Do** usar JetBrains Mono para receipts, códigos, montos en tabla.

### Don't:
- **Don't** hardcodear `#2563EB` o `#0B0F17` en componentes — usar `var(--accent)`, `var(--bg)`.
- **Don't** inventar valores de spacing fuera de la escala 4px.
- **Don't** usar Inter para montos o códigos — solo JetBrains Mono.
- **Don't** usar sombras en dark mode para profundidad — usar tonal layering.
- **Don't** usar `border-radius: 6px` o `10px` — solo sm/md/lg/xl/full.
- **Don't** usar all-caps para labels — sentence case siempre.
- **Don't** mezclar semánticas de color (peligro con fondo success-soft).
- **Don't** usar más de un Display por viewport.
- **Don't** usar serif fonts — brand commitment es sans geometric + humanist.
- **Don't** usar cream/terracotta palette — ese es el default AI que evitamos.