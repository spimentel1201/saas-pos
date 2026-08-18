import { z } from 'zod';

/** DNI peruano: 8 dígitos */
export const dniSchema = z.string().regex(/^\d{8}$/, 'DNI debe tener 8 dígitos');

/** RUC peruano: 11 dígitos */
export const rucSchema = z.string().regex(/^\d{11}$/, 'RUC debe tener 11 dígitos');

/** SKU alfanumérico */
export const skuSchema = z
  .string()
  .min(1, 'SKU requerido')
  .max(50, 'SKU muy largo')
  .regex(/^[A-Za-z0-9-]+$/, 'SKU solo letras, números y guiones');

/** Monto en PEN (centésimas) */
export const penAmountSchema = z
  .number()
  .min(0, 'Monto no puede ser negativo')
  .max(999_999_999.99, 'Monto excede límite')
  .refine((v) => Math.round(v * 100) / 100 === v, 'Máximo 2 decimales');

/** Teléfono Perú: 9 dígitos */
export const phoneSchema = z
  .string()
  .regex(/^9\d{8}$/, 'Teléfono debe tener 9 dígitos comenzando con 9');

/** Email corporativo (opcional) */
export const emailSchema = z.string().email('Email inválido').optional();
