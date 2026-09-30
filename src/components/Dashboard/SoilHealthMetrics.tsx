import React, { useEffect, useState } from 'react';
import { useSensorData } from '../../context/SensorDataContext';
import { 
  getPHColorClass, 
  getPHDescription, 
  getSoilQualityScore 
} from '../../utils/sensorUtils';
import { Droplet, Thermometer, RefreshCw, Wifi, WifiOff, Clock, Zap, ZapOff, Activity, BarChart3, Play, Pause, Save, X } from 'lucide-react';
import { animateNutrientCircles } from '../../utils/scrollReveal';
import SoilAnalysisModal from './SoilAnalysisModal';
import { useLanguage } from '../../context/LanguageContext';
import { translations } from '../../translations';

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
  const { 
    soilHealth, 
    lastUpdate, 
    isConnected, 
    refreshData, 
    isOfflineMode,
    enableBurstMode,
    disableBurstMode,
    isBurstMode,
    dataUpdateRate
  } = useSensorData();
  
  const { lang } = useLanguage();
  const t = translations[lang];

  // State for soil analysis modal
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  useEffect(() => {
    console.log('[SoilHealthMetrics] showAnalysisModal:', showAnalysisModal);
  }, [showAnalysisModal]);
  const qualityScore = getSoilQualityScore(soilHealth);
  
  // Calculate the percentage of the circle to fill for the gauge
  const percentFilled = qualityScore / 100;
  const degrees = percentFilled * 180;
  
  // Get color based on quality score
  const getQualityColor = () => {
    if (qualityScore >= 70) return "text-green-500";
    if (qualityScore >= 50) return "text-lime-500";
    return "text-lime-700";
  };

  // Re-animate whenever sensor data changes
  useEffect(() => {
    const animateMetrics = () => {
      // Reset animations first
      const elements = document.querySelectorAll('.nutrient-circle-path, .animate-progress-bar, .animate-fill-progress');
      elements.forEach(el => {
        const element = el as HTMLElement;
        element.style.transition = 'none';
        element.style.strokeDasharray = '0, 100';
        element.style.width = '0%';
        element.style.marginLeft = '0%';
      });

      // Trigger animations after a short delay
      setTimeout(() => {
        animateNutrientCircles();
        
        // Animate progress bars with real data
        const progressBars = document.querySelectorAll('.animate-progress-bar');
        progressBars.forEach(bar => {
          const element = bar as HTMLElement;
          const targetWidth = element.getAttribute('data-width') || '0%';
          element.style.transition = 'all 1.5s cubic-bezier(0.4, 0, 0.2, 1)';
          
          // Handle pH slider position (use left instead of width)
          if (element.classList.contains('ph-slider')) {
            element.style.left = targetWidth;
          } else {
            element.style.width = targetWidth;
          }
        });
      }, 100);
    };

    animateMetrics();
  }, [soilHealth, lastUpdate]); // Re-animate when data changes

  return (
    <div className="card-glass rounded-[28px] backdrop-blur-md shadow-2xl p-5 animate-fade-in-up">
      {/* Header with connection status and refresh */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">{t.soilHealth}</h2>
        <div className="flex items-center">
          {/* Connection Status Icon Only */}
          <div className={`flex items-center px-2 py-1 rounded-full ${
            isConnected 
              ? 'bg-green-100' 
              : isOfflineMode 
              ? 'bg-lime-100' 
              : 'bg-muted'
          }`}>
            {isConnected ? <Wifi size={18} className="text-green-700" /> : <WifiOff size={18} className={isOfflineMode ? 'text-lime-700' : 'text-muted-foreground'} />}
          </div>
        </div>
      </div>
      
      <div className="flex justify-between items-center mb-6 reveal-on-scroll">
        <div className="flex flex-col">
          <span className="text-muted-foreground text-sm">{t.overallQuality}</span>
          <span className={`text-3xl font-bold ${getQualityColor()}`}>{qualityScore.toFixed(0)}%</span>
        </div>
        {/* Removed time and reload icon here, only the gauge remains */}
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
              className={`${getQualityColor()} animate-fill-progress`}
              strokeLinecap="round"
              strokeWidth="5"
              data-value={degrees}
            />
          </svg>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-6 mb-6 stagger-animation">
        <div className="flex flex-col reveal-on-scroll">
          <div className="flex items-center mb-1">
            <Droplet size={16} className="text-nutrient-oxygen mr-1" />
            <span className="text-sm">{t.moisture}</span>
          </div>
          <div className="h-2 bg-muted rounded-full w-full">
            <div 
              className="h-full bg-moisture-moist rounded-full animate-progress-bar"
              data-width={`${soilHealth.moisture}%`}
              style={{ width: `0%`, background: 'linear-gradient(90deg, #6ee7b7, #047857)' }}
            ></div>
          </div>
          <div className="text-xs mt-1">{soilHealth.moisture.toFixed(1)}%</div>
        </div>
        
        <div className="flex flex-col reveal-on-scroll">
          <div className="flex items-center mb-1">
            <div className={`w-3 h-3 rounded-full ${getPHColorClass(soilHealth.ph)} mr-1`}></div>
            <span className="text-sm">{t.phLevel}</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="text-xs">4</span>
            <div className="h-2 flex-grow bg-gradient-to-r from-nutrient-ph-acidic via-nutrient-ph-neutral to-nutrient-ph-alkaline rounded-full relative">
              <div 
                className="w-2 h-2 rounded-full bg-white shadow-md border border-gray-300 absolute top-0 transform -translate-y-[1px] animate-progress-bar ph-slider"
                data-width={`${((soilHealth.ph - 4) / 10) * 100}%`}
                style={{ left: `0%`, transition: 'left 1.5s cubic-bezier(0.4, 0, 0.2, 1)' }}
              ></div>
            </div>
            <span className="text-xs">14</span>
          </div>
          <div className="flex justify-between text-xs mt-1">
            <span>{soilHealth.ph.toFixed(1)}</span>
            <span>{getPHDescription(soilHealth.ph)}</span>
          </div>
        </div>
        
        <div className="flex flex-col reveal-on-scroll">
          <div className="flex items-center mb-1">
            <Thermometer size={16} className="text-emerald-600 mr-1" />
            <span className="text-sm">{t.temperature}</span>
          </div>
          <div className="h-2 bg-muted rounded-full w-full">
            <div 
              className="h-full rounded-full animate-progress-bar"
              data-width={`${(soilHealth.temperature / 40) * 100}%`}
              style={{ 
                width: `0%`,
                background: 'linear-gradient(90deg, #d9f99d, #15803d)'
              }}
            ></div>
          </div>
          <div className="text-xs mt-1">{soilHealth.temperature.toFixed(1)}°C</div>
        </div>
      </div>
      
      <h3 className="text-sm font-medium mb-3">{t.nutrientLevels}</h3>
      <div className="flex justify-around stagger-animation mb-6">
        <div className="flex flex-col items-center reveal-on-scroll-scale">
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
                stroke="#15803d"
                strokeWidth="3"
                strokeDasharray="0, 100"
                data-value={soilHealth.nitrogen}
                className="nutrient-circle-path"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold">{soilHealth.nitrogen.toFixed(0)}</div>
          </div>
          <span className="text-xs mt-1">{t.nitrogen}</span>
          <span className="text-xs text-muted-foreground">{soilHealth.nitrogen.toFixed(0)} mg/kg</span>
        </div>
        
        <div className="flex flex-col items-center reveal-on-scroll-scale">
          <div className="w-14 h-14 rounded-full relative flex items-center justify-center">
            <svg className="w-full h-full" viewBox="0 0 36 36">
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="rgba(5, 150, 105, 0.18)"
                strokeWidth="3"
              />
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#059669"
                strokeWidth="3"
                strokeDasharray="0, 100"
                data-value={soilHealth.phosphorus}
                className="nutrient-circle-path"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold">{soilHealth.phosphorus.toFixed(0)}</div>
          </div>
          <span className="text-xs mt-1">{t.phosphorus}</span>
          <span className="text-xs text-muted-foreground">{soilHealth.phosphorus.toFixed(0)} mg/kg</span>
        </div>
        
        <div className="flex flex-col items-center reveal-on-scroll-scale">
          <div className="w-14 h-14 rounded-full relative flex items-center justify-center">
            <svg className="w-full h-full" viewBox="0 0 36 36">
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="rgba(101, 163, 13, 0.18)"
                strokeWidth="3"
              />
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#65a30d"
                strokeWidth="3"
                strokeDasharray="0, 100"
                data-value={soilHealth.potassium}
                className="nutrient-circle-path"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold">{soilHealth.potassium.toFixed(0)}</div>
          </div>
          <span className="text-xs mt-1">{t.potassium}</span>
          <span className="text-xs text-muted-foreground">{soilHealth.potassium.toFixed(0)} mg/kg</span>
        </div>
        
        <div className="flex flex-col items-center reveal-on-scroll-scale">
          <div className="w-14 h-14 rounded-full relative flex items-center justify-center">
            <svg className="w-full h-full" viewBox="0 0 36 36">
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="rgba(16, 185, 129, 0.18)"
                strokeWidth="3"
              />
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#10b981"
                strokeWidth="3"
                strokeDasharray="0, 100"
                data-value={soilHealth.conductivity}
                className="nutrient-circle-path"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold">{soilHealth.conductivity.toFixed(0)}</div>
          </div>
          <span className="text-xs mt-1">{t.conductivity}</span>
          <span className="text-xs text-muted-foreground">{soilHealth.conductivity.toFixed(1)}%</span>
        </div>
      </div>
      
      {/* Analyze Soil Button - macOS Style with Apple Green */}
      {isConnected && (
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => setShowAnalysisModal(true)}
            className="
              inline-flex items-center justify-center px-6 py-3
              bg-gradient-to-r from-foliage/20 to-foliage/10
              hover:from-foliage/30 hover:to-foliage/20
              text-foliage border border-foliage/30 hover:border-foliage/40
              rounded-full text-sm font-medium tracking-wide
              transition-all duration-300 ease-out
              transform hover:scale-[1.02] active:scale-[0.98]
              shadow-md hover:shadow-lg backdrop-blur-md
              focus:outline-none focus:ring-2 focus:ring-foliage/30 focus:ring-offset-2
              w-auto mx-auto
            "
          >
            <BarChart3 size={18} className="mr-2" />
            {t.soilHealthAnalysis}
          </button>
        </div>
      )}

      {/* Soil Analysis Modal */}
      <SoilAnalysisModal
        isOpen={showAnalysisModal}
        onClose={() => {
          console.log('[SoilHealthMetrics] Modal onClose called');
          setShowAnalysisModal(false);
        }}
        currentSoilData={soilHealth}
      />
    </div>
  );
};

export default SoilHealthMetrics;
