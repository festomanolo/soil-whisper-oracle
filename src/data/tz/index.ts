import regionsJson from './regions.json';
import pricesJson from './market-prices.json';

export type RainfallRegime = 'bimodal' | 'unimodal';

export interface RegionSoil {
  ph: number;
  totalNitrogenGkg: number;
  organicCarbonGkg: number;
  clayPct: number;
  cecCmolKg: number;
  source: string;
}

export interface TzRegion {
  id: string;
  name: string;
  lat: number;
  lon: number;
  regime: RainfallRegime;
  zone: string;
  elevation: number;
  /** mm per month, Jan..Dec (NASA POWER climatology) */
  rainfallMm: number[];
  annualRainMm: number;
  tempC: number[];
  tempMaxC: number[];
  tempMinC: number[];
  humidity: number[];
  soil?: RegionSoil | null;
}

export const TZ_REGIONS: TzRegion[] = (regionsJson as { regions: TzRegion[] }).regions;
export const REGION_SOURCES: string[] = (regionsJson as { sources: string[] }).sources;

export const REGION_BY_ID: Record<string, TzRegion> =
  Object.fromEntries(TZ_REGIONS.map((r) => [r.id, r]));

export interface MarketPrices {
  generated: string;
  source: string;
  unit: string;
  periodStart: string;
  periodEnd: string;
  national: Record<string, number>;
  byRegion: Record<string, Record<string, number>>;
}

export const MARKET_PRICES = pricesJson as MarketPrices;

/** Closest region to a GPS point (equirectangular distance is plenty at this scale). */
export function nearestRegion(lat: number, lon: number): TzRegion {
  let best = TZ_REGIONS[0];
  let bestD = Infinity;
  for (const r of TZ_REGIONS) {
    const dx = (r.lon - lon) * Math.cos((lat * Math.PI) / 180);
    const dy = r.lat - lat;
    const d = dx * dx + dy * dy;
    if (d < bestD) {
      bestD = d;
      best = r;
    }
  }
  return best;
}

export * from './crops';
export * from './fertilizers';
