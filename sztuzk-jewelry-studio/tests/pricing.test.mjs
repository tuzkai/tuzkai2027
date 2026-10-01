import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculateJewelryPrice } from '../src/lib/pricing.ts';

const input = (overrides = {}) => ({
  rows: [{ name: 'Pearls', quantity: '2', unitCost: '100' }],
  laborHours: '1',
  laborRate: '50',
  packaging: '25',
  other: '25',
  margin: '30',
  marketplace: '10',
  payment: '5',
  currency: 'PKR',
  ...overrides,
});

test('price accounts for costs, desired margin and both selling fees', () => {
  const outcome = calculateJewelryPrice(input());
  assert.equal(outcome.ok, true);
  assert.equal(outcome.result.totalProductionCost, 300);
  assert.equal(outcome.result.materialCost, 200);
  assert.equal(outcome.result.laborCost, 50);
  assert.ok(Math.abs(outcome.result.suggestedSellingPrice - 300 / 0.55) < 1e-9);
  assert.ok(Math.abs(outcome.result.estimatedFees - (300 / 0.55) * 0.15) < 1e-9);
  assert.ok(Math.abs(outcome.result.estimatedProfit - (300 / 0.55) * 0.30) < 1e-9);
  assert.ok(Math.abs(outcome.result.profitMargin - 30) < 1e-9);
});

test('zero fees and zero desired margin return cost as price', () => {
  const outcome = calculateJewelryPrice(input({ margin: '0', marketplace: '0', payment: '0', currency: 'USD' }));
  assert.equal(outcome.ok, true);
  assert.equal(outcome.result.currency, 'USD');
  assert.equal(outcome.result.suggestedSellingPrice, 300);
  assert.equal(outcome.result.estimatedProfit, 0);
});

test('negative, blank, nonfinite and malformed values are rejected', () => {
  for (const bad of ['-1', '', 'Infinity', 'not a number']) {
    assert.equal(calculateJewelryPrice(input({ laborHours: bad })).ok, false, bad);
  }
  assert.equal(calculateJewelryPrice(input({ rows: [{ name: 'Pearls', quantity: '2', unitCost: '-2' }] })).ok, false);
});

test('percentages at or over 100 and zero costs are rejected', () => {
  assert.equal(calculateJewelryPrice(input({ margin: '85' })).ok, false);
  assert.equal(calculateJewelryPrice(input({ margin: '100', marketplace: '0', payment: '0' })).ok, false);
  assert.equal(calculateJewelryPrice(input({ rows: [], laborHours: '0', packaging: '0', other: '0' })).ok, false);
});

test('huge arithmetic and unknown currencies fail explicitly', () => {
  assert.equal(calculateJewelryPrice(input({ currency: 'EUR' })).ok, false);
  assert.equal(calculateJewelryPrice(input({ rows: [{ name: 'Pearls', quantity: '1e308', unitCost: '1e308' }] })).ok, false);
  assert.equal(calculateJewelryPrice(input({ rows: [{ name: 'Pearls', quantity: '1e308', unitCost: '1' }], margin: '99.99999999999', marketplace: '0', payment: '0' })).ok, false);
});