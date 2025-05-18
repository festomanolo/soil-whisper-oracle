
import React from 'react';
import { useSensorData } from '../../context/SensorDataContext';
import { 
  getPHColorClass, 
  getPHDescription, 
  getSoilQualityScore 
} from '../../utils/sensorUtils';
import { Droplet, Thermometer } from 'lucide-react';

// Helper function to draw arc for gauge
const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
  return {
    x: centerX + (radius * Math.cos(angleInRadians)),
    y: centerY + (radius * Math.sin(angleInRadians))
  };
};

// Create an SVG path for an arc
const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  
  return [
    "M", start.x, start.y, 
    "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
  ].join(" ");
};

const NutrientRing = ({ 
  value, 
  color, 
  icon: Icon, 
  name 
}: { 
  value: number; 
  color: string; 
  icon: React.ComponentType<any>; 
  name: string;
}) => (
  <div className="flex flex-col items-center">
    <div className={`nutrient-ring border-${color} w-14 h-14`}>
      <Icon className={`text-${color}`} size={20} />
      <span className="absolute -bottom-1 -right-1 bg-background text-xs px-1.5 py-0.5 rounded-full font-medium">
        {value}%
      </span>
    </div>
    <span className="text-xs mt-1 text-muted-foreground">{name}</span>
  </div>
);

const SoilHealthMetrics = () => {
  const { soilHealth } = useSensorData();
  const qualityScore = getSoilQualityScore(soilHealth);
  
  // Calculate the percentage of the circle to fill for the gauge
  const percentFilled = qualityScore / 100;
  const degrees = percentFilled * 180;
  
  // Get color based on quality score
  const getQualityColor = () => {
    if (qualityScore >= 70) return "text-green-500";
    if (qualityScore >= 50) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <div className="card-glass p-5 animate-fade-in-up">
      <h2 className="text-lg font-semibold mb-4">Soil Health</h2>
      
      <div className="flex justify-between items-center mb-6">
        <div className="flex flex-col">
          <span className="text-muted-foreground text-sm">Overall Quality</span>
          <span className={`text-3xl font-bold ${getQualityColor()}`}>
            {qualityScore.toFixed(0)}%
          </span>
        </div>
        
        <div className="relative w-24 h-12">
          <svg className="w-full h-full">
            {/* Background arc */}
            <path
              d={describeArc(48, 48, 40, 0, 180)}
              fill="none"
              stroke="currentColor"
              strokeOpacity="0.2"
              strokeWidth="5"
            />
            {/* Foreground arc based on quality */}
            <path
              d={describeArc(48, 48, 40, 0, degrees)}
              fill="none"
              className={getQualityColor()}
              strokeLinecap="round"
              strokeWidth="5"
            />
          </svg>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-6 mb-6">
        <div className="flex flex-col">
          <div className="flex items-center mb-1">
            <Droplet size={16} className="text-nutrient-oxygen mr-1" />
            <span className="text-sm">Moisture</span>
          </div>
          <div className="h-2 bg-muted rounded-full w-full">
            <div 
              className="h-full bg-moisture-moist rounded-full" 
              style={{ width: `${soilHealth.moisture}%`, background: 'linear-gradient(90deg, #0288D1, #01579B)' }}
            ></div>
          </div>
          <div className="text-xs mt-1">{soilHealth.moisture.toFixed(1)}%</div>
        </div>
        
        <div className="flex flex-col">
          <div className="flex items-center mb-1">
            <div className={`w-3 h-3 rounded-full ${getPHColorClass(soilHealth.ph)} mr-1`}></div>
            <span className="text-sm">pH Level</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="text-xs">4</span>
            <div className="h-2 flex-grow bg-gradient-to-r from-nutrient-ph-acidic via-nutrient-ph-neutral to-nutrient-ph-alkaline rounded-full">
              <div 
                className="w-2 h-2 rounded-full bg-white translate-y-[-2px]"
                style={{ marginLeft: `${((soilHealth.ph - 4) / 10) * 100}%` }}
              ></div>
            </div>
            <span className="text-xs">14</span>
          </div>
          <div className="flex justify-between text-xs mt-1">
            <span>{soilHealth.ph.toFixed(1)}</span>
            <span>{getPHDescription(soilHealth.ph)}</span>
          </div>
        </div>
        
        <div className="flex flex-col">
          <div className="flex items-center mb-1">
            <Thermometer size={16} className="text-red-500 mr-1" />
            <span className="text-sm">Temperature</span>
          </div>
          <div className="h-2 bg-muted rounded-full w-full">
            <div 
              className="h-full rounded-full" 
              style={{ 
                width: `${(soilHealth.temperature / 40) * 100}%`,
                background: 'linear-gradient(90deg, #BBDEFB, #FF8A65)'
              }}
            ></div>
          </div>
          <div className="text-xs mt-1">{soilHealth.temperature.toFixed(1)}°C</div>
        </div>
      </div>
      
      <h3 className="text-sm font-medium mb-3">Nutrient Levels</h3>
      <div className="flex justify-around">
        <div className="flex flex-col items-center">
          <div className="w-14 h-14 rounded-full relative flex items-center justify-center">
            <svg className="w-full h-full" viewBox="0 0 36 36">
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="rgba(90, 160, 90, 0.2)"
                strokeWidth="3"
              />
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#388E3C"
                strokeWidth="3"
                strokeDasharray={`${soilHealth.nitrogen}, 100`}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-xs font-medium">N</div>
          </div>
          <span className="text-xs mt-1">Nitrogen</span>
          <span className="text-xs text-muted-foreground">{soilHealth.nitrogen.toFixed(1)}%</span>
        </div>
        
        <div className="flex flex-col items-center">
          <div className="w-14 h-14 rounded-full relative flex items-center justify-center">
            <svg className="w-full h-full" viewBox="0 0 36 36">
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="rgba(73, 130, 201, 0.2)"
                strokeWidth="3"
              />
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#1976D2"
                strokeWidth="3"
                strokeDasharray={`${soilHealth.phosphorus}, 100`}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-xs font-medium">P</div>
          </div>
          <span className="text-xs mt-1">Phosphorus</span>
          <span className="text-xs text-muted-foreground">{soilHealth.phosphorus.toFixed(1)}%</span>
        </div>
        
        <div className="flex flex-col items-center">
          <div className="w-14 h-14 rounded-full relative flex items-center justify-center">
            <svg className="w-full h-full" viewBox="0 0 36 36">
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="rgba(255, 160, 0, 0.2)"
                strokeWidth="3"
              />
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#FFA000"
                strokeWidth="3"
                strokeDasharray={`${soilHealth.potassium}, 100`}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-xs font-medium">K</div>
          </div>
          <span className="text-xs mt-1">Potassium</span>
          <span className="text-xs text-muted-foreground">{soilHealth.potassium.toFixed(1)}%</span>
        </div>
        
        <div className="flex flex-col items-center">
          <div className="w-14 h-14 rounded-full relative flex items-center justify-center">
            <svg className="w-full h-full" viewBox="0 0 36 36">
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="rgba(41, 182, 246, 0.2)"
                strokeWidth="3"
              />
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#29B6F6"
                strokeWidth="3"
                strokeDasharray={`${soilHealth.oxygen}, 100`}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-xs font-medium">O₂</div>
          </div>
          <span className="text-xs mt-1">Oxygen</span>
          <span className="text-xs text-muted-foreground">{soilHealth.oxygen.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
};

export default SoilHealthMetrics;
