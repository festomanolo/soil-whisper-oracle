import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../components/Layout/DashboardLayout';
import { 
  BarChart3, Database, Beaker, Clock, 
  RefreshCw, Droplet, Thermometer, Zap, Leaf
} from 'lucide-react';
import { addScrollRevealToPage } from '../utils/scrollReveal';
import { setupScrollReveal } from '../utils/scrollRevealHelper';
import { soilAnalysisService, SoilAnalysisData } from '../services/soilAnalysisService';
import { useLanguage } from '../context/LanguageContext';
import { translations } from '../translations';

const RecentAnalysis = () => {
  const [savedAnalyses, setSavedAnalyses] = useState<SoilAnalysisData[]>([]);
  const [loading, setLoading] = useState(true);
  const analysesRef = useRef<HTMLDivElement>(null);
  
  const { lang } = useLanguage();
  const t = translations[lang];

  // Simple function to load analyses
  const loadAnalyses = async () => {
    try {
      setLoading(true);
      console.log('[RecentAnalysis] Loading analyses...');
      
      // Try direct localStorage access first
      try {
        const rawData = localStorage.getItem('soilAnalyses');
        if (rawData) {
          const directData = JSON.parse(rawData);
          if (Array.isArray(directData) && directData.length > 0) {
            console.log('[RecentAnalysis] Found', directData.length, 'analyses directly in localStorage');
            setSavedAnalyses(directData);
            setLoading(false);
            return;
          }
        }
      } catch (localStorageError) {
        console.error('[RecentAnalysis] Error accessing localStorage directly:', localStorageError);
      }
      
      // Fall back to service if direct access fails
      const analyses = await soilAnalysisService.getAllAnalyses();
      console.log('[RecentAnalysis] Service returned', analyses.length, 'analyses');
      setSavedAnalyses(analyses);
    } catch (error) {
      console.error('[RecentAnalysis] Failed to load analyses:', error);
      setSavedAnalyses([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Load analyses on mount and when events occur
  useEffect(() => {
    // Initial load
    loadAnalyses();
    
    // Set up event listeners
    const handleUpdate = () => {
      console.log('[RecentAnalysis] Update event received');
      loadAnalyses();
    };
    
    window.addEventListener('soilAnalysisUpdated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    
    // Refresh every 5 seconds as a fallback
    const intervalId = setInterval(loadAnalyses, 5000);
    
    return () => {
      window.removeEventListener('soilAnalysisUpdated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
      clearInterval(intervalId);
    };
  }, []);
  
  // Initialize scroll reveal animations
  useEffect(() => {
    const cleanup = addScrollRevealToPage();
    return cleanup;
  }, []);

  // Set up scroll-triggered animations
  useEffect(() => {
    if (savedAnalyses.length > 0) {
      // Use the scroll reveal helper to set up scroll-triggered animations
      const cleanup = setupScrollReveal();
      return cleanup;
    }
  }, [savedAnalyses]);
  
  // Format timestamp
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Get color class for pH value
  const getPHColorClass = (ph: number) => {
    if (ph < 5.5) return 'bg-foliage/60';
    if (ph < 6.5) return 'bg-foliage/80';
    if (ph < 7.5) return 'bg-foliage';
    return 'bg-foliage/70';
  };

  return (
    <DashboardLayout>
      <div className="space-y-4 pb-20">
        {/* macOS-style Header */}
        <div className="bg-white/80 dark:bg-card/80 backdrop-blur-lg rounded-[20px] p-5 shadow-lg border border-white/20 dark:border-white/10">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-foliage to-foliage/70 bg-clip-text text-transparent">
                {t.recentAnalysis.title}
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                {t.recentAnalysis.description}
              </p>
            </div>
            
            <button 
              onClick={loadAnalyses}
              className="flex items-center space-x-2 px-4 py-2 bg-white/20 hover:bg-white/30 dark:bg-black/20 dark:hover:bg-black/30 backdrop-blur-md rounded-full transition-all duration-300 shadow-sm hover:shadow-md border border-white/20"
            >
              <RefreshCw size={16} className={loading ? "animate-spin text-foliage" : "text-foliage"} />
              <span>{t.recentAnalysis.refreshButton}</span>
            </button>
          </div>
        </div>
        
        {/* Analyses List with macOS-style design */}
        <div className="space-y-4" ref={analysesRef}>
          {savedAnalyses.length > 0 ? (
            savedAnalyses.map((analysis, index) => (
              <div 
                key={analysis.id} 
                className="analysis-card bg-white/80 dark:bg-card/80 backdrop-blur-lg rounded-[20px] shadow-lg border border-white/20 dark:border-white/10 overflow-hidden opacity-0 translate-y-4 transition-all duration-500"
                style={{ transitionDelay: `${index * 50}ms` }}
              >
                {/* Header with subtle gradient */}
                <div className="bg-gradient-to-r from-foliage/5 to-foliage/10 p-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-white/30 dark:bg-black/30 rounded-full mr-3">
                      <Beaker size={20} className="text-foliage" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{analysis.name || t.recentAnalysis.unnamedAnalysis}</h3>
                      <div className="flex items-center text-xs text-muted-foreground mt-1">
                        <Clock size={12} className="mr-1" />
                        {formatTimestamp(analysis.timestamp)}
                        <span className="mx-2">•</span>
                        <span>{t.recentAnalysis.readingsOverDuration(analysis.collectionDuration || 0, analysis.readingsCount || 0)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Main metrics with cohesive design */}
                <div className="p-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    {/* Moisture with progress bar */}
                    <div className="metric-box bg-foliage/5 rounded-xl p-3 shadow-sm opacity-0 translate-y-2 transition-all duration-300">
                      <div className="flex items-center mb-2">
                        <Droplet size={16} className="text-foliage mr-2" />
                        <span className="text-sm font-medium">{t.recentAnalysis.moisture}</span>
                      </div>
                      <div className="text-lg font-bold text-foliage mb-1">{analysis.averageData?.moisture || 0}%</div>
                      <div className="h-2 bg-foliage/10 rounded-full overflow-hidden">
                        <div 
                          className="progress-bar h-full bg-gradient-to-r from-foliage/60 to-foliage/80 rounded-full transition-all duration-1000 ease-out w-0"
                          style={{ transitionDelay: '0.3s' }}
                          data-width={`${analysis.averageData?.moisture || 0}%`}
                        />
                      </div>
                    </div>
                    
                    {/* pH with indicator */}
                    <div className="metric-box bg-foliage/5 rounded-xl p-3 shadow-sm opacity-0 translate-y-2 transition-all duration-300">
                      <div className="flex items-center mb-2">
                        <div className={`w-3 h-3 rounded-full ${getPHColorClass(analysis.averageData?.ph || 7)} mr-2`}></div>
                        <span className="text-sm font-medium">{t.recentAnalysis.phLevel}</span>
                      </div>
                      <div className="text-lg font-bold text-foliage mb-1">{analysis.averageData?.ph || 0}</div>
                      <div className="text-xs text-muted-foreground">
                        {analysis.averageData?.ph < 6.5 ? t.recentAnalysis.acidic : analysis.averageData?.ph > 7.5 ? t.recentAnalysis.alkaline : t.recentAnalysis.neutral}
                      </div>
                    </div>
                    
                    {/* Temperature */}
                    <div className="metric-box bg-foliage/5 rounded-xl p-3 shadow-sm opacity-0 translate-y-2 transition-all duration-300">
                      <div className="flex items-center mb-2">
                        <Thermometer size={16} className="text-foliage mr-2" />
                        <span className="text-sm font-medium">{t.recentAnalysis.temperature}</span>
                      </div>
                      <div className="text-lg font-bold text-foliage mb-1">{analysis.averageData?.temperature || 0}°C</div>
                      <div className="text-xs text-muted-foreground">
                        {analysis.averageData?.temperature < 20 ? t.recentAnalysis.cool : analysis.averageData?.temperature > 25 ? t.recentAnalysis.warm : t.recentAnalysis.optimal}
                      </div>
                    </div>
                    
                    {/* Conductivity with indicator */}
                    <div className="metric-box bg-foliage/5 rounded-xl p-3 shadow-sm opacity-0 translate-y-2 transition-all duration-300">
                      <div className="flex items-center mb-2">
                        <Zap size={16} className="text-foliage mr-2" />
                        <span className="text-sm font-medium">{t.recentAnalysis.conductivity}</span>
                      </div>
                      <div className="text-lg font-bold text-foliage mb-1">{analysis.averageData?.conductivity || 0}%</div>
                      <div className="h-2 bg-foliage/10 rounded-full overflow-hidden">
                        <div 
                          className="progress-bar h-full bg-gradient-to-r from-foliage/60 to-foliage/80 rounded-full transition-all duration-1000 ease-out w-0"
                          style={{ transitionDelay: '0.4s' }}
                          data-width={`${analysis.averageData?.conductivity || 0}%`}
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* NPK Values with cohesive design and fixed layout */}
                  <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                    <h4 className="text-sm font-medium mb-3 flex items-center">
                      <Leaf size={16} className="mr-2 text-foliage" />
                      {t.recentAnalysis.nutrientLevels}
                    </h4>
                    
                    <div className="grid grid-cols-3 gap-3">
                      {/* Nitrogen - Fixed layout with percentage below */}
                      <div className="metric-box bg-foliage/5 rounded-xl p-3 shadow-sm opacity-0 translate-y-2 transition-all duration-300">
                        <div className="flex items-center mb-1">
                          <div className="w-3 h-3 rounded-full bg-foliage/80 mr-2"></div>
                          <span className="text-sm font-medium">{t.recentAnalysis.nitrogen}</span>
                        </div>
                        <div className="text-lg font-bold text-foliage mb-2">{analysis.averageData?.nitrogen || 0}%</div>
                        <div className="h-2 bg-foliage/10 rounded-full overflow-hidden">
                          <div 
                            className="progress-bar h-full bg-gradient-to-r from-foliage/60 to-foliage/80 rounded-full transition-all duration-1000 ease-out w-0"
                            style={{ transitionDelay: '0.5s' }}
                            data-width={`${analysis.averageData?.nitrogen || 0}%`}
                          />
                        </div>
                      </div>
                      
                      {/* Phosphorus - Fixed layout with percentage below */}
                      <div className="metric-box bg-foliage/5 rounded-xl p-3 shadow-sm opacity-0 translate-y-2 transition-all duration-300">
                        <div className="flex items-center mb-1">
                          <div className="w-3 h-3 rounded-full bg-foliage/70 mr-2"></div>
                          <span className="text-sm font-medium">{t.recentAnalysis.phosphorus}</span>
                        </div>
                        <div className="text-lg font-bold text-foliage mb-2">{analysis.averageData?.phosphorus || 0}%</div>
                        <div className="h-2 bg-foliage/10 rounded-full overflow-hidden">
                          <div 
                            className="progress-bar h-full bg-gradient-to-r from-foliage/60 to-foliage/80 rounded-full transition-all duration-1000 ease-out w-0"
                            style={{ transitionDelay: '0.6s' }}
                            data-width={`${analysis.averageData?.phosphorus || 0}%`}
                          />
                        </div>
                      </div>
                      
                      {/* Potassium - Fixed layout with percentage below */}
                      <div className="metric-box bg-foliage/5 rounded-xl p-3 shadow-sm opacity-0 translate-y-2 transition-all duration-300">
                        <div className="flex items-center mb-1">
                          <div className="w-3 h-3 rounded-full bg-foliage/90 mr-2"></div>
                          <span className="text-sm font-medium">{t.recentAnalysis.potassium}</span>
                        </div>
                        <div className="text-lg font-bold text-foliage mb-2">{analysis.averageData?.potassium || 0}%</div>
                        <div className="h-2 bg-foliage/10 rounded-full overflow-hidden">
                          <div 
                            className="progress-bar h-full bg-gradient-to-r from-foliage/60 to-foliage/80 rounded-full transition-all duration-1000 ease-out w-0"
                            style={{ transitionDelay: '0.7s' }}
                            data-width={`${analysis.averageData?.potassium || 0}%`}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Crop Recommendations Section */}
                  {analysis.cropRecommendations && analysis.cropRecommendations.length > 0 && (
                    <div className="pt-3 border-t border-gray-200 dark:border-gray-700 mt-3">
                      <h4 className="text-sm font-medium mb-3 flex items-center">
                        <Leaf size={16} className="mr-2 text-green-500" />
                        {t.recentAnalysis.recommendedCrops}
                      </h4>
                      
                      <div className="space-y-2">
                        {analysis.cropRecommendations.slice(0, 3).map((recommendation: any, idx: number) => (
                          <div 
                            key={recommendation.crop}
                            className={`metric-box flex items-center justify-between p-3 rounded-lg opacity-0 translate-y-2 transition-all duration-300 ${
                              idx === 0 
                                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
                                : 'bg-muted/30'
                            }`}
                            style={{ transitionDelay: `${0.8 + idx * 0.1}s` }}
                          >
                            <div className="flex items-center">
                              <div className={`w-2 h-2 rounded-full mr-3 ${
                                recommendation.suitability === 'Excellent' ? 'bg-green-500' :
                                recommendation.suitability === 'Good' ? 'bg-emerald-500' :
                                recommendation.suitability === 'Fair' ? 'bg-lime-500' :
                                'bg-lime-700'
                              }`}></div>
                              <div>
                                <span className="text-sm font-medium capitalize">{t.cropsMap[recommendation.crop?.toLowerCase()] || recommendation.crop}</span>
                                {idx === 0 && (
                                  <span className="ml-2 text-xs bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full">
                                    {t.recentAnalysis.best}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium">{recommendation.confidence}%</div>
                              <div className="text-xs text-muted-foreground">{t.suitabilityMap[recommendation.suitability] || recommendation.suitability}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : loading ? (
            <div className="bg-white/80 dark:bg-card/80 backdrop-blur-lg rounded-[20px] shadow-lg border border-white/20 dark:border-white/10 p-8 text-center">
              <div className="w-16 h-16 border-4 border-foliage/30 border-t-foliage rounded-full mx-auto mb-6 animate-spin"></div>
              <h3 className="text-xl font-semibold mb-3 bg-gradient-to-r from-foliage to-foliage/70 bg-clip-text text-transparent">
                {t.recentAnalysis.loadingAnalyses}
              </h3>
              <p className="text-muted-foreground">
                {t.recentAnalysis.retrievingHistory}
              </p>
            </div>
          ) : (
            <div className="bg-white/80 dark:bg-card/80 backdrop-blur-lg rounded-[20px] shadow-lg border border-white/20 dark:border-white/10 p-8 text-center">
              <Beaker size={64} className="mx-auto text-foliage/70 mb-6" />
              <h3 className="text-xl font-semibold mb-3 bg-gradient-to-r from-foliage to-foliage/70 bg-clip-text text-transparent">
                {t.recentAnalysis.noAnalysesYet}
              </h3>
              <p className="text-muted-foreground mb-6">
                {t.recentAnalysis.startAnalyzing}
              </p>
              <a 
                href="/soil-health" 
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-foliage to-foliage/80 text-white rounded-full font-medium shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Beaker size={18} className="mr-2" />
                {t.recentAnalysis.analyzeSoilSample}
              </a>
            </div>
          )}
        </div>
        
        {/* Footer with macOS-style design */}
        <div className="flex items-center p-4 bg-white/50 dark:bg-black/20 backdrop-blur-md rounded-[16px] shadow-md border border-white/20">
          <Database size={18} className="text-foliage mr-3" />
          <span className="text-sm">
            {t.recentAnalysis.dataStored}
          </span>
        </div>
      </div>

      {/* Add CSS for manual animations */}
      <style jsx>{`
        .analysis-card.revealed {
          opacity: 1;
          transform: translateY(0);
        }
        
        .metric-box.revealed {
          opacity: 1;
          transform: translateY(0);
        }
        
        .progress-bar.revealed {
          width: var(--width);
        }
      `}</style>
    </DashboardLayout>
  );
};

export default RecentAnalysis;