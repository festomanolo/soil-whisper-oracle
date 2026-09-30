// Soil interpretation for fertilizer and lime decisions.
//
// The ESP8266 7-in-1 probe reports N, P and K in mg/kg. Those probes estimate
// nutrients from conductivity, so we only use them to place a field in a broad
// low / medium / high class and scale the official recommendation – never to
// compute exact nutrient budgets.

import type { RegionSoil, TzCrop } from '../../data/tz';

export type Level = 'low' | 'medium' | 'high' | 'unknown';
export type Texture = 'sandy' | 'loam' | 'clay';
export type SoilSource = 'sensor' | 'saved' | 'manual' | 'regional';

export interface SoilInput {
  source: SoilSource;
  label?: string;
  ph: number;
  /** mg/kg (sensor or lab). Undefined when unknown, e.g. regional baseline. */
  nitrogen?: number;
  phosphorus?: number;
  potassium?: number;
  /** Regional baseline extras from SoilGrids */
  totalNitrogenGkg?: number;
  organicCarbonGkg?: number;
  clayPct?: number;
}

export interface SoilReading {
  ph: { value: number; class: PhClass };
  n: Level;
  p: Level;
  k: Level;
}

export type PhClass = 'very-acidic' | 'acidic' | 'slightly-acidic' | 'neutral' | 'alkaline';

export function phClass(ph: number): PhClass {
  if (ph < 5.0) return 'very-acidic';
  if (ph < 5.5) return 'acidic';
  if (ph < 6.5) return 'slightly-acidic';
  if (ph <= 7.5) return 'neutral';
  return 'alkaline';
}

const band = (v: number | undefined, low: number, high: number): Level =>
  v === undefined || v === null || Number.isNaN(v) ? 'unknown' : v < low ? 'low' : v > high ? 'high' : 'medium';

export function readSoil(soil: SoilInput): SoilReading {
  // Nitrogen: sensor mg/kg, or SoilGrids total N (g/kg; Landon: < 1 low, > 2 high).
  const n = soil.nitrogen !== undefined
    ? band(soil.nitrogen, 50, 100)
    : band(soil.totalNitrogenGkg, 1, 2);
  return {
    ph: { value: soil.ph, class: phClass(soil.ph) },
    n,
    // Available P (Olsen-equivalent mg/kg) and exchangeable K (~0.2 / 0.5 cmol/kg).
    p: band(soil.phosphorus, 15, 30),
    k: band(soil.potassium, 80, 200),
  };
}

/** How much of the official rate to apply for each nutrient class. */
export const RATE_FACTOR: Record<'n' | 'p' | 'k', Record<Level, number>> = {
  n: { low: 1.2, medium: 1, high: 0.7, unknown: 1 },
  p: { low: 1.25, medium: 1, high: 0.5, unknown: 1 },
  k: { low: 1.25, medium: 1, high: 0.5, unknown: 1 },
};

export function textureFromClay(clayPct?: number): Texture {
  if (clayPct === undefined || clayPct === null) return 'loam';
  if (clayPct < 15) return 'sandy';
  if (clayPct > 35) return 'clay';
  return 'loam';
}

/** t/ha of agricultural lime (CaCO3 equivalent) to raise the top 20 cm by one pH unit. */
const LIME_PER_PH_UNIT: Record<Texture, number> = { sandy: 1.0, loam: 2.0, clay: 3.0 };
const MAX_LIME_PER_SEASON = 4; // t/ha – apply more in later seasons

export interface LimeAdvice {
  targetPh: number;
  tPerHa: number;
  /** true when the full need exceeds one season's safe dose */
  split: boolean;
}

export function limeRequirement(soil: SoilInput, crop: TzCrop, texture: Texture): LimeAdvice | null {
  // Aim for the bottom of the crop's optimal band, never above 6.5.
  const target = Math.min(6.5, Math.max(5.5, crop.eco.phOpt[0]));
  if (soil.ph >= target - 0.2) return null;
  let perUnit = LIME_PER_PH_UNIT[texture];
  if ((soil.organicCarbonGkg ?? 0) > 20) perUnit += 0.5; // organic soils buffer more
  const need = (target - soil.ph) * perUnit;
  return {
    targetPh: target,
    tPerHa: Math.round(Math.min(need, MAX_LIME_PER_SEASON) * 10) / 10,
    split: need > MAX_LIME_PER_SEASON,
  };
}

export function regionalSoil(soil: RegionSoil | null | undefined, regionName: string): SoilInput | null {
  if (!soil) return null;
  return {
    source: 'regional',
    label: regionName,
    ph: soil.ph,
    totalNitrogenGkg: soil.totalNitrogenGkg,
    organicCarbonGkg: soil.organicCarbonGkg,
    clayPct: soil.clayPct,
  };
}
