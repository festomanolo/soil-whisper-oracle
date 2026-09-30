import React, { useEffect } from 'react';
import { useSensorData } from '../../context/SensorDataContext';
import { Leaf, AlertTriangle, Droplet } from 'lucide-react';
import { animateNutrientCircles } from '../../utils/scrollReveal';

const CropRecommendations = () => {
  const { recommendedCrops } = useSensorData();

  // Run animation when component mounts
  useEffect(() => {
    animateNutrientCircles();
  }, []);

  // Get color class based on confidence level
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 85) return "bg-green-500";
    if (confidence >= 70) return "bg-lime-500";
    return "bg-lime-500";
  };

  // Get water requirement icons
  const getWaterRequirementIcons = (requirement: string) => {
    switch(requirement) {
      case 'low':
        return (
          <div className="flex items-center">
            <Droplet size={14} className="text-emerald-400 fill-emerald-400 opacity-40" />
            <Droplet size={14} className="text-emerald-400 opacity-30" />
            <Droplet size={14} className="text-emerald-400 opacity-30" />
          </div>
        );
      case 'moderate':
        return (
          <div className="flex items-center">
            <Droplet size={14} className="text-emerald-400 fill-emerald-400" />
            <Droplet size={14} className="text-emerald-400 fill-emerald-400" />
            <Droplet size={14} className="text-emerald-400 opacity-30" />
          </div>
        );
      case 'high':
        return (
          <div className="flex items-center">
            <Droplet size={14} className="text-emerald-400 fill-emerald-400" />
            <Droplet size={14} className="text-emerald-400 fill-emerald-400" />
            <Droplet size={14} className="text-emerald-400 fill-emerald-400" />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="card-glass rounded-[28px] backdrop-blur-md shadow-2xl p-5 reveal-on-scroll">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Crop Recommendations</h2>
        <div className="bg-primary px-2 py-0.5 rounded-full text-xs font-medium text-primary-foreground flex items-center">
          <Leaf size={14} className="mr-1" />
          AI Suggested
        </div>
      </div>
      
      <div className="space-y-4 stagger-animation">
        {recommendedCrops.map((crop, index) => (
          <div 
            key={crop.name} 
            className={`bg-muted/60 rounded-[20px] shadow-lg p-4 ${index === 0 ? 'border-2 border-primary' : ''} reveal-on-scroll`}
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center">
                  <h3 className="text-lg font-medium">{crop.name}</h3>
                  {index === 0 && (
                    <span className="ml-2 bg-primary/20 text-primary text-xs px-2 py-0.5 rounded-full">
                      Best Match
                    </span>
                  )}
                </div>
                
                <div className="flex items-center mt-2 text-sm text-muted-foreground">
                  <div className="mr-4">
                    <span className="font-medium">Time to Maturity:</span> {crop.timeToMaturity} days
                  </div>
                  <div>
                    <span className="font-medium">Water:</span> {getWaterRequirementIcons(crop.waterRequirements)}
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col items-end">
                <div className="flex items-center">
                  <span className="text-sm mr-2">Confidence</span>
                  <span className={`text-xs py-0.5 px-2 rounded-full text-white ${getConfidenceColor(crop.confidence)}`}>
                    {crop.confidence}%
                  </span>
                </div>
              </div>
            </div>
            
            <div className="mt-3 pt-3 border-t border-border">
              <h4 className="text-sm font-medium flex items-center mb-2">
                <AlertTriangle size={14} className="text-lime-500 mr-1" />
                Soil Enrichment Required
              </h4>
              <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground pl-1">
                {crop.soilEnrichment.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>

            <button className="mt-3 w-full py-1.5 bg-accent hover:bg-accent/80 text-accent-foreground rounded-[14px] text-sm font-medium transition-colors">
              Select This Crop
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CropRecommendations;
