import type {
  JewelryComponent,
  JewelryCost,
  JewelryDesignInput,
  JewelryDesignProfile,
  JewelryMaterialLine,
  JewelryVariation,
} from "@workspace/api-zod";
import { JewelryCostCurrency, JewelryMaterialLinePriceSource } from "@workspace/api-zod";

type Bom = Map<string, number>;

const names: Record<string, string> = {
  "resin-flower": "Resin flower",
  "resin-blank": "Resin blank",
  "glass-blank": "Glass blank",
  "ceramic-blank": "Ceramic blank",
  "wood-blank": "Wood blank",
  "fabric-blank": "Fabric blank",
  "acrylic-blank": "Acrylic blank",
  "pearl-blank": "Pearl blank",
  "pearl-6mm": "6 mm pearl",
  "gold-hook": "Gold-tone earring hook",
  "silver-hook": "Silver-tone earring hook",
  "gold-stud": "Gold-tone earring stud",
  "silver-stud": "Silver-tone earring stud",
  "jump-ring": "Jump ring",
  adhesive: "Jewelry adhesive",
  "jewelry-card": "Jewelry card",
  pouch: "Jewelry pouch",
  chain: "Chain",
  "gold-chain": "Gold-tone chain",
  "silver-chain": "Silver-tone chain",
  "elastic-cord": "Elastic cord",
  "bead-6mm": "6 mm bead",
  charm: "Charm",
  clasp: "Clasp",
  "gold-clasp": "Gold-tone clasp",
  "silver-clasp": "Silver-tone clasp",
  "ring-base": "Ring base",
  "pendant-bail": "Pendant bail",
  "brooch-pin": "Brooch pin",
  "gold-pin": "Gold-tone pin",
  "silver-pin": "Silver-tone pin",
  keyring: "Key ring",
  "gold-keyring": "Gold-tone key ring",
  "silver-keyring": "Silver-tone key ring",
  "hair-clip": "Hair clip finding",
  "metal-base": "Metal base",
  "clay-blank": "Clay blank",
};

function requireNumber(value: number, field: string, integer = false): number {
  if (!Number.isFinite(value) || value < 0 || (integer && !Number.isSafeInteger(value))) {
    throw new Error(`${field} must be a non-negative${integer ? " safe integer" : " finite number"}.`);
  }
  return value;
}

function safe(value: number, field: string): number {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error(`${field} exceeds safe integer cents.`);
  return value;
}

function safeQuantity(value: number, field: string): number {
  if (!Number.isFinite(value) || value < 0 || value > Number.MAX_SAFE_INTEGER) {
    throw new Error(`${field} exceeds safe quantity limits.`);
  }
  return value;
}

function roundCents(value: number, field: string): number {
  return safe(Math.round(value), field);
}

function normalized(value: string): string {
  return value.trim().toLowerCase();
}

function sizeLength(input: JewelryDesignInput, type: "necklace" | "bracelet" | "anklet"): number {
  const size = normalized(input.size);
  const explicit = size.match(/\b(\d+(?:\.\d+)?)\s*cm\b/);
  if (explicit) return Number(explicit[1]);
  const scale = size.includes("small") || size.includes("short") ? 0 :
    size.includes("large") || size.includes("long") ? 2 : 1;
  return type === "necklace" ? [40, 45, 50][scale] :
    type === "bracelet" ? [16, 18, 20][scale] : [23, 25, 28][scale];
}

function explicitTone(input: JewelryDesignInput): "gold" | "silver" | null {
  const finding = normalized(input.finding);
  if (finding.includes("gold")) return "gold";
  if (finding.includes("silver")) return "silver";
  const color = normalized(input.color);
  if (color.includes("gold")) return "gold";
  if (color.includes("silver")) return "silver";
  return null;
}

function baseFor(material: string, floral: boolean): string {
  const value = normalized(material);
  if (value.includes("resin")) return floral ? "resin-flower" : "resin-blank";
  if (value.includes("clay")) return "clay-blank";
  if (value.includes("glass")) return "glass-blank";
  if (value.includes("ceramic")) return "ceramic-blank";
  if (value.includes("wood")) return "wood-blank";
  if (value.includes("fabric")) return "fabric-blank";
  if (value.includes("acrylic")) return "acrylic-blank";
  if (value.includes("pearl")) return "pearl-blank";
  if (value.includes("metal")) return "metal-base";
  throw new Error(`Unsupported jewelry material: ${material}`);
}

