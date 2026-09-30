import { useCallback, useEffect, useMemo, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import {
  FERTILIZERS, REGION_BY_ID, TZ_CROPS, nearestRegion,
  type CropId, type FertilizerId, type TzRegion,
} from '../../data/tz';
import { defaultCropPrice, type PriceBook } from './prescription';
import type { Texture } from './soil';

export interface MboleaSettings {
  regionId: string;
  areaAcres: number;
  useSubsidy: boolean;
  /** Farmer can irrigate: rainfall shortfalls stop limiting crop choice. */
  irrigated: boolean;
  /** null = derive from the region's SoilGrids clay content */
  texture: Texture | null;
  fertilizerPrices: Partial<Record<FertilizerId, number>>;
  cropPrices: Partial<Record<CropId, number>>;
}

const KEY = 'mbolea.settings.v1';
const EVENT = 'mbolea-settings';

const DEFAULTS: MboleaSettings = {
  regionId: 'mbeya',
  areaAcres: 1,
  useSubsidy: true,
  irrigated: false,
  texture: null,
  fertilizerPrices: {},
  cropPrices: {},
};

function load(): MboleaSettings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    const parsed = { ...DEFAULTS, ...JSON.parse(raw) };
    if (!REGION_BY_ID[parsed.regionId]) parsed.regionId = DEFAULTS.regionId;
    return parsed;
  } catch {
    return DEFAULTS;
  }
}

/** Shared, persisted settings. All components using the hook stay in sync. */
export function useMboleaSettings() {
  const [settings, setSettings] = useState<MboleaSettings>(load);

  useEffect(() => {
    const sync = () => setSettings(load());
    window.addEventListener(EVENT, sync);
    return () => window.removeEventListener(EVENT, sync);
  }, []);

  const update = useCallback((patch: Partial<MboleaSettings>) => {
    const next = { ...load(), ...patch };
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // storage unavailable – keep the in-memory value for this session
    }
    setSettings(next);
    window.dispatchEvent(new Event(EVENT));
  }, []);

  const region: TzRegion = REGION_BY_ID[settings.regionId];

  const prices: PriceBook = useMemo(() => ({
    fertilizer: Object.fromEntries(Object.values(FERTILIZERS).map((f) => [
      f.id,
      settings.fertilizerPrices[f.id]
        ?? (settings.useSubsidy && f.price.subsidised ? f.price.subsidised : f.price.market),
    ])) as Record<FertilizerId, number>,
    crop: Object.fromEntries(TZ_CROPS.map((c) => [
      c.id,
      settings.cropPrices[c.id] ?? defaultCropPrice(c, settings.regionId),
    ])) as Record<CropId, number>,
  }), [settings]);

  return { settings, update, region, prices };
}

/** Detects the user's region from GPS. Resolves null if permission is denied. */
export async function detectRegion(): Promise<TzRegion | null> {
  try {
    if (Capacitor.isNativePlatform()) {
      const perm = await Geolocation.requestPermissions();
      if (perm.location !== 'granted' && perm.coarseLocation !== 'granted') return null;
      const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: false, timeout: 15000 });
      return nearestRegion(pos.coords.latitude, pos.coords.longitude);
    }
    const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
      navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 15000 }));
    return nearestRegion(pos.coords.latitude, pos.coords.longitude);
  } catch {
    return null;
  }
}
