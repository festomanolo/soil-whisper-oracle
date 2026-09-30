// Mbolea Sahihi prescription: turns a soil reading + crop + farm size into a
// costed shopping list (products, kg, bags, timing) and a return estimate.

import {
  FERTILIZERS, MARKET_PRICES,
  type CropId, type FertilizerId, type TzCrop, type TzRegion,
} from '../../data/tz';
import { RATE_FACTOR, limeRequirement, readSoil, type LimeAdvice, type SoilInput, type SoilReading, type Texture } from './soil';

export const HA_PER_ACRE = 0.4047;
/** A soda bottle cap holds roughly 5 g of granular fertilizer – a common field measure. */
export const GRAMS_PER_CAP = 5;
/** Doses below this (kg/ha) are not worth buying or spreading; skip them. */
const MIN_DOSE_KG_HA = 25;

export type Stage = 'preplant' | 'basal' | 'topdress';

export interface PrescriptionLine {
  product: FertilizerId;
  stage: Stage;
  kgPerHa: number;
  kgTotal: number;
  bags: number;
  cost: number;
  gramsPerPlant: number | null;
}

export interface PriceBook {
  /** TZS per 50 kg bag */
  fertilizer: Record<FertilizerId, number>;
  /** TZS per kg at farm gate */
  crop: Record<CropId, number>;
}

export interface Prescription {
  crop: TzCrop;
  region: TzRegion;
  areaAcres: number;
  areaHa: number;
  soil: SoilInput;
  reading: SoilReading;
  texture: Texture;
  target: { n: number; p2o5: number; k2o: number };
  supplied: { n: number; p2o5: number; k2o: number };
  lines: PrescriptionLine[];
  lime: (LimeAdvice & { kgTotal: number; bags: number; cost: number }) | null;
  fertilizerCost: number;
  totalCost: number;
  economics: {
    extraYieldKg: number;
    pricePerKg: number;
    extraIncome: number;
    /** value-cost ratio; ≥ 2 is the usual profitability threshold */
    vcr: number;
  } | null;
  official: boolean;
  noRecommendation: boolean;
}

/** Farm-gate crop price: user override → WFP regional median → WFP national → reference. */
export function defaultCropPrice(crop: TzCrop, regionId: string): number {
  if (crop.price.wfp) {
    const wholesale = MARKET_PRICES.byRegion[regionId]?.[crop.price.wfp] ?? MARKET_PRICES.national[crop.price.wfp];
    if (wholesale) return Math.round(wholesale * crop.price.farmgateFactor);
  }
  return crop.price.referenceTzsPerKg ?? 0;
}

const round1 = (x: number) => Math.round(x * 10) / 10;

