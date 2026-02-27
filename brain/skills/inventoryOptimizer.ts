/**
 * Inventory Optimizer skill — Demand forecasting, reorder points, stock management.
 * Owner: COO agent.
 */

import type { LLMClient } from './callTranscription.js';

export interface ReorderPoint { product: string; currentStock: number; reorderAt: number; orderQuantity: number; leadTimeDays: number; }
export interface InventoryOptimization {
  products: ReorderPoint[];
  totalInventoryValue: number;
  deadStockRisk: string[];
  turnoverRate: string;
  recommendations: string[];
  actionSteps: string[];
}

export interface InventoryOptions {
  products: Array<{ name: string; currentStock: number; monthlySales: number; cost: number; leadTimeDays?: number }>;
  currency?: string;
  language?: string;
}

const SYSTEM = 'You are an inventory management advisor for small businesses in Latin America. Optimize stock levels, identify dead stock, recommend reorder points. Default language: Spanish.';
const FORMAT = 'Respond with JSON: { "products": [{ "product": string, "currentStock": number, "reorderAt": number, "orderQuantity": number, "leadTimeDays": number }], "totalInventoryValue": number, "deadStockRisk": [string], "turnoverRate": string, "recommendations": [string], "actionSteps": [string] }';

export async function optimizeInventory(options: InventoryOptions, llmClient?: LLMClient): Promise<InventoryOptimization> {
  if (llmClient) {
    const prompt = `Inventory optimization:\n${JSON.stringify(options.products)}\n\n${FORMAT}`;
    const response = await llmClient.complete({ prompt, system: SYSTEM, tier: 'haiku' });
    try { return JSON.parse(response.text) as InventoryOptimization; } catch { /* fall through */ }
  }
  return {
    products: options.products.map(p => ({
      product: p.name, currentStock: p.currentStock,
      reorderAt: Math.ceil(p.monthlySales * (p.leadTimeDays ?? 7) / 30 * 1.5),
      orderQuantity: Math.ceil(p.monthlySales * 1.2),
      leadTimeDays: p.leadTimeDays ?? 7,
    })),
    totalInventoryValue: options.products.reduce((sum, p) => sum + p.currentStock * p.cost, 0),
    deadStockRisk: options.products.filter(p => p.currentStock > p.monthlySales * 3).map(p => p.name),
    turnoverRate: 'Calcula: Costo de ventas / Inventario promedio',
    recommendations: ['Revisa stock semanal', 'Identifica productos de baja rotación', 'Negocia plazos de pago con proveedores'],
    actionSteps: ['Actualiza conteo de inventario', 'Configura alertas de reorden en Kitz', 'Elimina stock muerto con descuentos'],
  };
}