function makeBom(input: JewelryDesignInput): Bom {
  const bom: Bom = new Map();
  const add = (id: string, quantity: number) => bom.set(id, (bom.get(id) ?? 0) + quantity);
  const type = normalized(input.jewelryType);
  const decor = normalized(input.decoration);
  const finding = normalized(input.finding);
  const floral = normalized(input.shape).includes("flower") || decor.includes("flower") || decor.includes("floral");
  const base = baseFor(input.material, floral);
  const adhesiveBase = /resin|clay|glass|ceramic|wood|fabric|acrylic|pearl/.test(normalized(input.material));
  const earrings = /earring/.test(type);
  const necklace = /necklace/.test(type);
  const bracelet = /bracelet/.test(type);
  const ring = /ring/.test(type) && !/key/.test(type);
  const pendant = /pendant/.test(type);
  const brooch = /brooch|pin/.test(type);
  const keychain = /key.?chain|keyring/.test(type);
  const hair = /hair.?clip|hair.?accessor(?:y|ies)|barrette/.test(type);
  const anklet = /anklet/.test(type);
  const budget = decor.includes("budget / minimal");
  const premium = decor.includes("premium");
  const tone = explicitTone(input);
  const chainId = tone ? `${tone}-chain` : "chain";
  const claspTone = tone ?? (chainId === "chain" ? null : chainId.startsWith("silver") ? "silver" : "gold");
  const claspId = claspTone ? `${claspTone}-clasp` : "clasp";
  const claspSelected = finding.includes("clasp");

  if (earrings) {
    add(base, 2);
    if (decor.includes("pearl")) add("pearl-6mm", budget ? 2 : premium ? 6 : 4);
    else if (decor.includes("bead")) add("bead-6mm", budget ? 2 : premium ? 6 : 4);
    if (finding.includes("stud")) {
      add(`${tone ?? "gold"}-stud`, 2);
    } else if (finding.includes("hook")) {
      add(`${tone ?? "gold"}-hook`, 2);
      add("jump-ring", 4);
    } else {
      throw new Error(`Unsupported earring finding: ${input.finding}. Choose a hook or stud.`);
    }
    add("adhesive", 1);
  } else if (necklace || pendant || anklet) {
    add(base, 1);
    if (necklace || pendant || (anklet && (finding.includes("chain") || finding.includes("clasp")))) add(chainId, sizeLength(input, anklet ? "anklet" : "necklace"));
    else if (anklet) add("elastic-cord", sizeLength(input, "anklet"));
    if (pendant) add("pendant-bail", 1);
    if (!budget && decor.includes("pearl")) add("pearl-6mm", 1);
    if (!budget && decor.includes("bead")) add("bead-6mm", 1);
    if (!budget && (decor.includes("charm") || premium)) add("charm", 1);
    if (necklace || pendant || anklet || claspSelected) add(claspId, 1);
    if (adhesiveBase) add("adhesive", 1);
  } else if (bracelet) {
    add(base, 1);
    add(finding.includes("chain") ? chainId : "elastic-cord", sizeLength(input, "bracelet"));
    add(decor.includes("pearl") ? "pearl-6mm" : "bead-6mm", budget ? 4 : premium ? 8 : 6);
    if (!budget && (decor.includes("charm") || premium)) add("charm", 1);
    if (claspSelected || finding.includes("chain")) add(claspId, 1);
  } else if (ring) {
    add("ring-base", 1);
    add(base, 1);
    if (adhesiveBase) add("adhesive", 1);
  } else if (brooch) {
    add(finding.includes("pin") && tone ? `${tone}-pin` : "brooch-pin", 1);
    add(base, 1);
    if (adhesiveBase) add("adhesive", 1);
  } else if (keychain) {
    add(finding.includes("key") && tone ? `${tone}-keyring` : "keyring", 1);
    add(base, 1);
    if (adhesiveBase) add("adhesive", 1);
  } else if (hair) {
    add("hair-clip", 1);
    add(base, 1);
    if (adhesiveBase) add("adhesive", 1);
  } else {
    throw new Error(`Unsupported jewelry type: ${input.jewelryType}`);
  }

  if (!budget && decor.includes("pearl") && !bom.has("pearl-6mm")) add("pearl-6mm", 2);
  if (!budget && decor.includes("bead") && !bom.has("bead-6mm")) add("bead-6mm", 2);
  if (!budget && (decor.includes("charm") || premium) && !bom.has("charm")) add("charm", 1);
  if (decor.includes("double accent")) {
    const accent = decor.includes("pearl") ? "pearl-6mm" : decor.includes("bead") ? "bead-6mm" : "charm";
    add(accent, 1);
  }
  add("jewelry-card", 1);
  add("pouch", 1);
  return bom;
}

