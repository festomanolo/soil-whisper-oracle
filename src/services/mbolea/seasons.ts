// Rainy-season detection from monthly climatology.
//
// Tanzania has two rainfall regimes (TMA):
//  - bimodal: Vuli (short rains, ~Oct–Dec/Jan) and Masika (long rains, ~Mar–May)
//  - unimodal: one Msimu season (~Nov/Dec–Apr/May)
// Instead of hard-coding dates we detect the actual wet months for each region
// from NASA POWER rainfall, so planting advice follows the local data.

import type { TzRegion } from '../../data/tz';

export type SeasonName = 'vuli' | 'masika' | 'msimu';

export interface Season {
  name: SeasonName;
  /** 0 = January */
  startMonth: number;
  /** number of wet months */
  months: number;
  rainMm: number;
}

/** A season starts when monthly rain reaches ONSET_MM and continues while it stays ≥ CONTINUE_MM. */
const ONSET_MM = 75;
const CONTINUE_MM = 50;

const mod12 = (m: number) => ((m % 12) + 12) % 12;

function wetRuns(rain: number[]): { start: number; months: number }[] {
  // Walk the year starting from the driest month so no run wraps around the start.
  const driest = rain.indexOf(Math.min(...rain));
  const runs: { start: number; months: number }[] = [];
  let current: { start: number; months: number } | null = null;
  for (let i = 1; i <= 12; i++) {
    const m = mod12(driest + i);
    if (current) {
      if (rain[m] >= CONTINUE_MM) current.months++;
      else {
        runs.push(current);
        current = null;
      }
    } else if (rain[m] >= ONSET_MM) {
      current = { start: m, months: 1 };
    }
  }
  if (current) runs.push(current);
  return runs.filter((r) => r.months >= 2);
}

const sumRain = (rain: number[], start: number, months: number) =>
  Array.from({ length: months }, (_, i) => rain[mod12(start + i)]).reduce((a, b) => a + b, 0);

export function detectSeasons(region: TzRegion): Season[] {
  const rain = region.rainfallMm;
  const seasons: Season[] = [];

  for (const run of wetRuns(rain)) {
    const make = (name: SeasonName, start: number, months: number): Season => ({
      name, startMonth: start, months, rainMm: Math.round(sumRain(rain, start, months)),
    });

    if (region.regime === 'unimodal') {
      seasons.push(make('msimu', run.start, run.months));
      continue;
    }

    // Bimodal: a run that crosses Dec–Feb holds both seasons; split it at the
    // driest of those months (the short "kiangazi kifupi" break).
    const offsets = Array.from({ length: run.months }, (_, i) => i);
    const breakCandidates = offsets.filter((i) => [11, 0, 1].includes(mod12(run.start + i)));
    if (run.months >= 5 && breakCandidates.length > 0) {
      const split = breakCandidates.reduce((best, i) =>
        rain[mod12(run.start + i)] < rain[mod12(run.start + best)] ? i : best);
      // The break month closes Vuli; Masika planting starts the month after.
      if (split >= 1 && run.months - split - 1 >= 2) {
        seasons.push(make('vuli', run.start, split + 1));
        seasons.push(make('masika', mod12(run.start + split + 1), run.months - split - 1));
        continue;
      }
    }
    const startsLongRains = run.start >= 1 && run.start <= 5;
    seasons.push(make(startsLongRains ? 'masika' : 'vuli', run.start, run.months));
  }

  // Order by the calendar starting from the next onset (most useful first).
  return seasons.sort((a, b) => a.startMonth - b.startMonth);
}

/** Months (0-11) covered by a crop planted in `start` and lasting `days`. */
export function cycleMonths(start: number, days: number): number[] {
  const n = Math.max(1, Math.min(12, Math.round(days / 30)));
  return Array.from({ length: n }, (_, i) => mod12(start + i));
}

export type PlantingStatus = 'plant_now' | 'prepare' | 'off_season';

/** Planting status relative to `month`: the window is the onset month and the one after. */
export function plantingStatus(season: Season, month: number): { status: PlantingStatus; monthsAway: number } {
  const away = mod12(season.startMonth - month);
  if (away === 0 || away === 11) return { status: 'plant_now', monthsAway: 0 };
  if (away <= 2) return { status: 'prepare', monthsAway: away };
  return { status: 'off_season', monthsAway: away };
}

export { mod12 };
