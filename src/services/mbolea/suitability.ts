// Crop suitability for a Tanzanian region + soil, using the FAO ECOCROP method:
// each factor scores 1 inside the optimal range, falls linearly to 0 at the
// absolute limits, and the climate score is the most limiting factor.
// Soil pH is weighted softer because it can be corrected with lime.
//
// This replaces the previous TensorFlow model, which was trained on an Indian
// dataset (22 crops incl. jute, moth beans, pomegranate) with Indian rainfall.

import { TZ_CROPS, type TzCrop, type TzRegion, type Range } from '../../data/tz';
import { cycleMonths, detectSeasons, plantingStatus, type PlantingStatus, type Season } from './seasons';

export interface FactorScore {
  score: number; // 0..1
  value: number;
  optimal: Range;
}

export interface CropSuitability {
  crop: TzCrop;
  /** 0..100 */
  score: number;
  season: Season | null;
  plantMonth: number | null;
  harvestMonth: number | null;
  status: PlantingStatus;
  monthsAway: number;
  temp: FactorScore;
  rain: FactorScore;
  ph: FactorScore;
  limiting: 'temp' | 'rain' | 'ph' | null;
}

export function trapezoid(x: number, abs: Range, opt: Range): number {
  if (x <= abs[0] || x >= abs[1]) return 0;
  if (x >= opt[0] && x <= opt[1]) return 1;
  if (x < opt[0]) return (x - abs[0]) / (opt[0] - abs[0]);
  return (abs[1] - x) / (abs[1] - opt[1]);
}

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

/** Score falls to 0 over 400 m outside the crop's elevation band. */
function altitudeScore(crop: TzCrop, elevation: number): number {
  if (!crop.altitude) return 1;
  const [lo, hi] = crop.altitude;
  return trapezoid(elevation, [lo - 400, hi + 400], crop.altitude);
}

function evaluate(crop: TzCrop, region: TzRegion, ph: number, season: Season | null, irrigated: boolean) {
  const months = crop.perennial || !season
    ? Array.from({ length: 12 }, (_, i) => i)
    : cycleMonths(season.startMonth, crop.cycleDays);
  const temp = mean(months.map((m) => region.tempC[m]));
  const rain = months.reduce((s, m) => s + region.rainfallMm[m], 0);
  const t = trapezoid(temp, crop.eco.tempAbs, crop.eco.tempOpt);
  // With irrigation, too little rain stops being a constraint (too much still is).
  const r = irrigated && rain < crop.eco.rainOpt[1] ? 1 : trapezoid(rain, crop.eco.rainAbs, crop.eco.rainOpt);
  const a = altitudeScore(crop, region.elevation);
  const p = trapezoid(ph, crop.eco.phAbs, crop.eco.phOpt);
  const climate = Math.min(t, r, a);
  const score = Math.round(100 * climate * (0.5 + 0.5 * p));
  const factors = { temp: Math.min(t, a), rain: r, ph: p };
  const worst = (Object.keys(factors) as ('temp' | 'rain' | 'ph')[])
    .reduce((a, b) => (factors[a] <= factors[b] ? a : b));
  return {
    score,
    // Elevation acts through temperature, so it shows on the temperature meter.
    temp: { score: Math.min(t, a), value: Math.round(temp * 10) / 10, optimal: crop.eco.tempOpt },
    rain: { score: r, value: Math.round(rain), optimal: crop.eco.rainOpt },
    ph: { score: p, value: ph, optimal: crop.eco.phOpt },
    limiting: factors[worst] < 1 ? worst : null,
  };
}

export function rankCrops(
  region: TzRegion, ph: number, month = new Date().getMonth(), irrigated = false,
): CropSuitability[] {
  const seasons = detectSeasons(region);
  return TZ_CROPS.map((crop) => {
    const options = seasons.length > 0 ? seasons : [null];
    // Best season for this crop; ties go to the season that starts soonest.
    const scored = options.map((season) => ({ season, ...evaluate(crop, region, ph, season, irrigated) }));
    scored.sort((a, b) =>
      b.score - a.score
      || (a.season && b.season ? plantingStatus(a.season, month).monthsAway - plantingStatus(b.season, month).monthsAway : 0));
    const best = scored[0];
    const status = best.season ? plantingStatus(best.season, month) : { status: 'off_season' as PlantingStatus, monthsAway: 0 };
    const plantMonth = best.season ? best.season.startMonth : null;
    return {
      crop,
      score: best.score,
      season: best.season,
      plantMonth,
      harvestMonth: plantMonth === null || crop.perennial ? null : (plantMonth + Math.round(crop.cycleDays / 30)) % 12,
      status: status.status,
      monthsAway: status.monthsAway,
      temp: best.temp,
      rain: best.rain,
      ph: best.ph,
      limiting: best.limiting,
    };
  }).sort((a, b) => b.score - a.score);
}
