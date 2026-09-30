// Crop Prediction Service
// Based on the machine learning model patterns from crop-prediction-model-main

export interface SoilConditions {
  nitrogen: number;      // N - Nitrogen content ratio in soil
  phosphorus: number;    // P - Phosphorous content ratio in soil  
  potassium: number;     // K - Potassium content ratio in soil
  temperature: number;   // Temperature in degree Celsius
  humidity: number;      // Relative humidity in %
  ph: number;           // pH value of the soil
  rainfall: number;     // Rainfall in mm
}

export interface CropRecommendation {
  crop: string;
  confidence: number;
  suitability: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  reasons: string[];
}

// Crop optimal ranges based on the training data analysis
export const CROP_RANGES = {
  rice: {
    N: { min: 60, max: 100, optimal: 80 },
    P: { min: 35, max: 60, optimal: 45 },
    K: { min: 35, max: 50, optimal: 42 },
    temperature: { min: 20, max: 27, optimal: 23 },
    humidity: { min: 80, max: 85, optimal: 82 },
    ph: { min: 5.5, max: 7.5, optimal: 6.5 },
    rainfall: { min: 200, max: 300, optimal: 250 }
  },
  wheat: {
    N: { min: 50, max: 80, optimal: 65 },
    P: { min: 40, max: 70, optimal: 55 },
    K: { min: 30, max: 50, optimal: 40 },
    temperature: { min: 15, max: 25, optimal: 20 },
    humidity: { min: 50, max: 70, optimal: 60 },
    ph: { min: 6.0, max: 7.5, optimal: 6.8 },
    rainfall: { min: 50, max: 100, optimal: 75 }
  },
  cotton: {
    N: { min: 40, max: 70, optimal: 55 },
    P: { min: 40, max: 70, optimal: 55 },
    K: { min: 35, max: 55, optimal: 45 },
    temperature: { min: 25, max: 35, optimal: 30 },
    humidity: { min: 40, max: 60, optimal: 50 },
    ph: { min: 7.0, max: 8.5, optimal: 7.8 },
    rainfall: { min: 80, max: 120, optimal: 100 }
  },
  maize: {
    N: { min: 70, max: 120, optimal: 95 },
    P: { min: 40, max: 80, optimal: 60 },
    K: { min: 15, max: 40, optimal: 25 },
    temperature: { min: 18, max: 27, optimal: 22 },
    humidity: { min: 55, max: 75, optimal: 65 },
    ph: { min: 5.8, max: 7.0, optimal: 6.4 },
    rainfall: { min: 60, max: 110, optimal: 85 }
  },
  apple: {
    N: { min: 15, max: 35, optimal: 25 },
    P: { min: 25, max: 45, optimal: 35 },
    K: { min: 15, max: 30, optimal: 22 },
    temperature: { min: 10, max: 20, optimal: 15 },
    humidity: { min: 55, max: 70, optimal: 62 },
    ph: { min: 5.5, max: 6.5, optimal: 6.0 },
    rainfall: { min: 100, max: 150, optimal: 125 }
  },
  banana: {
    N: { min: 80, max: 120, optimal: 100 },
    P: { min: 70, max: 100, optimal: 85 },
    K: { min: 40, max: 60, optimal: 50 },
    temperature: { min: 25, max: 30, optimal: 27 },
    humidity: { min: 75, max: 85, optimal: 80 },
    ph: { min: 6.0, max: 7.5, optimal: 6.8 },
    rainfall: { min: 100, max: 180, optimal: 140 }
  },
  mango: {
    N: { min: 15, max: 40, optimal: 28 },
    P: { min: 20, max: 50, optimal: 35 },
    K: { min: 15, max: 35, optimal: 25 },
    temperature: { min: 24, max: 30, optimal: 27 },
    humidity: { min: 50, max: 70, optimal: 60 },
    ph: { min: 5.5, max: 7.5, optimal: 6.5 },
    rainfall: { min: 75, max: 125, optimal: 100 }
  },
  grapes: {
    N: { min: 15, max: 40, optimal: 28 },
    P: { min: 120, max: 150, optimal: 135 },
    K: { min: 200, max: 250, optimal: 225 },
    temperature: { min: 15, max: 25, optimal: 20 },
    humidity: { min: 80, max: 90, optimal: 85 },
    ph: { min: 5.5, max: 7.0, optimal: 6.2 },
    rainfall: { min: 25, max: 50, optimal: 37 }
  },
  orange: {
    N: { min: 15, max: 35, optimal: 25 },
    P: { min: 10, max: 25, optimal: 17 },
    K: { min: 5, max: 20, optimal: 12 },
    temperature: { min: 15, max: 25, optimal: 20 },
    humidity: { min: 90, max: 95, optimal: 92 },
    ph: { min: 6.0, max: 7.5, optimal: 6.8 },
    rainfall: { min: 100, max: 120, optimal: 110 }
  },
  coconut: {
    N: { min: 15, max: 25, optimal: 20 },
    P: { min: 10, max: 20, optimal: 15 },
    K: { min: 15, max: 25, optimal: 20 },
    temperature: { min: 25, max: 30, optimal: 27 },
    humidity: { min: 70, max: 80, optimal: 75 },
    ph: { min: 5.2, max: 8.0, optimal: 6.6 },
    rainfall: { min: 100, max: 200, optimal: 150 }
  },
  coffee: {
    N: { min: 95, max: 120, optimal: 108 },
    P: { min: 15, max: 35, optimal: 25 },
    K: { min: 15, max: 30, optimal: 22 },
    temperature: { min: 23, max: 30, optimal: 26 },
    humidity: { min: 50, max: 70, optimal: 60 },
    ph: { min: 6.0, max: 7.5, optimal: 6.8 },
    rainfall: { min: 60, max: 70, optimal: 65 }
  },
  chickpea: {
    N: { min: 20, max: 40, optimal: 30 },
    P: { min: 60, max: 85, optimal: 72 },
    K: { min: 70, max: 90, optimal: 80 },
    temperature: { min: 20, max: 30, optimal: 25 },
    humidity: { min: 10, max: 40, optimal: 25 },
    ph: { min: 6.0, max: 7.5, optimal: 6.8 },
    rainfall: { min: 200, max: 400, optimal: 300 }
  },
  kidneybeans: {
    N: { min: 20, max: 40, optimal: 30 },
    P: { min: 70, max: 100, optimal: 85 },
    K: { min: 60, max: 80, optimal: 70 },
    temperature: { min: 15, max: 25, optimal: 20 },
    humidity: { min: 70, max: 90, optimal: 80 },
    ph: { min: 6.0, max: 7.0, optimal: 6.5 },
    rainfall: { min: 300, max: 700, optimal: 500 }
  },
  lentil: {
    N: { min: 10, max: 30, optimal: 20 },
    P: { min: 55, max: 70, optimal: 62 },
    K: { min: 55, max: 75, optimal: 65 },
    temperature: { min: 15, max: 25, optimal: 20 },
    humidity: { min: 30, max: 70, optimal: 50 },
    ph: { min: 6.0, max: 8.0, optimal: 7.0 },
    rainfall: { min: 250, max: 500, optimal: 375 }
  },
  jute: {
    N: { min: 78, max: 100, optimal: 89 },
    P: { min: 55, max: 75, optimal: 65 },
    K: { min: 45, max: 65, optimal: 55 },
    temperature: { min: 25, max: 35, optimal: 30 },
    humidity: { min: 70, max: 90, optimal: 80 },
    ph: { min: 6.0, max: 7.5, optimal: 6.8 },
    rainfall: { min: 150, max: 250, optimal: 200 }
  }
};

