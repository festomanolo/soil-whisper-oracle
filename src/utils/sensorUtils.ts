
import { SoilHealthData } from '../context/SensorDataContext';

/**
 * Get appropriate color based on moisture level
 */
export const getMoistureColor = (moisture: number): string => {
  if (moisture < 30) return 'moisture-dry';
  if (moisture > 70) return 'moisture-wet';
  return 'moisture-moist';
};

/**
 * Get pH level description
 */
export const getPHDescription = (ph: number): string => {
  if (ph < 6.0) return 'Acidic';
  if (ph > 7.5) return 'Alkaline';
  return 'Neutral';
};

/**
 * Get pH color class
 */
export const getPHColorClass = (ph: number): string => {
  if (ph < 6.0) return 'bg-nutrient-ph-acidic';
  if (ph > 7.5) return 'bg-nutrient-ph-alkaline';
  return 'bg-nutrient-ph-neutral';
};

/**
 * Get color for nutrient level
 */
export const getNutrientColorClass = (nutrient: 'nitrogen' | 'phosphorus' | 'potassium' | 'conductivity', value: number): string => {
  let baseColor: string;
  
  switch (nutrient) {
    case 'nitrogen':
      baseColor = 'bg-nutrient-nitrogen';
      break;
    case 'phosphorus':
      baseColor = 'bg-nutrient-phosphorus';
      break;
    case 'potassium':
      baseColor = 'bg-nutrient-potassium';
      break;
    case 'conductivity':
      baseColor = 'bg-nutrient-oxygen'; // Reusing the oxygen color class for conductivity
      break;
    default:
      baseColor = 'bg-gray-400';
  }
  
  // Add opacity based on the value
  const opacity = Math.max(0.3, Math.min(1, value / 100));
  return `${baseColor} opacity-[${opacity}]`;
};

/**
 * Check if soil is balanced
 */
export const isSoilBalanced = (data: SoilHealthData): boolean => {
  // Simple check - in a real app this would be more sophisticated
  const npkValues = [data.nitrogen, data.phosphorus, data.potassium];
  const average = npkValues.reduce((sum, val) => sum + val, 0) / npkValues.length;
  
  // Check if values are relatively close to the average
  return npkValues.every(val => Math.abs(val - average) < 20);
};

/**
 * Generate a soil quality score (0-100)
 */
export const getSoilQualityScore = (data: SoilHealthData): number => {
  // This is a simplified scoring algorithm
  const npkScore = (data.nitrogen + data.phosphorus + data.potassium) / 3;
  const phPenalty = Math.abs(data.ph - 7) * 5; // Penalty for pH away from neutral
  
  // Calculate moisture score (optimal is around 50-70%)
  let moistureScore = 100;
  if (data.moisture < 50) {
    moistureScore = 100 * (data.moisture / 50);
  } else if (data.moisture > 70) {
    moistureScore = 100 * (1 - (data.moisture - 70) / 30);
  }
  
  // Calculate final weighted score
  const finalScore = (npkScore * 0.5) + (moistureScore * 0.3) + (Math.max(0, 100 - phPenalty) * 0.2);
  return Math.min(100, Math.max(0, finalScore));
};
