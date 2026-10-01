export type MaterialCostRow = {
  name: string;
  quantity: string;
  unitCost: string;
};

export type PricingInput = {
  rows: MaterialCostRow[];
  laborHours: string;
  laborRate: string;
  packaging: string;
  other: string;
  margin: string;
  marketplace: string;
  payment: string;
  currency: string;
};

export type PricingResult = {
  currency: 'PKR' | 'USD';
  materialCost: number;
  laborCost: number;
  packaging: number;
  otherExpenses: number;
  totalProductionCost: number;
  suggestedSellingPrice: number;
  estimatedFees: number;
  estimatedProfit: number;
  profitMargin: number;
};

export type PricingOutcome =
  | { ok: true; result: PricingResult }
  | { ok: false; error: string };

/** Fees and desired profit margin are each percentages of the selling price. */
export function calculateJewelryPrice(input: PricingInput): PricingOutcome {
  const values = [
    ...input.rows.flatMap((row) => [row.quantity, row.unitCost]),
    input.laborHours,
    input.laborRate,
    input.packaging,
    input.other,
    input.margin,
    input.marketplace,
    input.payment,
  ];

  if (values.some((value) => value.trim() === '' || !Number.isFinite(Number(value)) || Number(value) < 0)) {
    return { ok: false, error: 'Enter valid non-negative numbers in every cost field.' };
  }
  if (input.currency !== 'PKR' && input.currency !== 'USD') {
    return { ok: false, error: 'Choose PKR or USD as the currency.' };
  }

  const combinedPercent = Number(input.margin) + Number(input.marketplace) + Number(input.payment);
  if (combinedPercent >= 100) {
    return { ok: false, error: 'Your combined profit margin and fees must be less than 100%. Reduce one or more percentages.' };
  }

  const materialCost = input.rows.reduce(
    (sum, row) => sum + Number(row.quantity) * Number(row.unitCost),
    0,
  );
  const laborCost = Number(input.laborHours) * Number(input.laborRate);
  const packaging = Number(input.packaging);
  const otherExpenses = Number(input.other);
  const totalProductionCost = materialCost + laborCost + packaging + otherExpenses;

  if (!Number.isFinite(totalProductionCost)) {
    return { ok: false, error: 'The entered costs are too large to calculate.' };
  }
  if (totalProductionCost <= 0) {
    return { ok: false, error: 'Enter at least one material, labor, packaging or other cost before calculating.' };
  }

  const suggestedSellingPrice = totalProductionCost / (1 - combinedPercent / 100);
  const estimatedFees = suggestedSellingPrice * (Number(input.marketplace) + Number(input.payment)) / 100;
  const estimatedProfit = suggestedSellingPrice - totalProductionCost - estimatedFees;
  if (![suggestedSellingPrice, estimatedFees, estimatedProfit].every(Number.isFinite)) {
    return { ok: false, error: 'The resulting price is too large to calculate. Reduce the costs or percentages.' };
  }
  return {
    ok: true,
    result: {
      currency: input.currency,
      materialCost,
      laborCost,
      packaging,
      otherExpenses,
      totalProductionCost,
      suggestedSellingPrice,
      estimatedFees,
      estimatedProfit,
      profitMargin: estimatedProfit / suggestedSellingPrice * 100,
    },
  };
}