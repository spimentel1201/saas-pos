import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { AdjustCreditDto } from './customer.dto.js';

/**
 * Regresion: el ValidationPipe global corre con
 * `whitelist: true + forbidNonWhitelisted: true`. Toda propiedad de un DTO
 * de entrada DEBE tener al menos un decorador class-validator, si no la API
 * responde 400 "property X should not exist" y la UI no muestra ningun error.
 * Ver `apps/api/src/main.ts`.
 */
const PIPE_OPTS = { whitelist: true, forbidNonWhitelisted: true, transform: true };

describe('AdjustCreditDto', () => {
  it('acepta amount numerico', async () => {
    const dto = plainToInstance(AdjustCreditDto, { amount: 50, reason: 'abono' });
    const errors = await validate(dto, PIPE_OPTS);
    expect(errors).toHaveLength(0);
    expect(dto.amount).toBe(50);
  });

  it('acepta amount negativo (restar credito)', async () => {
    const dto = plainToInstance(AdjustCreditDto, { amount: -20 });
    const errors = await validate(dto, PIPE_OPTS);
    expect(errors).toHaveLength(0);
    expect(dto.amount).toBe(-20);
  });

  it('convierte amount string a number (envio desde form)', async () => {
    const dto = plainToInstance(AdjustCreditDto, { amount: '75.5' });
    const errors = await validate(dto, PIPE_OPTS);
    expect(errors).toHaveLength(0);
    expect(dto.amount).toBe(75.5);
  });

  it('rechaza amount no numerico', async () => {
    const dto = plainToInstance(AdjustCreditDto, { amount: 'abc' });
    const errors = await validate(dto, PIPE_OPTS);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('rechaza amount fuera de rango', async () => {
    const dto = plainToInstance(AdjustCreditDto, { amount: 1_000_001 });
    const errors = await validate(dto, PIPE_OPTS);
    expect(errors.length).toBeGreaterThan(0);
  });
});