export function buildPrescription(opts: {
  crop: TzCrop;
  region: TzRegion;
  soil: SoilInput;
  areaAcres: number;
  texture: Texture;
  prices: PriceBook;
  /** 0..100 from the suitability engine; scales the expected yield response */
  suitability: number;
}): Prescription {
  const { crop, region, soil, areaAcres, texture, prices, suitability } = opts;
  const areaHa = areaAcres * HA_PER_ACRE;
  const reading = readSoil(soil);
  const lines: PrescriptionLine[] = [];

  const lime = limeRequirement(soil, crop, texture);
  const acidic = soil.ph < 5.5;
  const slightlyAcidic = soil.ph < 6.0;

  const addLine = (product: FertilizerId, stage: Stage, kgPerHa: number) => {
    if (kgPerHa < 1) return;
    const f = FERTILIZERS[product];
    const kgTotal = kgPerHa * areaHa;
    const perPlant = (kgPerHa * 1000) / crop.plantsPerHa;
    lines.push({
      product, stage,
      kgPerHa: Math.round(kgPerHa),
      kgTotal: round1(kgTotal),
      bags: round1(kgTotal / f.bagKg),
      cost: Math.round((kgTotal / f.bagKg) * prices.fertilizer[product]),
      // Only meaningful for widely spaced crops; tiny doses are broadcast/banded.
      gramsPerPlant: crop.plantsPerHa <= 60000 && perPlant >= 1 ? round1(perPlant) : null,
    });
  };

  let target = { n: 0, p2o5: 0, k2o: 0 };
  if (crop.nutrients) {
    target = {
      n: Math.round(crop.nutrients.n * RATE_FACTOR.n[reading.n]),
      p2o5: Math.round(crop.nutrients.p2o5 * RATE_FACTOR.p[reading.p]),
      k2o: Math.round(crop.nutrients.k2o * RATE_FACTOR.k[reading.k]),
    };
    // Low-K soils: give non-legume crops a modest K dose even when the official rate has none.
    if (target.k2o === 0 && reading.k === 'low' && !crop.legume) target.k2o = 30;

    const left = { ...target };
    const take = (product: FertilizerId, stage: Stage, kgPerHa: number) => {
      if (kgPerHa < MIN_DOSE_KG_HA) return;
      const f = FERTILIZERS[product];
      left.n -= (kgPerHa * f.n) / 100;
      left.p2o5 -= (kgPerHa * f.p2o5) / 100;
      left.k2o -= (kgPerHa * f.k2o) / 100;
      addLine(product, stage, kgPerHa);
    };

    // 1. Potassium via NPK 17-17-17, sized so it never oversupplies P.
    if (left.k2o > 5) {
      const kg = Math.min(left.k2o, left.p2o5 > 0 ? left.p2o5 : left.k2o) / 0.17;
      take('npk171717', 'basal', kg);
      if (left.k2o > 5) take('mop', 'basal', left.k2o / 0.6);
    }
    // 2. Phosphorus at planting. Acid soils get Minjingu (calcium, non-acidifying);
    //    legumes get TSP so we don't feed nitrogen they fix themselves.
    if (left.p2o5 > 2) {
      const source: FertilizerId = acidic ? 'minjingu' : crop.legume ? 'tsp' : 'dap';
      take(source, 'basal', left.p2o5 / (FERTILIZERS[source].p2o5 / 100));
    }
    // 3. Remaining nitrogen as top dressing. CAN on acidifying-risk soils, urea otherwise.
    if (left.n > 2) {
      const source: FertilizerId = slightlyAcidic ? 'can' : 'urea';
      take(source, 'topdress', left.n / (FERTILIZERS[source].n / 100));
    }
  }

  const supplied = lines.reduce((s, l) => {
    const f = FERTILIZERS[l.product];
    return {
      n: s.n + (l.kgPerHa * f.n) / 100,
      p2o5: s.p2o5 + (l.kgPerHa * f.p2o5) / 100,
      k2o: s.k2o + (l.kgPerHa * f.k2o) / 100,
    };
  }, { n: 0, p2o5: 0, k2o: 0 });

  let limeLine: Prescription['lime'] = null;
  if (lime) {
    const kgTotal = lime.tPerHa * 1000 * areaHa;
    const bags = kgTotal / FERTILIZERS.lime.bagKg;
    limeLine = { ...lime, kgTotal: Math.round(kgTotal), bags: round1(bags), cost: Math.round(bags * prices.fertilizer.lime) };
  }

  const fertilizerCost = lines.reduce((s, l) => s + l.cost, 0);
  const totalCost = fertilizerCost + (limeLine?.cost ?? 0);

  // Yield response: a share of the gap between typical and attainable yield.
  // Poorer soils respond more; poor climate fit responds less.
  let economics: Prescription['economics'] = null;
  if (crop.nutrients && fertilizerCost > 0) {
    const response = reading.n === 'low' || reading.p === 'low' ? 0.6
      : reading.n === 'high' && reading.p === 'high' ? 0.35 : 0.5;
    const limeBoost = lime ? 1.15 : 1;
    const gapT = (crop.yield.attainable - crop.yield.typical) * response * limeBoost * (suitability / 100);
    const extraYieldKg = Math.round(gapT * 1000 * areaHa);
    const pricePerKg = prices.crop[crop.id];
    const extraIncome = extraYieldKg * pricePerKg;
    // Lime keeps working for ~3 seasons, so only a third of it is charged to this crop.
    const seasonCost = fertilizerCost + (limeLine?.cost ?? 0) / 3;
    economics = { extraYieldKg, pricePerKg, extraIncome, vcr: round1(extraIncome / seasonCost) };
  }

  return {
    crop, region, areaAcres, areaHa, soil, reading, texture,
    target,
    supplied: { n: Math.round(supplied.n), p2o5: Math.round(supplied.p2o5), k2o: Math.round(supplied.k2o) },
    lines, lime: limeLine, fertilizerCost, totalCost, economics,
    official: !!crop.nutrients?.official,
    noRecommendation: !crop.nutrients,
  };
}