// Calculate suitability score for a crop given soil conditions
function calculateSuitability(conditions: SoilConditions, cropRanges: any): number {
  const factors = ['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall'];
  const conditionMap: any = {
    N: conditions.nitrogen,
    P: conditions.phosphorus,
    K: conditions.potassium,
    temperature: conditions.temperature,
    humidity: conditions.humidity,
    ph: conditions.ph,
    rainfall: conditions.rainfall
  };

  // Weight factors by importance (N-P-K are most important for crops)
  const factorWeights: Record<string, number> = {
    N: 1.5,        // Nitrogen is very important
    P: 1.3,        // Phosphorus is important
    K: 1.3,        // Potassium is important
    ph: 1.2,       // pH affects nutrient availability
    temperature: 1.0,
    humidity: 0.8,
    rainfall: 0.7  // Less weight since it's estimated
  };

  let totalScore = 0;
  let totalWeight = 0;

  factors.forEach(factor => {
    const value = conditionMap[factor];
    const range = cropRanges[factor];
    const weight = factorWeights[factor] || 1.0;
    
    if (range && value !== undefined && value !== null) {
      let score = 0;
      
      // Calculate score based on how close the value is to optimal
      if (value >= range.min && value <= range.max) {
        // Value is within acceptable range - use linear scoring for better differentiation
        const distanceFromOptimal = Math.abs(value - range.optimal);
        const rangeSize = range.max - range.min;
        const normalizedDistance = distanceFromOptimal / rangeSize;
        
        // Linear scoring: 100% at optimal, 70% at range edges
        score = 100 - (normalizedDistance * 30);
      } else {
        // Value is outside acceptable range - heavy penalty
        const distanceFromRange = value < range.min ? 
          range.min - value : value - range.max;
        const rangeSize = range.max - range.min;
        const normalizedDistance = distanceFromRange / rangeSize;
        
        // Linear penalty: 70% at range edge, decreasing to 0% as distance increases
        score = Math.max(0, 70 - (normalizedDistance * 70));
      }
      
      totalScore += score * weight;
      totalWeight += weight;
    }
  });

  const finalScore = totalWeight > 0 ? totalScore / totalWeight : 0;
  
  // Add small random factor to break ties and add variety (±3 points)
  const randomFactor = (Math.random() - 0.5) * 6;
  
  return Math.max(0, Math.min(100, finalScore + randomFactor));
}

