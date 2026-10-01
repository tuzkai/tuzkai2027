import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  generateBusinessPlan,
  generateJewelryIdea,
  formatResult,
  ideaToDesignMaterial,
  ideaToDesignType,
  preferredIdeaTypes,
} from '../src/lib/studio.ts';

test('multiple business categories constrain the generated ideas', () => {
  const selected = preferredIdeaTypes(['Earrings', 'Necklaces', 'Resin Jewelry']);
  assert.deepEqual(selected, ['Earrings', 'Necklaces']);
  const ideas = generateJewelryIdea({
    type: 'All',
    preferredTypes: selected,
    style: 'Modern',
    color: 'Blue',
    material: 'Gemstone',
    skill: 'Beginner',
  }, 10);
  assert.equal(ideas.length, 10);
  assert.deepEqual(new Set(ideas.map((idea) => idea.type)), new Set(['Earrings', 'Necklaces']));
  assert.ok(ideas.every((idea) => idea.color === 'Blue' && idea.material === 'Gemstone'));

  const plan = generateBusinessPlan({
    types: ['Earrings', 'Necklaces'],
    style: 'Luxury',
    budget: 'Under PKR 10,000',
    channel: 'Etsy',
    experience: 'Beginner',
    customer: 'Women',
    goal: 'Small Home Business',
  });
  assert.match(plan.recommendedNiche, /beginner-friendly luxury earrings & necklaces for women/i);
  assert.ok(plan.productIdeas.every((idea) => /Earrings|Necklaces/.test(idea)));
  assert.ok(plan.productIdeas.every((idea) => /Luxury.*Pearl.*Beginner/.test(idea)));
  assert.match(plan.estimatedStartingBudget, /Under PKR 10,000.*small test quantities/i);
  assert.match(plan.suggestedSellingChannels, /Etsy.*fees/);
  assert.match(plan.planningSummary, /small home business/);
});

test('an idea uses design-select-compatible type and material names', () => {
  assert.equal(ideaToDesignType('Rings'), 'Ring');
  assert.equal(ideaToDesignType('Pendants'), 'Pendant');
  assert.equal(ideaToDesignType('Earrings'), 'Earrings');
  assert.equal(ideaToDesignMaterial('Gemstone'), 'Gemstones');
  assert.equal(ideaToDesignMaterial('Pearl'), 'Pearl');
});

test('the requested luxury earrings path is specific without inventing product prices', () => {
  const plan = generateBusinessPlan({
    types: ['Earrings'],
    style: 'Luxury',
    budget: 'Under PKR 10,000',
    channel: 'Etsy',
    experience: 'Beginner',
    customer: 'Women',
    goal: 'Side Income',
  });
  assert.match(plan.recommendedNiche, /beginner-friendly luxury earrings for women/i);
  assert.ok(plan.productIdeas.every((idea) => /Luxury.*Pearl.*Beginner.*women/.test(idea)));
  const ideas = generateJewelryIdea({type:'Earrings',style:'Luxury',color:'Pink',material:'Resin',skill:'Beginner',occasion:'Gift'},5);
  assert.ok(ideas.every((idea) => idea.type==='Earrings' && idea.style==='Luxury' && idea.material==='Resin' && idea.color==='Pink' && idea.skill==='Beginner' && idea.occasion==='Gift'));
  assert.ok(ideas.every((idea) => /actual quantities and supplier costs/.test(idea.estimatedMaterialCostRange) && /your own material, labor and selling costs/.test(idea.suggestedRetailPriceRange)));
  assert.ok(ideas.every((idea) => !/PKR \d/.test(`${idea.estimatedMaterialCostRange} ${idea.suggestedRetailPriceRange}`)));
});

test('pricing downloads render nested costs as readable text', () => {
  const text = formatResult('Sample estimate', {
    product: 'Sample Earrings',
    inputs: {rows: [{name:'Pearls',quantity:'2',unitCost:'100'}]},
    result: {materialCost:200,suggestedSellingPrice:285.71},
  });
  assert.match(text, /Pearls/);
  assert.match(text, /Quantity: 2/);
  assert.match(text, /Suggested Selling Price: 285.71/);
  assert.doesNotMatch(text, /\[object Object\]/);
});