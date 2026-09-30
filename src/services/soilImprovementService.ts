// Soil Improvement Service
// Provides recommendations for soil amendments and improvements

export interface SoilImprovementRecommendation {
  id: string;
  priority: 'high' | 'medium' | 'low';
  nutrient: string;
  currentLevel: number;
  targetLevel: number;
  improvement: number;
  amendment: string;
  dosage: string;
  cost: number;
  timeline: string;
  expectedResult: string;
  instructions: string[];
}

export interface SoilHealthScore {
  overall: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  ph: number;
  moisture: number;
  temperature: number;
}

// Calculate soil health scores
export function calculateSoilHealthScore(soilData: any): SoilHealthScore {
  const scoreNutrient = (value: number, optimal: number, range: number) => {
    const distance = Math.abs(value - optimal);
    const maxDistance = range / 2;
    return Math.max(0, Math.min(100, 100 - (distance / maxDistance) * 100));
  };

  const scores = {
    nitrogen: scoreNutrient(soilData.nitrogen, 75, 50), // Optimal: 75%, Range: 50-100%
    phosphorus: scoreNutrient(soilData.phosphorus, 65, 40), // Optimal: 65%, Range: 45-85%
    potassium: scoreNutrient(soilData.potassium, 70, 40), // Optimal: 70%, Range: 50-90%
    ph: scoreNutrient(soilData.ph, 6.5, 3), // Optimal: 6.5, Range: 5.0-8.0
    moisture: scoreNutrient(soilData.moisture, 60, 40), // Optimal: 60%, Range: 40-80%
    temperature: scoreNutrient(soilData.temperature, 25, 20), // Optimal: 25°C, Range: 15-35°C
  };

  const overall = Object.values(scores).reduce((sum, score) => sum + score, 0) / Object.keys(scores).length;

  return {
    overall: Math.round(overall),
    ...scores
  };
}

