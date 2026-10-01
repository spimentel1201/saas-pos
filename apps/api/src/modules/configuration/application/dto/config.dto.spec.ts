import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { CreateTaxDto, UpdateTaxDto } from './config.dto.js';

/**
 * Regresion: el ValidationPipe global corre con
 * `whitelist: true + forbidNonWhitelisted: true`. Toda propiedad de un DTO
 * de entrada DEBE tener al menos un decorador class-validator, si no la API
 * responde 400 "property X should not exist" y la UI no muestra ningun error.
 * Ver `apps/api/src/main.ts`.
 *
 * La tasa se almacena como fraccion para PERCENT (18% => 0.18).
 */
const PIPE_OPTS = { whitelist: true, forbidNonWhitelisted: true, transform: true };

describe('CreateTaxDto', () => {
  it('acepta rate como fraccion (18% = 0.18)', async () => {
    const dto = plainToInstance(CreateTaxDto, {
      name: 'IGV 18%',
      rate: 0.18,
      type: 'PERCENT',
    });
    const errors = await validate(dto, PIPE_OPTS);
    expect(errors).toHaveLength(0);
    expect(dto.rate).toBe(0.18);
  });

  it('convierte rate string a number', async () => {
    const dto = plainToInstance(CreateTaxDto, { name: 'IVA', rate: '0.16', type: 'PERCENT' });
    const errors = await validate(dto, PIPE_OPTS);
    expect(errors).toHaveLength(0);
    expect(dto.rate).toBe(0.16);
  });

  it('rechaza rate negativo', async () => {
    const dto = plainToInstance(CreateTaxDto, { name: 'x', rate: -1, type: 'PERCENT' });
    const errors = await validate(dto, PIPE_OPTS);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('rechaza rate mayor que numeric(5,4)', async () => {
    const dto = plainToInstance(CreateTaxDto, { name: 'x', rate: 10, type: 'FIXED' });
    const errors = await validate(dto, PIPE_OPTS);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('rechaza name vacio', async () => {
    const dto = plainToInstance(CreateTaxDto, { name: '', rate: 0.18, type: 'PERCENT' });
    const errors = await validate(dto, PIPE_OPTS);
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('UpdateTaxDto', () => {
  it('acepta rate parcial', async () => {
    const dto = plainToInstance(UpdateTaxDto, { rate: 0.19 });
    const errors = await validate(dto, PIPE_OPTS);
    expect(errors).toHaveLength(0);
    expect(dto.rate).toBe(0.19);
  });

  it('acepta payload vacio', async () => {
    const dto = plainToInstance(UpdateTaxDto, {});
    const errors = await validate(dto, PIPE_OPTS);
    expect(errors).toHaveLength(0);
  });
});
