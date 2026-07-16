/**
 * Calcula el costo promedio ponderado al recibir mercancía.
 *
 * avgCost = (existencias_actuales * avgCost_actual + nueva_cantidad * nuevo_costo)
 *           / (existencias_actuales + nueva_cantidad)
 */
export function computeWeightedAvgCost(
  currentQty: number,
  currentAvgCost: number,
  receivedQty: number,
  unitCost: number,
): number {
  const totalQty = currentQty + receivedQty;
  if (totalQty <= 0) return 0;
  const totalValue = currentQty * currentAvgCost + receivedQty * unitCost;
  return Math.round((totalValue / totalQty) * 1_000_000) / 1_000_000;
}
