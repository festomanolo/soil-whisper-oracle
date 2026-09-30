// Fertilizer products sold in Tanzania, with nutrient content (% by weight) and
// 50 kg bag prices in TZS.
//
// Prices marked `verified` are the TFRA 2024/25 indicative prices (market and
// subsidised) as reported by USDA FAS / The Citizen. The rest are estimates for
// 2025/26. All prices can be edited by the user in the "Bei" tab because they
// change every season and differ between zones and agro-dealers.

export type FertilizerId = 'dap' | 'tsp' | 'minjingu' | 'npk171717' | 'urea' | 'can' | 'sa' | 'mop' | 'lime';

export interface Fertilizer {
  id: FertilizerId;
  name: string;
  sw: string;
  /** % N, % P2O5, % K2O, % CaO, % S */
  n: number; p2o5: number; k2o: number; cao: number; s: number;
  /** Acidifying fertilizers lower soil pH over time. */
  acidifying: boolean;
  bagKg: number;
  price: { market: number; subsidised: number | null; verified: boolean };
}

export const FERTILIZERS: Record<FertilizerId, Fertilizer> = {
  dap: {
    id: 'dap', name: 'DAP (18-46-0)', sw: 'DAP (18-46-0)',
    n: 18, p2o5: 46, k2o: 0, cao: 0, s: 0, acidifying: true, bagKg: 50,
    price: { market: 113319, subsidised: 85000, verified: true },
  },
  tsp: {
    id: 'tsp', name: 'TSP (0-46-0)', sw: 'TSP (0-46-0)',
    n: 0, p2o5: 46, k2o: 0, cao: 13, s: 1, acidifying: false, bagKg: 50,
    price: { market: 105000, subsidised: null, verified: false },
  },
  minjingu: {
    id: 'minjingu', name: 'Minjingu Mazao (10-20-0 +Ca +S)', sw: 'Minjingu Mazao (10-20-0 +Ca +S)',
    n: 10, p2o5: 20, k2o: 0, cao: 25, s: 5, acidifying: false, bagKg: 50,
    price: { market: 60000, subsidised: 50000, verified: false },
  },
  npk171717: {
    id: 'npk171717', name: 'NPK 17-17-17', sw: 'NPK 17-17-17',
    n: 17, p2o5: 17, k2o: 17, cao: 0, s: 0, acidifying: true, bagKg: 50,
    price: { market: 99110, subsidised: 82835, verified: true },
  },
  urea: {
    id: 'urea', name: 'Urea (46-0-0)', sw: 'Urea (46-0-0)',
    n: 46, p2o5: 0, k2o: 0, cao: 0, s: 0, acidifying: true, bagKg: 50,
    price: { market: 86892, subsidised: 75443, verified: true },
  },
  can: {
    id: 'can', name: 'CAN (26-0-0 +Ca)', sw: 'CAN (26-0-0 +Ca)',
    n: 26, p2o5: 0, k2o: 0, cao: 12, s: 0, acidifying: false, bagKg: 50,
    price: { market: 71414, subsidised: 65188, verified: true },
  },
  sa: {
    id: 'sa', name: 'SA – Sulphate of Ammonia (21-0-0 +24S)', sw: 'SA – Salfeti ya Amonia (21-0-0 +24S)',
    n: 21, p2o5: 0, k2o: 0, cao: 0, s: 24, acidifying: true, bagKg: 50,
    price: { market: 60000, subsidised: null, verified: false },
  },
  mop: {
    id: 'mop', name: 'MOP – Muriate of Potash (0-0-60)', sw: 'MOP – Potashi (0-0-60)',
    n: 0, p2o5: 0, k2o: 60, cao: 0, s: 0, acidifying: false, bagKg: 50,
    price: { market: 95000, subsidised: null, verified: false },
  },
  lime: {
    id: 'lime', name: 'Agricultural lime', sw: 'Chokaa ya kilimo',
    n: 0, p2o5: 0, k2o: 0, cao: 50, s: 0, acidifying: false, bagKg: 50,
    price: { market: 12000, subsidised: null, verified: false },
  },
};

export const FERTILIZER_PRICE_SOURCE =
  'TFRA indicative prices 2024/25 (USDA FAS Grain & Feed Annual TZ2025-0003; The Citizen). Unverified items are 2025/26 estimates.';
