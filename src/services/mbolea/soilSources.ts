import type { SoilAnalysisData } from '../soilAnalysisService';
import type { SoilHealthData } from '../../context/SensorDataContext';
import type { SoilInput } from './soil';

/** Saved analyses, newest first. Mirrors how the rest of the app persists them. */
export function loadSavedAnalyses(): SoilAnalysisData[] {
  try {
    const raw = localStorage.getItem('soilAnalyses');
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((a) => a && a.averageData && typeof a.averageData.ph === 'number')
      .sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0));
  } catch {
    return [];
  }
}

export function fromSensor(data: SoilHealthData, label: string): SoilInput {
  return {
    source: 'sensor', label,
    ph: data.ph, nitrogen: data.nitrogen, phosphorus: data.phosphorus, potassium: data.potassium,
  };
}

export function fromAnalysis(a: SoilAnalysisData): SoilInput {
  const d = a.averageData;
  return {
    source: 'saved', label: a.name,
    ph: d.ph, nitrogen: d.nitrogen, phosphorus: d.phosphorus, potassium: d.potassium,
  };
}