function calculate(
  input: JewelryDesignInput,
  components: JewelryComponent[],
): { materials: JewelryMaterialLine[]; cost: JewelryCost; warnings: string[] } {
  const bom = makeBom(input);
  const byId = new Map(components.map((component) => [component.id, component]));
  const materials: JewelryMaterialLine[] = [];
  const warnings: string[] = [];
  let allPriced = true;
  let raw = 0;
  for (const [id, perPiece] of bom) {
    const quantity = safeQuantity(perPiece * input.quantity, `${id} quantity`);
    const component = byId.get(id);
    if (!component || !component.active) {
      allPriced = false;
      warnings.push(`Required catalog component "${id}" is unavailable; it was not added to the BOM.`);
      continue;
    }
    const hasOverride = Object.prototype.hasOwnProperty.call(input.priceOverrides, id);
    const unitPrice = hasOverride ? input.priceOverrides[id] : component.priceCents;
    if (unitPrice !== null) requireNumber(unitPrice, `Price for ${id}`, true);
    const priceSource = hasOverride
      ? JewelryMaterialLinePriceSource.entered
      : unitPrice === null
        ? JewelryMaterialLinePriceSource.missing
        : JewelryMaterialLinePriceSource.configured;
    const lineCost = unitPrice === null ? null : roundCents(unitPrice * quantity, `${id} line cost`);
    if (lineCost === null) {
      allPriced = false;
      warnings.push(`Price is missing for ${component.name} (${id}).`);
    } else {
      raw = safe(raw + lineCost, "Raw materials total");
    }
    materials.push({
      componentId: id,
      name: component.name || names[id] || id,
      quantity,
      unit: component.unit,
      unitPriceCents: unitPrice,
      lineCostCents: lineCost,
      priceSource,
    });
  }
  const labor = roundCents(input.laborMinutes * input.hourlyRateCents / 60, "Labor");
  const packaging = safe(input.packagingCents, "Packaging");
  const other = safe(input.otherCents, "Other costs");
  let wastage: number | null = null;
  let production: number | null = null;
  let retail: number | null = null;
  let profit: number | null = null;
  let budgetRemaining: number | null = null;
  if (allPriced) {
    wastage = roundCents(raw * input.wastagePercent / 100, "Wastage");
    production = safe(raw + wastage + labor + packaging + other, "Production total");
    const feeAndMargin = input.marginPercent + input.platformFeePercent + input.paymentFeePercent;
    if (feeAndMargin >= 100) throw new Error("Margin and fee percentages must sum to less than 100.");
    retail = safe(Math.ceil(production / (1 - feeAndMargin / 100)), "Suggested retail");
    const fees = roundCents(retail * (input.platformFeePercent + input.paymentFeePercent) / 100, "Fees");
    profit = safe(retail - production - fees, "Estimated profit");
    if (input.budgetCents != null) {
      budgetRemaining = input.budgetCents - production;
      if (!Number.isSafeInteger(budgetRemaining)) throw new Error("Budget remaining exceeds safe integer cents.");
    }
  }
  return {
    materials,
    cost: {
      rawMaterialsCents: allPriced ? raw : null,
      wastageCents: wastage,
      laborCents: labor,
      packagingCents: packaging,
      otherCents: other,
      productionCents: production,
      suggestedRetailCents: retail,
      estimatedProfitCents: profit,
      budgetRemainingCents: budgetRemaining,
      currency: JewelryCostCurrency.PKR,
    },
    warnings,
  };
}