// Get suitability level based on score
function getSuitabilityLevel(score: number): 'Excellent' | 'Good' | 'Fair' | 'Poor' {
  if (score >= 80) return 'Excellent';
  if (score >= 65) return 'Good';
  if (score >= 50) return 'Fair';
  return 'Poor';
}

// Generate reasons for recommendation
// Accept t (translations) as a parameter for i18n
export function generateReasons(conditions: SoilConditions, cropRanges: any, score: number, t?: any): string[] {
  const reasons: string[] = [];
  const conditionMap: any = {
    N: { value: conditions.nitrogen, name: 'Nitrogen' },
    P: { value: conditions.phosphorus, name: 'Phosphorus' },
    K: { value: conditions.potassium, name: 'Potassium' },
    temperature: { value: conditions.temperature, name: 'Temperature' },
    humidity: { value: conditions.humidity, name: 'Humidity' },
    ph: { value: conditions.ph, name: 'pH level' },
    rainfall: { value: conditions.rainfall, name: 'Rainfall' }
  };

  Object.keys(conditionMap).forEach(factor => {
    const condition = conditionMap[factor];
    const range = cropRanges[factor];
    
    if (range && condition.value !== undefined) {
      if (condition.value >= range.min && condition.value <= range.max) {
        if (Math.abs(condition.value - range.optimal) <= (range.max - range.min) * 0.1) {
          reasons.push(`${condition.name} level is optimal`);
        } else {
          reasons.push(`${condition.name} level is suitable`);
        }
      } else {
        if (condition.value < range.min) {
          reasons.push(`${condition.name} level is too low`);
        } else {
          reasons.push(`${condition.name} level is too high`);
        }
      }
    }
  });

  // Add best-practice agricultural terms as generic recommendations (translated)
  if (t && t.agriTerms) {
    reasons.push(t.agriTerms.weedManagement);
    reasons.push(t.agriTerms.fertilizerApplication);
    reasons.push(t.agriTerms.pestControl);
    reasons.push(t.agriTerms.nutrientManagement);
    reasons.push(t.agriTerms.postMonsoonSoilManagement);
    reasons.push(t.agriTerms.drainageImprovement);
  }

  return reasons;
}

// Main prediction function
export function predictCrop(conditions: SoilConditions): CropRecommendation[] {
  const recommendations: CropRecommendation[] = [];

  // Calculate suitability for each crop
  Object.keys(CROP_RANGES).forEach(cropName => {
    const cropRanges = CROP_RANGES[cropName as keyof typeof CROP_RANGES];
    const score = calculateSuitability(conditions, cropRanges);
    const suitability = getSuitabilityLevel(score);
    const reasons = generateReasons(conditions, cropRanges, score);

    recommendations.push({
      crop: cropName,
      confidence: Math.round(score),
      suitability,
      reasons
    });
  });

  // Sort by confidence score (highest first)
  return recommendations.sort((a, b) => b.confidence - a.confidence);
}

// Get top N recommendations
export function getTopCropRecommendations(conditions: SoilConditions, limit: number = 3): CropRecommendation[] {
  const allRecommendations = predictCrop(conditions);
  return allRecommendations.slice(0, limit);
}

// Convert soil analysis data to crop prediction format
export function convertSoilAnalysisToConditions(soilData: any): SoilConditions {
  return {
    nitrogen: soilData.nitrogen || soilData.N || 0,
    phosphorus: soilData.phosphorus || soilData.P || 0,
    potassium: soilData.potassium || soilData.K || 0,
    temperature: soilData.temperature || 25, // Default temperature
    humidity: soilData.humidity || 60,       // Default humidity
    ph: soilData.ph || soilData.pH || 7,     // Default pH
    rainfall: soilData.rainfall || 944       // Default rainfall for Mbeya, Tanzania
  };
}