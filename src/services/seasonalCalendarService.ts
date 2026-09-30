// Seasonal Calendar Service
// Provides planting calendar and seasonal recommendations

export interface PlantingWindow {
  crop: string;
  plantingStart: Date;
  plantingEnd: Date;
  harvestStart: Date;
  harvestEnd: Date;
  season: 'spring' | 'summer' | 'monsoon' | 'winter';
  suitability: 'excellent' | 'good' | 'fair' | 'poor';
  notes: string[];
}

export interface SeasonalRecommendation {
  month: string;
  monthNumber: number;
  season: string;
  temperature: { min: number; max: number };
  rainfall: number;
  recommendedCrops: {
    crop: string;
    action: 'plant' | 'harvest' | 'maintain';
    priority: 'high' | 'medium' | 'low';
    notes: string;
  }[];
  soilPreparation: string[];
  weatherConsiderations: string[];
}

// Get current season based on month
function getCurrentSeason(month: number): 'spring' | 'summer' | 'monsoon' | 'winter' {
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'monsoon';
  return 'winter';
}

// Generate planting windows for crops
export function generatePlantingWindows(crops: string[]): PlantingWindow[] {
  const currentYear = new Date().getFullYear();
  const windows: PlantingWindow[] = [];

  const cropSeasons: Record<string, {
    plantingMonths: number[];
    growthDuration: number; // in months
    season: 'spring' | 'summer' | 'monsoon' | 'winter';
    notes: string[];
  }> = {
    rice: {
      plantingMonths: [6, 7], // June-July (Monsoon)
      growthDuration: 4,
      season: 'monsoon',
      notes: ['Requires high water availability', 'Plant with first monsoon rains', 'Ensure proper drainage']
    },
    wheat: {
      plantingMonths: [11, 12], // November-December (Winter)
      growthDuration: 4,
      season: 'winter',
      notes: ['Cool season crop', 'Avoid late planting', 'Requires well-drained soil']
    },
    maize: {
      plantingMonths: [3, 4, 7], // March-April (Spring) and July (Monsoon)
      growthDuration: 3,
      season: 'spring',
      notes: ['Can be grown in multiple seasons', 'Ensure adequate moisture', 'Protect from strong winds']
    },
    cotton: {
      plantingMonths: [4, 5], // April-May (Summer)
      growthDuration: 6,
      season: 'summer',
      notes: ['Long growing season', 'Requires warm weather', 'Deep, well-drained soil needed']
    },
    apple: {
      plantingMonths: [12, 1, 2], // December-February (Winter)
      growthDuration: 36, // 3 years to first harvest
      season: 'winter',
      notes: ['Perennial crop', 'Requires cold winters', 'Plant dormant saplings']
    },
    banana: {
      plantingMonths: [2, 3, 4, 9, 10], // February-April, September-October
      growthDuration: 12,
      season: 'spring',
      notes: ['Year-round planting possible', 'Avoid extreme weather', 'Requires consistent moisture']
    },
    mango: {
      plantingMonths: [7, 8], // July-August (Monsoon)
      growthDuration: 36, // 3 years to first harvest
      season: 'monsoon',
      notes: ['Perennial crop', 'Plant during monsoon', 'Requires deep, fertile soil']
    },
    grapes: {
      plantingMonths: [1, 2], // January-February (Winter)
      growthDuration: 24, // 2 years to first harvest
      season: 'winter',
      notes: ['Requires trellis system', 'Plant dormant vines', 'Good drainage essential']
    },
    coconut: {
      plantingMonths: [5, 6, 9, 10], // May-June, September-October
      growthDuration: 60, // 5 years to first harvest
      season: 'monsoon',
      notes: ['Perennial crop', 'Coastal areas preferred', 'Requires consistent moisture']
    },
    coffee: {
      plantingMonths: [6, 7], // June-July (Monsoon)
      growthDuration: 36, // 3 years to first harvest
      season: 'monsoon',
      notes: ['Shade-loving crop', 'High altitude preferred', 'Requires consistent rainfall']
    }
  };

  crops.forEach(crop => {
    const cropData = cropSeasons[crop.toLowerCase()];
    if (!cropData) return;

    cropData.plantingMonths.forEach(month => {
      const plantingStart = new Date(currentYear, month - 1, 1);
      const plantingEnd = new Date(currentYear, month - 1, 28);
      const harvestStart = new Date(currentYear, month - 1 + cropData.growthDuration, 1);
      const harvestEnd = new Date(currentYear, month - 1 + cropData.growthDuration, 28);

      // Adjust for next year if needed
      if (harvestStart.getFullYear() > currentYear) {
        harvestStart.setFullYear(currentYear + 1);
        harvestEnd.setFullYear(currentYear + 1);
      }

      windows.push({
        crop: crop,
        plantingStart,
        plantingEnd,
        harvestStart,
        harvestEnd,
        season: cropData.season,
        suitability: 'good', // This would be calculated based on soil conditions
        notes: cropData.notes
      });
    });
  });

  return windows.sort((a, b) => a.plantingStart.getTime() - b.plantingStart.getTime());
}