function copyWith(input: JewelryDesignInput, change: Partial<JewelryDesignInput>): JewelryDesignInput {
  return { ...input, priceOverrides: { ...input.priceOverrides }, ...change };
}

function assemblySteps(input: JewelryDesignInput): string[] {
  const type = normalized(input.jewelryType);
  const decor = normalized(input.decoration);
  const finding = normalized(input.finding);
  const steps = [`Prepare the ${input.size} ${input.shape} parts in ${input.material} and ${input.color}.`];
  if (/earring/.test(type)) {
    steps.push(decor.includes("flower")
      ? "Clean the two resin flower bases and allow the resin surfaces to cure before assembly."
      : "Prepare both earring bases and ensure their surfaces are clean and dry.");
    if (decor.includes("pearl") && decor.includes("flower")) steps.push("Attach the selected 6 mm pearls to the flower centers with a small amount of jewelry adhesive.");
    else if (decor.includes("pearl")) steps.push("Attach the selected 6 mm pearls to the prepared earring bases with listed adhesive.");
    if (decor.includes("bead")) steps.push("Arrange the selected beads on both earring bases and secure them with listed adhesive.");
    if (finding.includes("stud")) {
      steps.push(`Attach the two ${input.finding} findings to the earring backs; confirm that both posts and backs close securely.`);
    } else {
      steps.push(`Connect the two ${input.finding} hooks using four jump rings; close each ring laterally and check the joints.`);
    }
  } else if (/bracelet/.test(type)) {
    if (finding.includes("chain")) {
      steps.push(`Arrange the listed beads and thread them onto ${sizeLength(input, "bracelet")} cm of chain.`);
      steps.push("Attach the selected clasp, close all links, and test the fit and clasp securely.");
    } else {
      steps.push(`Arrange the listed beads in the ${input.style} pattern and thread them onto ${sizeLength(input, "bracelet")} cm of elastic cord.`);
      steps.push("Tie a secure knot, test the stretch and fit, then trim only the excess cord.");
    }
  } else if (/necklace/.test(type)) {
    steps.push(`Measure ${sizeLength(input, "necklace")} cm of chain for the ${input.size} necklace.`);
    steps.push("Attach any listed charm or centerpiece, then connect the selected clasp to the chain ends; close all links and test the clasp.");
  } else if (/anklet/.test(type)) {
    steps.push(finding.includes("chain")
      ? `Measure ${sizeLength(input, "anklet")} cm of the selected chain and attach the clasp to both ends.`
      : `Measure ${sizeLength(input, "anklet")} cm of elastic cord, thread the selected details, and secure the clasp or knot.`);
  } else if (/hair.?clip|hair.?accessor(?:y|ies)|barrette/.test(type)) {
    steps.push("Arrange the decoration on the hair-clip finding and secure it using only the listed catalog components.");
  } else if (/brooch|pin/.test(type)) {
    steps.push("Center the brooch pin on the back, attach it with the listed base and adhesive, and check that it opens and closes.");
  } else if (/key.?chain|keyring/.test(type)) {
    steps.push("Attach the decoration to the key ring, secure each connection, and pull-test the assembly.");
  } else if (/pendant/.test(type)) {
    steps.push(`Measure ${sizeLength(input, "necklace")} cm of chain, fit the pendant bail, then attach and test the clasp.`);
  } else if (/ring/.test(type)) {
    steps.push("Center the design on the ring base, secure it with listed adhesive, and verify the fit after curing.");
  }
  if (input.personalization?.trim()) steps.push(`Proof and apply the personalization “${input.personalization.trim()}” before final assembly.`);
  steps.push("Inspect joins and edges; use jewelry cards and pouches only when listed in the catalog.");
  return steps;
}