// Generate soil improvement recommendations
export function generateSoilImprovements(soilData: any): SoilImprovementRecommendation[] {
  const recommendations: SoilImprovementRecommendation[] = [];

  // Nitrogen recommendations
  if (soilData.nitrogen < 60) {
    recommendations.push({
      id: 'nitrogen-boost',
      priority: 'high',
      nutrient: 'Nitrogen',
      currentLevel: soilData.nitrogen,
      targetLevel: 75,
      improvement: 75 - soilData.nitrogen,
      amendment: 'Urea or Compost',
      dosage: '2-3 kg per 100 sq ft',
      cost: 25,
      timeline: '2-3 weeks',
      expectedResult: 'Improved leaf growth and green color',
      instructions: [
        'Apply urea fertilizer evenly across the soil',
        'Water thoroughly after application',
        'Avoid over-application to prevent burning',
        'Retest soil after 3 weeks'
      ]
    });
  }

  // Phosphorus recommendations
  if (soilData.phosphorus < 50) {
    recommendations.push({
      id: 'phosphorus-boost',
      priority: 'high',
      nutrient: 'Phosphorus',
      currentLevel: soilData.phosphorus,
      targetLevel: 65,
      improvement: 65 - soilData.phosphorus,
      amendment: 'Bone Meal or Rock Phosphate',
      dosage: '1-2 kg per 100 sq ft',
      cost: 30,
      timeline: '3-4 weeks',
      expectedResult: 'Better root development and flowering',
      instructions: [
        'Mix bone meal into top 6 inches of soil',
        'Apply during soil preparation',
        'Works slowly but provides long-term benefits',
        'Combine with organic matter for best results'
      ]
    });
  }

  // Potassium recommendations
  if (soilData.potassium < 55) {
    recommendations.push({
      id: 'potassium-boost',
      priority: 'medium',
      nutrient: 'Potassium',
      currentLevel: soilData.potassium,
      targetLevel: 70,
      improvement: 70 - soilData.potassium,
      amendment: 'Muriate of Potash or Wood Ash',
      dosage: '1.5-2 kg per 100 sq ft',
      cost: 20,
      timeline: '2-3 weeks',
      expectedResult: 'Enhanced disease resistance and fruit quality',
      instructions: [
        'Apply potash fertilizer before planting',
        'Mix well with soil to avoid root burn',
        'Wood ash is a natural alternative',
        'Monitor soil pH as potash can affect it'
      ]
    });
  }

  // pH recommendations
  if (soilData.ph < 6.0) {
    recommendations.push({
      id: 'ph-increase',
      priority: 'high',
      nutrient: 'pH Level',
      currentLevel: soilData.ph,
      targetLevel: 6.5,
      improvement: 6.5 - soilData.ph,
      amendment: 'Agricultural Lime',
      dosage: '2-4 kg per 100 sq ft',
      cost: 15,
      timeline: '4-6 weeks',
      expectedResult: 'Better nutrient availability',
      instructions: [
        'Apply lime 2-3 months before planting',
        'Mix thoroughly into soil',
        'Retest pH after 6 weeks',
        'Apply in smaller doses if needed'
      ]
    });
  } else if (soilData.ph > 7.5) {
    recommendations.push({
      id: 'ph-decrease',
      priority: 'medium',
      nutrient: 'pH Level',
      currentLevel: soilData.ph,
      targetLevel: 6.5,
      improvement: soilData.ph - 6.5,
      amendment: 'Sulfur or Organic Matter',
      dosage: '1-2 kg per 100 sq ft',
      cost: 18,
      timeline: '6-8 weeks',
      expectedResult: 'Reduced alkalinity for better nutrient uptake',
      instructions: [
        'Apply elemental sulfur gradually',
        'Add organic compost to buffer changes',
        'Monitor pH changes monthly',
        'Avoid rapid pH changes'
      ]
    });
  }

  // Moisture recommendations
  if (soilData.moisture > 80) {
    recommendations.push({
      id: 'drainage-improvement',
      priority: 'medium',
      nutrient: 'Moisture Control',
      currentLevel: soilData.moisture,
      targetLevel: 60,
      improvement: soilData.moisture - 60,
      amendment: 'Sand or Perlite',
      dosage: '3-5 kg per 100 sq ft',
      cost: 35,
      timeline: '1-2 weeks',
      expectedResult: 'Improved drainage and root health',
      instructions: [
        'Mix coarse sand into heavy clay soil',
        'Add perlite for better aeration',
        'Create raised beds if needed',
        'Install drainage tiles for severe cases'
      ]
    });
  } else if (soilData.moisture < 40) {
    recommendations.push({
      id: 'water-retention',
      priority: 'medium',
      nutrient: 'Water Retention',
      currentLevel: soilData.moisture,
      targetLevel: 60,
      improvement: 60 - soilData.moisture,
      amendment: 'Organic Compost or Peat Moss',
      dosage: '4-6 kg per 100 sq ft',
      cost: 40,
      timeline: '2-3 weeks',
      expectedResult: 'Better water retention and soil structure',
      instructions: [
        'Add well-decomposed compost',
        'Mix peat moss for sandy soils',
        'Mulch surface to reduce evaporation',
        'Install drip irrigation if needed'
      ]
    });
  }

  // Sort by priority
  const priorityOrder = { high: 3, medium: 2, low: 1 };
  return recommendations.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
}

// Calculate total improvement cost
export function calculateTotalCost(recommendations: SoilImprovementRecommendation[]): number {
  return recommendations.reduce((total, rec) => total + rec.cost, 0);
}

// Get improvement timeline
export function getImprovementTimeline(recommendations: SoilImprovementRecommendation[]): string {
  if (recommendations.length === 0) return 'No improvements needed';
  
  const maxWeeks = Math.max(...recommendations.map(rec => {
    const weeks = parseInt(rec.timeline.split('-')[1] || rec.timeline.split('-')[0]);
    return weeks;
  }));
  
  return `${maxWeeks} weeks for full improvement`;
}