// Get next 3 months recommendations
export function getNext3MonthsRecommendations(): SeasonalRecommendation[] {
  const currentDate = new Date();
  const recommendations: SeasonalRecommendation[] = [];

  for (let i = 0; i < 3; i++) {
    const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
    const month = targetDate.getMonth() + 1;
    const monthName = targetDate.toLocaleString('default', { month: 'long' });
    const season = getCurrentSeason(month);

    // Seasonal data (simplified for demo - would come from weather APIs)
    const seasonalData = {
      spring: { tempMin: 15, tempMax: 30, rainfall: 50 },
      summer: { tempMin: 25, tempMax: 40, rainfall: 30 },
      monsoon: { tempMin: 20, tempMax: 35, rainfall: 200 },
      winter: { tempMin: 5, tempMax: 25, rainfall: 20 }
    };

    const data = seasonalData[season];

    let recommendedCrops: SeasonalRecommendation['recommendedCrops'] = [];
    let soilPreparation: string[] = [];
    let weatherConsiderations: string[] = [];

    // Month-specific recommendations
    switch (month) {
      case 1: // January
        recommendedCrops = [
          { crop: 'Wheat', action: 'maintain', priority: 'high', notes: 'Monitor for pests and diseases' },
          { crop: 'Grapes', action: 'plant', priority: 'medium', notes: 'Plant dormant vines' },
          { crop: 'Apple', action: 'plant', priority: 'medium', notes: 'Ideal time for sapling plantation' }
        ];
        soilPreparation = ['Deep plowing for summer crops', 'Add organic manure', 'Prepare nursery beds'];
        weatherConsiderations = ['Protect crops from frost', 'Ensure adequate irrigation', 'Monitor cold waves'];
        break;

      case 2: // February
        recommendedCrops = [
          { crop: 'Banana', action: 'plant', priority: 'high', notes: 'Good time for planting' },
          { crop: 'Maize', action: 'plant', priority: 'medium', notes: 'Prepare for spring planting' },
          { crop: 'Cotton', action: 'plant', priority: 'low', notes: 'Prepare soil for April planting' }
        ];
        soilPreparation = ['Soil testing and amendment', 'Prepare raised beds', 'Install irrigation systems'];
        weatherConsiderations = ['Last chance before summer heat', 'Monitor soil temperature', 'Plan water management'];
        break;

      case 3: // March
        recommendedCrops = [
          { crop: 'Maize', action: 'plant', priority: 'high', notes: 'Ideal planting time' },
          { crop: 'Cotton', action: 'plant', priority: 'medium', notes: 'Prepare for planting' },
          { crop: 'Rice', action: 'plant', priority: 'low', notes: 'Prepare nursery for transplanting' }
        ];
        soilPreparation = ['Final soil preparation', 'Apply base fertilizers', 'Check irrigation systems'];
        weatherConsiderations = ['Rising temperatures', 'Ensure water availability', 'Monitor weather forecasts'];
        break;

      case 4: // April
        recommendedCrops = [
          { crop: 'Cotton', action: 'plant', priority: 'high', notes: 'Prime planting season' },
          { crop: 'Maize', action: 'maintain', priority: 'high', notes: 'Monitor early growth' },
          { crop: 'Banana', action: 'plant', priority: 'medium', notes: 'Last chance before summer' }
        ];
        soilPreparation = ['Mulching to retain moisture', 'Install shade nets if needed', 'Prepare for summer management'];
        weatherConsiderations = ['Increasing heat stress', 'Water management critical', 'Protect young plants'];
        break;

      case 5: // May
        recommendedCrops = [
          { crop: 'Cotton', action: 'maintain', priority: 'high', notes: 'Critical growth period' },
          { crop: 'Coconut', action: 'plant', priority: 'medium', notes: 'Pre-monsoon planting' },
          { crop: 'Mango', action: 'harvest', priority: 'high', notes: 'Peak harvest season' }
        ];
        soilPreparation = ['Moisture conservation', 'Mulching heavily', 'Prepare for monsoon'];
        weatherConsiderations = ['Peak summer heat', 'Water stress management', 'Prepare for monsoon'];
        break;

      case 6: // June
        recommendedCrops = [
          { crop: 'Rice', action: 'plant', priority: 'high', notes: 'Monsoon planting begins' },
          { crop: 'Coffee', action: 'plant', priority: 'medium', notes: 'Ideal for hill regions' },
          { crop: 'Coconut', action: 'plant', priority: 'medium', notes: 'Good monsoon planting' }
        ];
        soilPreparation = ['Prepare paddy fields', 'Ensure proper drainage', 'Transplant rice seedlings'];
        weatherConsiderations = ['Monsoon arrival', 'Manage excess water', 'Prevent waterlogging'];
        break;

      case 7: // July
        recommendedCrops = [
          { crop: 'Rice', action: 'maintain', priority: 'high', notes: 'Peak growing season' },
          { crop: 'Maize', action: 'plant', priority: 'medium', notes: 'Monsoon crop' },
          { crop: 'Mango', action: 'plant', priority: 'medium', notes: 'Good for saplings' }
        ];
        soilPreparation = ['Weed management', 'Fertilizer application', 'Drainage maintenance'];
        weatherConsiderations = ['Heavy rainfall management', 'Pest and disease control', 'Flood protection'];
        break;

      case 8: // August
        recommendedCrops = [
          { crop: 'Rice', action: 'maintain', priority: 'high', notes: 'Flowering stage' },
          { crop: 'Mango', action: 'plant', priority: 'medium', notes: 'Last chance for monsoon planting' },
          { crop: 'Wheat', action: 'plant', priority: 'low', notes: 'Prepare for winter crop' }
        ];
        soilPreparation = ['Pest control measures', 'Nutrient management', 'Prepare for post-monsoon'];
        weatherConsiderations = ['Late monsoon rains', 'Disease pressure high', 'Prepare for withdrawal'];
        break;

      case 9: // September
        recommendedCrops = [
          { crop: 'Banana', action: 'plant', priority: 'high', notes: 'Post-monsoon planting' },
          { crop: 'Coconut', action: 'plant', priority: 'medium', notes: 'Good soil moisture' },
          { crop: 'Wheat', action: 'plant', priority: 'low', notes: 'Prepare soil for winter crop' }
        ];
        soilPreparation = ['Post-monsoon soil management', 'Drainage improvement', 'Prepare for winter crops'];
        weatherConsiderations = ['Monsoon withdrawal', 'Humidity management', 'Prepare for cooler weather'];
        break;

      case 10: // October
        recommendedCrops = [
          { crop: 'Rice', action: 'harvest', priority: 'high', notes: 'Main harvest season' },
          { crop: 'Banana', action: 'maintain', priority: 'medium', notes: 'Monitor growth' },
          { crop: 'Wheat', action: 'plant', priority: 'medium', notes: 'Prepare for planting' }
        ];
        soilPreparation = ['Harvest preparation', 'Soil preparation for rabi crops', 'Residue management'];
        weatherConsiderations = ['Post-monsoon conditions', 'Optimal temperature', 'Good for land preparation'];
        break;

      case 11: // November
        recommendedCrops = [
          { crop: 'Wheat', action: 'plant', priority: 'high', notes: 'Prime planting time' },
          { crop: 'Rice', action: 'harvest', priority: 'high', notes: 'Complete harvest' },
          { crop: 'Apple', action: 'plant', priority: 'medium', notes: 'Pre-winter planting' }
        ];
        soilPreparation = ['Rabi crop sowing', 'Apply base fertilizers', 'Irrigation setup'];
        weatherConsiderations = ['Ideal temperature', 'Low humidity', 'Good soil conditions'];
        break;

      case 12: // December
        recommendedCrops = [
          { crop: 'Wheat', action: 'maintain', priority: 'high', notes: 'Monitor early growth' },
          { crop: 'Apple', action: 'plant', priority: 'high', notes: 'Dormant season planting' },
          { crop: 'Grapes', action: 'plant', priority: 'medium', notes: 'Winter planting' }
        ];
        soilPreparation = ['Winter crop management', 'Frost protection', 'Mulching for protection'];
        weatherConsiderations = ['Cold weather protection', 'Frost management', 'Reduced irrigation needs'];
        break;

      default:
        recommendedCrops = [];
        soilPreparation = [];
        weatherConsiderations = [];
    }

    recommendations.push({
      month: monthName,
      monthNumber: month,
      season: season,
      temperature: { min: data.tempMin, max: data.tempMax },
      rainfall: data.rainfall,
      recommendedCrops,
      soilPreparation,
      weatherConsiderations
    });
  }

  return recommendations;
}

// Get planting status for a crop
export function getPlantingStatus(crop: string): {
  status: 'plant_now' | 'plant_soon' | 'wait' | 'harvest_time';
  message: string;
  daysUntil?: number;
} {
  const windows = generatePlantingWindows([crop]);
  const now = new Date();
  
  for (const window of windows) {
    const daysDiff = Math.ceil((window.plantingStart.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (now >= window.plantingStart && now <= window.plantingEnd) {
      return {
        status: 'plant_now',
        message: 'Ideal time to plant!'
      };
    } else if (daysDiff > 0 && daysDiff <= 30) {
      return {
        status: 'plant_soon',
        message: `Plant in ${daysDiff} days`,
        daysUntil: daysDiff
      };
    } else if (now >= window.harvestStart && now <= window.harvestEnd) {
      return {
        status: 'harvest_time',
        message: 'Harvest time!'
      };
    }
  }
  
  return {
    status: 'wait',
    message: 'Not the right season'
  };
}