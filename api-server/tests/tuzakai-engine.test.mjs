import assert from "node:assert/strict";
import { after, test } from "node:test";
import { build } from "esbuild";
import { tmpdir } from "node:os";
import { rm } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const bundledEngine = path.join(tmpdir(), `tuzakai-engine-${process.pid}.mjs`);
await build({
  entryPoints: [new URL("../src/lib/tuzakai-engine.ts", import.meta.url).pathname],
  bundle: true,
  platform: "node",
  format: "esm",
  outfile: bundledEngine,
  logLevel: "silent",
});
const { createJewelryProfile } = await import(pathToFileURL(bundledEngine).href);
after(() => rm(bundledEngine, { force: true }));

const ids = [
  "resin-flower", "resin-blank", "glass-blank", "ceramic-blank", "wood-blank",
  "fabric-blank", "acrylic-blank", "pearl-blank", "pearl-6mm", "gold-hook", "silver-hook",
  "gold-stud", "silver-stud", "jump-ring", "adhesive", "jewelry-card", "pouch", "chain",
  "gold-chain", "silver-chain", "elastic-cord", "bead-6mm", "charm", "clasp", "gold-clasp",
  "silver-clasp", "ring-base", "pendant-bail", "brooch-pin", "gold-pin", "silver-pin",
  "keyring", "gold-keyring", "silver-keyring", "hair-clip", "metal-base", "clay-blank",
];
const components = ids.map((id) => ({
  id, name: id, category: "test", jewelryTypes: [], material: "mixed", color: "mixed",
  size: "mixed", unit: id === "chain" || id === "elastic-cord" ? "cm" : "piece",
  priceCents: id === "chain" ? 3 : 10, supplier: null, supplierUrl: null, imageUrl: null,
  weightGrams: null, inventoryQuantity: null, notes: "", active: true,
}));
const input = (change = {}) => ({
  jewelryType: "Earrings", style: "Classic", shape: "Round", material: "Resin",
  color: "Pink", decoration: "Flower", finding: "Gold tone hook", size: "Medium",
  quantity: 1, priceOverrides: {}, wastagePercent: 0, laborMinutes: 30,
  hourlyRateCents: 100, packagingCents: 0, otherCents: 0,
  marginPercent: 20, platformFeePercent: 3, paymentFeePercent: 2,
  ...change,
});

test("flower earrings use resin flowers without unselected pearls", () => {
  const profile = createJewelryProfile(input(), components);
  const bom = Object.fromEntries(profile.materials.map(({ componentId, quantity }) => [componentId, quantity]));
  assert.equal(bom["resin-flower"], 2);
  assert.equal(bom["gold-hook"], 2);
  assert.equal(bom["jump-ring"], 4);
  assert.equal(bom["pearl-6mm"], undefined);
});

test("pearl flower earrings, hair accessories, and type-specific assembly are supported", () => {
  const earrings = createJewelryProfile(input({ decoration: "Pearl flower" }), components);
  assert.equal(earrings.materials.find((line) => line.componentId === "pearl-6mm").quantity, 4);
  assert.ok(earrings.instructions.some((step) => step.includes("pearls")));
  const hair = createJewelryProfile(input({ jewelryType: "Hair accessory" }), components);
  assert.equal(hair.materials.find((line) => line.componentId === "hair-clip").quantity, 1);
  assert.ok(hair.instructions.some((step) => step.includes("hair-clip")));
});

test("all nine supported main materials use their matching catalog blank", () => {
  const expected = new Map([
    ["Resin", "resin-flower"], ["Clay", "clay-blank"], ["Glass", "glass-blank"],
    ["Ceramic", "ceramic-blank"], ["Wood", "wood-blank"], ["Fabric", "fabric-blank"],
    ["Acrylic", "acrylic-blank"], ["Pearl", "pearl-blank"], ["Metal", "metal-base"],
  ]);
  for (const [material, id] of expected) {
    const profile = createJewelryProfile(input({ material }), components);
    assert.ok(profile.materials.some((line) => line.componentId === id), `${material} should use ${id}`);
  }
  assert.throws(() => createJewelryProfile(input({ material: "Unknown" }), components), /Unsupported jewelry material/);
});