export function createJewelryProfile(
  input: JewelryDesignInput,
  components: JewelryComponent[],
): JewelryDesignProfile {
  requireNumber(input.quantity, "Quantity", true);
  if (input.quantity < 1 || input.quantity > 100) throw new Error("Quantity must be between 1 and 100.");
  requireNumber(input.budgetCents ?? 0, "Budget", true);
  requireNumber(input.laborMinutes, "Labor minutes");
  requireNumber(input.hourlyRateCents, "Hourly rate", true);
  requireNumber(input.packagingCents, "Packaging", true);
  requireNumber(input.otherCents, "Other costs", true);
  requireNumber(input.wastagePercent, "Wastage percent");
  requireNumber(input.marginPercent, "Margin percent");
  requireNumber(input.platformFeePercent, "Platform fee percent");
  requireNumber(input.paymentFeePercent, "Payment fee percent");
  if (input.wastagePercent > 100 || input.marginPercent > 99 || input.platformFeePercent > 99 ||
      input.paymentFeePercent > 99) throw new Error("Percentage is outside its allowed range.");
  for (const [id, cents] of Object.entries(input.priceOverrides)) {
    requireNumber(cents, `Price override for ${id}`, true);
  }
  const primary = calculate(input, components);
  const personalization = input.personalization?.trim();
  const selection = `${input.style} ${input.shape} ${input.material} ${input.color} ${input.decoration} ${input.finding} ${input.size}`;
  const type = normalized(input.jewelryType);
  const minimalLengthType = /necklace/.test(type) ? "necklace" :
    /bracelet/.test(type) ? "bracelet" : /anklet/.test(type) ? "anklet" : null;
  const minimalSize = minimalLengthType
    ? `${Math.max(minimalLengthType === "necklace" ? 30 : 10, sizeLength(input, minimalLengthType) - (minimalLengthType === "necklace" ? 5 : 2))} cm`
    : input.size;
  const variantInputs = [
    copyWith(input, { decoration: `Budget / minimal ${input.decoration}`, style: `${input.style} minimal`, size: minimalSize }),
    copyWith(input, { decoration: `Premium ${input.decoration} with extra charm accent`, style: `${input.style} premium` }),
  ];
  const variations: JewelryVariation[] = variantInputs.map((variantInput, index) => {
    const result = calculate(variantInput, components);
    return {
      label: index === 0 ? "Budget / Minimal" : "Premium",
      input: variantInput,
      description: `${variantInput.style} ${variantInput.shape} ${variantInput.material} design with ${variantInput.decoration}; color ${variantInput.color}.`,
      materials: result.materials,
      cost: result.cost,
      instructions: assemblySteps(variantInput),
    };
  });
  const warnings = [...new Set(primary.warnings)];
  if (personalization) warnings.push("Personalized details require manual proofing before production.");
  if (primary.cost.budgetRemainingCents !== null && primary.cost.budgetRemainingCents < 0) warnings.push("Estimated production cost exceeds the supplied budget.");
  if (primary.materials.length > 12) warnings.push("This design uses an unusually high number of catalog components.");
  warnings.push("Finished weight is unverified; no weight estimate is provided.");
  if (input.packagingCents > 0) warnings.push("Packaging cost is additional overhead; jewelry cards and pouches are already costed separately when listed in the material BOM.");
  const difficulty = primary.materials.length >= 8 || Boolean(personalization) ? "Advanced" :
    primary.materials.length >= 5 ? "Intermediate" : "Beginner";
  const instructions = assemblySteps(input);
  return {
    name: `${input.style} ${input.shape} ${input.jewelryType}`,
    description: `${input.size} ${input.material} ${input.jewelryType} in ${input.color}, featuring ${input.decoration}, a ${input.finding}, and ${input.shape} form${personalization ? ` personalized with ${personalization}` : ""}.`,
    input: { ...input, priceOverrides: { ...input.priceOverrides } },
    materials: primary.materials,
    cost: primary.cost,
    instructions,
    suggestions: [
      `Keep the ${input.style} and ${input.shape} consistent across the ${input.quantity}-piece batch.`,
      "Confirm fit and finish on one sample before assembling the full batch.",
    ],
    warnings,
    variations,
    difficulty,
    estimatedMinutes: safe(Math.ceil(input.laborMinutes * input.quantity), "Estimated minutes"),
    previewLabel: `${input.color} ${input.material} ${input.shape} ${input.jewelryType} — ${selection}`,
  };
}