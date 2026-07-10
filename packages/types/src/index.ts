/**
 * @pos/types - tipos compartidos API <-> web <-> workers.
 *
 * Solo tipos y enums puramente TypeScript. Sin logica de runtime (excepto
 * constantes enum) para que el bundle del frontend se mantenga ligero.
 */
export * from './enums.js';
export * from './dto.js';
export * from './storage.js';