test("selected finding changes BOM to its matching tone and hardware", () => {
  const goldHook = createJewelryProfile(input({ finding: "Gold tone hook" }), components);
  const silverStud = createJewelryProfile(input({ finding: "Silver stud" }), components);
  assert.ok(goldHook.materials.some((line) => line.componentId === "gold-hook"));
  assert.ok(silverStud.materials.some((line) => line.componentId === "silver-stud"));
  assert.ok(!silverStud.materials.some((line) => line.componentId === "silver-hook"));
  assert.ok(!silverStud.materials.some((line) => line.componentId === "jump-ring"));

  const goldChain = createJewelryProfile(input({ jewelryType: "Necklace", finding: "Gold chain", color: "Silver" }), components);
  const silverClasp = createJewelryProfile(input({ jewelryType: "Necklace", finding: "Silver clasp" }), components);
  assert.ok(goldChain.materials.some((line) => line.componentId === "gold-chain"));
  assert.ok(goldChain.materials.some((line) => line.componentId === "gold-clasp"));
  assert.ok(silverClasp.materials.some((line) => line.componentId === "silver-clasp"));
  assert.ok(!silverClasp.materials.some((line) => line.componentId === "gold-clasp"));
  const chainBracelet = createJewelryProfile(input({ jewelryType: "Bracelet", finding: "Silver chain" }), components);
  assert.ok(chainBracelet.materials.some((line) => line.componentId === "silver-chain"));
  assert.ok(!chainBracelet.materials.some((line) => line.componentId === "elastic-cord"));

  const pendant = createJewelryProfile(input({ jewelryType: "Pendant", finding: "Silver chain" }), components);
  assert.ok(pendant.materials.some((line) => line.componentId === "silver-chain"));
  assert.ok(pendant.materials.some((line) => line.componentId === "pendant-bail"));
});

test("each supported jewelry type creates a type-appropriate finding BOM", () => {
  const cases = [
    ["Earrings", "Gold hook", "gold-hook"],
    ["Necklace", "Gold chain", "gold-chain"],
    ["Bracelet", "Silver clasp", "silver-clasp"],
    ["Ring", "Ring band", "ring-base"],
    ["Pendant", "Silver chain", "silver-chain"],
    ["Brooch", "Gold pin", "gold-pin"],
    ["Keychain", "Silver keyring", "silver-keyring"],
    ["Hair accessory", "Hair clip", "hair-clip"],
    ["Anklet", "Gold chain", "gold-chain"],
  ];
  for (const [jewelryType, finding, expectedId] of cases) {
    const profile = createJewelryProfile(input({ jewelryType, finding }), components);
    assert.ok(profile.materials.some((line) => line.componentId === expectedId), `${jewelryType} should include ${expectedId}`);
  }
});

test("chain and elastic BOM lengths follow the jewelry type and size", () => {
  const necklace = createJewelryProfile(input({ jewelryType: "Necklace", finding: "Clasp" }), components);
  assert.equal(necklace.materials.find((line) => line.componentId === "chain").quantity, 45);
  assert.ok(necklace.instructions.some((step) => step.includes("45 cm of chain")));
  const bracelet = createJewelryProfile(input({ jewelryType: "Bracelet" }), components);
  assert.equal(bracelet.materials.find((line) => line.componentId === "elastic-cord").quantity, 18);
  assert.ok(bracelet.instructions.some((step) => step.includes("18 cm of elastic cord")));
});

test("fractional chain lengths round line costs at the cent boundary", () => {
  const necklace = createJewelryProfile(input({ jewelryType: "Necklace", finding: "Clasp", size: "45.5 cm" }), components);
  const chain = necklace.materials.find((line) => line.componentId === "chain");
  assert.equal(chain.quantity, 45.5);
  assert.equal(chain.lineCostCents, 137);
});

test("budget and premium variations alter BOM and cost; packaging is explicitly additional", () => {
  const bracelet = createJewelryProfile(input({
    jewelryType: "Bracelet", packagingCents: 25, budgetCents: 0,
  }), components);
  const minimal = bracelet.variations[0];
  const premium = bracelet.variations[1];
  assert.equal(minimal.label, "Budget / Minimal");
  assert.equal(premium.label, "Premium");
  assert.equal(minimal.materials.find((line) => line.componentId === "bead-6mm").quantity, 4);
  assert.equal(premium.materials.find((line) => line.componentId === "bead-6mm").quantity, 8);
  assert.notEqual(minimal.cost.productionCents, premium.cost.productionCents);
  assert.ok(bracelet.warnings.some((warning) => warning.includes("additional overhead")));
  assert.ok(bracelet.cost.budgetRemainingCents < 0);
});