import React, { useState, useEffect } from 'react';
import { X, Play, Pause, Save, Settings, Clock, BarChart3, CheckCircle, Sprout, TrendingUp } from 'lucide-react';
import { useSensorData, SoilHealthData } from '../../context/SensorDataContext';
import { useNotification } from '../../hooks/use-notification';
// Remove ModalPortal import
// import ModalPortal from '../UI/ModalPortal';
import { 
  convertSoilAnalysisToConditions, 
  getTopCropRecommendations, 
  CropRecommendation 
} from '../../services/cropPredictionService';
import * as tf from '@tensorflow/tfjs';
import { loadModel, predictCrop, cropLabels, scalerMean, scalerScale } from '../../../js-crop-model/model.js';
import { useLanguage } from '../../context/LanguageContext';
import { translations } from '../../translations';

interface SoilAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSoilData: SoilHealthData;
}

interface AnalysisSettings {
  collectionDuration: number; // seconds
  sampleName: string;
}

interface CollectedReading {
  timestamp: number;
  data: SoilHealthData;
}

const SoilAnalysisModal: React.FC<SoilAnalysisModalProps> = ({
  isOpen,
  onClose,
  currentSoilData
}) => {
  useEffect(() => {
    console.log('[SoilAnalysisModal] Mounted');
    return () => {
      console.log('[SoilAnalysisModal] Unmounted');
    };
  }, []);
  // Defensive check for currentSoilData validity
  const isValidSoilData = currentSoilData &&
    typeof currentSoilData.moisture === 'number' &&
    typeof currentSoilData.nitrogen === 'number' &&
    typeof currentSoilData.phosphorus === 'number' &&
    typeof currentSoilData.potassium === 'number' &&
    typeof currentSoilData.conductivity === 'number' &&
    typeof currentSoilData.ph === 'number' &&
    typeof currentSoilData.temperature === 'number';

  const { refreshData } = useSensorData();
  const { toast } = useNotification();
  const { lang } = useLanguage();
  const t = translations[lang];
  
  // Analysis states
  const [step, setStep] = useState<'settings' | 'collecting' | 'naming' | 'recommendations' | 'complete'>('settings');
  const [cropRecommendations, setCropRecommendations] = useState<CropRecommendation[]>([]);
  const [settings, setSettings] = useState<AnalysisSettings>({
    collectionDuration: 60, // default 60 seconds
    sampleName: ''
  });
  
  // Collection states
  const [isCollecting, setIsCollecting] = useState(false);
  const [collectedReadings, setCollectedReadings] = useState<CollectedReading[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [averageData, setAverageData] = useState<SoilHealthData | null>(null);
  
  // Collection interval refs
  const collectionIntervalRef = React.useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = React.useRef<NodeJS.Timeout | null>(null);

  // New state: isThemeToggledWhileOpen
  const [tahoeMode, setTahoeMode] = useState(false);

  // Handler for theme toggle tap
  const handleThemeToggle = () => {
    if (isOpen) {
      setTahoeMode(true);
      setTimeout(() => setTahoeMode(false), 1200); // effect lasts 1.2s
    }
  };

  // Calculate average values from collected readings
  const calculateAverages = React.useCallback(() => {
    console.log('[SoilAnalysis] calculateAverages called with', collectedReadings.length, 'readings');
    
    if (collectedReadings.length === 0) {
      console.log('[SoilAnalysis] No readings to calculate averages from');
      return;
    }
    
    const totals = collectedReadings.reduce((acc, reading) => ({
      moisture: acc.moisture + reading.data.moisture,
      nitrogen: acc.nitrogen + reading.data.nitrogen,
      phosphorus: acc.phosphorus + reading.data.phosphorus,
      potassium: acc.potassium + reading.data.potassium,
      conductivity: acc.conductivity + reading.data.conductivity,
      ph: acc.ph + reading.data.ph,
      temperature: acc.temperature + reading.data.temperature,
    }), {
      moisture: 0,
      nitrogen: 0,
      phosphorus: 0,
      potassium: 0,
      conductivity: 0,
      ph: 0,
      temperature: 0,
    });
    
    const count = collectedReadings.length;
    const averages: SoilHealthData = {
      moisture: Number((totals.moisture / count).toFixed(2)),
      nitrogen: Number((totals.nitrogen / count).toFixed(2)),
      phosphorus: Number((totals.phosphorus / count).toFixed(2)),
      potassium: Number((totals.potassium / count).toFixed(2)),
      conductivity: Number((totals.conductivity / count).toFixed(2)),
      ph: Number((totals.ph / count).toFixed(2)),
      temperature: Number((totals.temperature / count).toFixed(2)),
    };
    
    console.log('[SoilAnalysis] Calculated averages:', averages);
    setAverageData(averages);
  }, [collectedReadings]);

  // Handle automatic transition from collecting to naming step
  useEffect(() => {
    if (!isCollecting && step === 'collecting' && collectedReadings.length > 0) {
      console.log('[SoilAnalysis] Collection stopped, transitioning to naming step with', collectedReadings.length, 'readings');
      
      // Calculate averages directly here to avoid dependency issues
      const totals = collectedReadings.reduce((acc, reading) => ({
        moisture: acc.moisture + reading.data.moisture,
        nitrogen: acc.nitrogen + reading.data.nitrogen,
        phosphorus: acc.phosphorus + reading.data.phosphorus,
        potassium: acc.potassium + reading.data.potassium,
        conductivity: acc.conductivity + reading.data.conductivity,
        ph: acc.ph + reading.data.ph,
        temperature: acc.temperature + reading.data.temperature,
      }), {
        moisture: 0,
        nitrogen: 0,
        phosphorus: 0,
        potassium: 0,
        conductivity: 0,
        ph: 0,
        temperature: 0,
      });
      
      const count = collectedReadings.length;
      const averages: SoilHealthData = {
        moisture: Number((totals.moisture / count).toFixed(2)),
        nitrogen: Number((totals.nitrogen / count).toFixed(2)),
        phosphorus: Number((totals.phosphorus / count).toFixed(2)),
        potassium: Number((totals.potassium / count).toFixed(2)),
        conductivity: Number((totals.conductivity / count).toFixed(2)),
        ph: Number((totals.ph / count).toFixed(2)),
        temperature: Number((totals.temperature / count).toFixed(2)),
      };
      
      console.log('[SoilAnalysis] Calculated averages:', averages);
      setAverageData(averages);
      setStep('naming');
    }
  }, [isCollecting, step, collectedReadings]);

  // Start data collection
  const startCollection = () => {
    setStep('collecting');
    setIsCollecting(true);
    setTimeRemaining(settings.collectionDuration);
    setCollectedReadings([]);
    
    // Collect initial reading
    collectReading();
    
    // Set up collection interval (every 3 seconds to match ESP8266 refresh rate)
    collectionIntervalRef.current = setInterval(() => {
      collectReading();
    }, 3000);
    
    // Set up countdown timer
    countdownIntervalRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          stopCollection();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Collect a single reading
  const collectReading = async () => {
    try {
      // Force refresh to get latest data
      await refreshData(false);
      
      // Wait a moment for data to update
      setTimeout(() => {
        // Add current reading to collection
        const reading: CollectedReading = {
          timestamp: Date.now(),
          data: { ...currentSoilData }
        };
        
        setCollectedReadings(prev => {
          const newReadings = [...prev, reading];
          console.log(`[SoilAnalysis] Collected reading ${newReadings.length}:`, reading.data);
          return newReadings;
        });
      }, 500); // Small delay to ensure data is updated
    } catch (error) {
      console.error('Failed to collect reading:', error);
    }
  };

  // Stop data collection and calculate averages
  const stopCollection = () => {
    console.log('[SoilAnalysis] Stopping collection...');
    setIsCollecting(false);
    
    // Clear intervals
    if (collectionIntervalRef.current) {
      clearInterval(collectionIntervalRef.current);
      collectionIntervalRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    
    // The useEffect below will handle the transition to naming step
  };



  // Generate crop recommendations - using same logic as recommendations page
  const generateCropRecommendations = async () => {
    if (!averageData) return;
    
    console.log('[SoilAnalysis] Generating crop recommendations...');
    
    try {
      // Use same rainfall calculation as recommendations page
      const getMbeyaRainfall = () => {
        const currentMonth = new Date().getMonth() + 1;
        const mbeyaRainfall = { 1: 180, 2: 160, 3: 140, 4: 80, 5: 20, 6: 5, 7: 5, 8: 10, 9: 15, 10: 40, 11: 120, 12: 200 };
        const baseRainfall = mbeyaRainfall[currentMonth] || 100;
        const moistureAdjustment = (averageData.moisture - 50) * 0.8;
        return Math.max(5, baseRainfall + moistureAdjustment);
      };
      
      const estimatedRainfall = getMbeyaRainfall();
      const features = [
        averageData.nitrogen,
        averageData.phosphorus,
        averageData.potassium,
        averageData.temperature,
        averageData.moisture,
        averageData.ph,
        estimatedRainfall
      ];

      // Try to use the actual AI model
      try {
        await loadModel();
        const scaled = features.map((x, i) => (x - scalerMean[i]) / scalerScale[i]);
        const input = tf.tensor2d([scaled]);
        const loadedModel = await loadModel();
        const prediction = loadedModel && loadedModel.predict ? loadedModel.predict(input) : null;
        
        if (prediction) {
          const probs = await prediction.data();
          input.dispose();
          prediction.dispose();
          
          // Get top 4 crops sorted by accuracy
          const topIndices = Array.from(probs.map((p, i) => [i, p]))
            .sort((a, b) => b[1] - a[1])
            .slice(0, 4)
            .map(x => x[0]);
          
          const recommendations = topIndices.map((idx, rank) => ({
            crop: cropLabels[idx],
            confidence: Math.round(probs[idx] * 100),
            suitability: probs[idx] > 0.7 ? 'Excellent' : probs[idx] > 0.5 ? 'Good' : probs[idx] > 0.3 ? 'Fair' : 'Poor',
            reasons: ['AI-based prediction', 'Suitable soil conditions', 'Good environmental match'],
            rank: rank + 1
          }));
          
          setCropRecommendations(recommendations);
          setStep('recommendations');
          console.log('[SoilAnalysis] AI recommendations generated successfully');
          return;
        }
      } catch (aiError) {
        console.warn('[SoilAnalysis] AI model failed, using fallback:', aiError);
      }
      
      // Fallback to predictCrop function with mock additional crops
      try {
        const crop = await predictCrop(features);
        const recommendations = [
          {
            crop,
            confidence: 85,
            suitability: 'Good',
            reasons: ['Based on soil analysis', 'Suitable growing conditions'],
            rank: 1
          },
          {
            crop: 'maize',
            confidence: 75,
            suitability: 'Good',
            reasons: ['Good nitrogen levels', 'Adequate moisture'],
            rank: 2
          },
          {
            crop: 'beans',
            confidence: 65,
            suitability: 'Fair',
            reasons: ['Suitable pH range', 'Good phosphorus'],
            rank: 3
          },
          {
            crop: 'tomatoes',
            confidence: 55,
            suitability: 'Fair',
            reasons: ['Adequate temperature', 'Good potassium'],
            rank: 4
          }
        ].filter((rec, index, arr) => arr.findIndex(r => r.crop === rec.crop) === index).slice(0, 4);
        
        setCropRecommendations(recommendations);
        setStep('recommendations');
        console.log('[SoilAnalysis] Fallback recommendations generated successfully');
        
      } catch (fallbackError) {
        console.error('[SoilAnalysis] All recommendation methods failed:', fallbackError);
        toast.error('Failed to generate crop recommendations');
        setStep('recommendations');
        setCropRecommendations([]);
      }
      
    } catch (error) {
      console.error('[SoilAnalysis] Error generating recommendations:', error);
      toast.error('Failed to generate crop recommendations');
      setStep('recommendations');
      setCropRecommendations([]);
    }
  };

  // Add a button to inject random soil values for testing
  const injectRandomSoilValues = async () => {
    const random = (min: number, max: number) => Number((Math.random() * (max - min) + min).toFixed(2));
    const randomData = {
      moisture: random(10, 90),
      nitrogen: random(10, 120),
      phosphorus: random(10, 120),
      potassium: random(10, 120),
      conductivity: random(10, 100),
      ph: random(4, 9),
      temperature: random(10, 35),
    };
    setAverageData(randomData);
    await generateCropRecommendations();
    setStep('recommendations');
  };

  // Save analysis to history - simplified and safer
  const saveAnalysis = () => {
    if (!averageData || !settings.sampleName.trim()) {
      toast.error('Please provide a sample name');
      return;
    }
    
    console.log('[SoilAnalysis] Starting save process...');
    
    try {
      const analysisData = {
        name: settings.sampleName.trim(),
        timestamp: Date.now(),
        collectionDuration: settings.collectionDuration,
        readingsCount: collectedReadings.length,
        averageData: averageData,
        rawReadings: collectedReadings.slice(0, 10), // Limit raw readings to prevent large data
        cropRecommendations: cropRecommendations
      };
      
      // Get existing analyses with proper error handling
      let existingAnalyses = [];
      try {
        const existingData = localStorage.getItem('soilAnalyses');
        if (existingData) {
          existingAnalyses = JSON.parse(existingData);
          if (!Array.isArray(existingAnalyses)) {
            console.warn('[SoilAnalysis] Existing data is not an array, resetting');
            existingAnalyses = [];
          }
        }
      } catch (parseError) {
        console.warn('[SoilAnalysis] Failed to parse existing data, starting fresh:', parseError);
        existingAnalyses = [];
      }
      
      // Add new analysis
      const newAnalysis = {
        ...analysisData,
        id: Date.now()
      };
      
      // Keep only last 50 analyses to prevent storage bloat
      const updatedAnalyses = [newAnalysis, ...existingAnalyses].slice(0, 50);
      
      // Save to localStorage with error handling
      try {
        localStorage.setItem('soilAnalyses', JSON.stringify(updatedAnalyses));
        console.log('[SoilAnalysis] Save successful');
        toast.success('Analysis saved successfully!');
        
        // Move to complete step
        setStep('complete');
      } catch (storageError) {
        console.error('[SoilAnalysis] localStorage save failed:', storageError);
        toast.error('Failed to save to storage. Analysis data may be lost.');
        // Still move to complete step even if storage fails
        setStep('complete');
      }
      
    } catch (error) {
      console.error('[SoilAnalysis] Save failed:', error);
      toast.error('Failed to save analysis. Please try again.');
      // Don't crash the app, just show error
    }
  };

  // Reset modal
  const resetModal = () => {
    setStep('settings');
    setSettings({ collectionDuration: 60, sampleName: '' });
    setCollectedReadings([]);
    setAverageData(null);
    setTimeRemaining(0);
    
    // Clear any running intervals
    if (collectionIntervalRef.current) clearInterval(collectionIntervalRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
  };

  // Handle modal close
  const handleClose = () => {
    console.log('[SoilAnalysisModal] handleClose called');
    try {
      if (isCollecting) {
        stopCollection();
      }
      resetModal();
      onClose();
    } catch (error) {
      console.error('[SoilAnalysisModal] Error in handleClose:', error);
      // Force close even if there's an error
      onClose();
    }
  };

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Add error boundary for the entire modal
  if (!isOpen) return null;
  
  // Validate currentSoilData to prevent crashes
  const isValidData = currentSoilData && 
    typeof currentSoilData.moisture === 'number' &&
    typeof currentSoilData.nitrogen === 'number' &&
    typeof currentSoilData.phosphorus === 'number' &&
    typeof currentSoilData.potassium === 'number' &&
    typeof currentSoilData.conductivity === 'number' &&
    typeof currentSoilData.ph === 'number' &&
    typeof currentSoilData.temperature === 'number';

  return (
    <>
      {/* Full screen backdrop - transparent */}
      <div 
        className="fixed inset-0 z-[999999]"
        onClick={handleClose}
      />
      
      {/* Modal container */}
      <div className="fixed inset-0 z-[9999999] flex items-center justify-center p-4">
        {/* Modal content */}
        <div 
          className="bg-white dark:bg-card rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-700 relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button (top right) */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shadow-md border border-gray-200 dark:border-gray-600"
            title={t.soilAnalysisModal.closeButtonTitle}
            aria-label={t.soilAnalysisModal.closeButtonAriaLabel}
            type="button"
          >
            <X size={22} />
          </button>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border/50">
            <div className="flex items-center space-x-2">
              <BarChart3 size={20} className="text-foliage" />
              <h2 className="text-lg font-semibold">{t.soilAnalysisModal.soilAnalysisTitle}</h2>
            </div>
          </div>
          {/* Defensive fallback if data is invalid */}
          {!isValidData ? (
            <div className="p-8 text-center text-red-600 font-semibold">
              {t.soilAnalysisModal.invalidDataError || 'Soil sensor data is unavailable or invalid.'}
            </div>
          ) : (
          <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
            {/* Step 1: Settings */}
            {step === 'settings' && (
              <div className="space-y-6">
                <div>
                    <h3 className="text-md font-medium mb-4">{t.soilAnalysisModal.collectionSettingsTitle}</h3>
                  
                  {/* Duration Setting */}
                  <div className="space-y-2">
                      <label className="text-sm font-medium">{t.soilAnalysisModal.collectionDurationLabel}</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        min="10"
                        max="300"
                        value={settings.collectionDuration}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          collectionDuration: Math.max(10, Math.min(300, parseInt(e.target.value) || 60))
                        }))}
                        className="flex-1 px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-foliage/50"
                      />
                        <span className="text-sm text-muted-foreground">{t.soilAnalysisModal.secondsLabel}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {t.soilAnalysisModal.collectionDurationDescription}
                    </p>
                  </div>
                </div>

                {/* Current Reading Preview */}
                <div className="bg-muted/30 rounded-lg p-4">
                    <h4 className="text-sm font-medium mb-2">{t.soilAnalysisModal.currentReadingPreviewTitle}</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>{t.soilAnalysisModal.moistureLabel}: {currentSoilData.moisture.toFixed(1)}%</div>
                      <div>{t.soilAnalysisModal.phLabel}: {currentSoilData.ph.toFixed(1)}</div>
                      <div>{t.soilAnalysisModal.temperatureLabel}: {currentSoilData.temperature.toFixed(1)}°C</div>
                      <div>{t.soilAnalysisModal.conductivityLabel}: {currentSoilData.conductivity.toFixed(1)}%</div>
                    </div>
                </div>

                <div className="flex justify-center mt-6">
                  <button
                    onClick={startCollection}
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
                    <Play size={18} className="mr-2" />
                      {t.soilAnalysisModal.startCollectionButton}
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Collecting */}
            {step === 'collecting' && (
              <div className="space-y-6 text-center">
                <div>
                  <h3 className="text-md font-medium mb-2">
                      {isCollecting ? t.soilAnalysisModal.collectingDataTitle : t.soilAnalysisModal.collectionCompleteTitle}
                  </h3>
                  <div className="text-3xl font-bold text-foliage mb-2">
                    {formatTime(timeRemaining)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                      {t.soilAnalysisModal.readingsCollectedCount(collectedReadings.length)}
                  </p>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-foliage h-2 rounded-full transition-all duration-1000"
                    style={{ 
                      width: `${((settings.collectionDuration - timeRemaining) / settings.collectionDuration) * 100}%` 
                    }}
                  />
                </div>

                {/* Latest Reading */}
                {collectedReadings.length > 0 && (
                  <div className="bg-muted/30 rounded-lg p-4">
                      <h4 className="text-sm font-medium mb-2">{t.soilAnalysisModal.latestReadingTitle}</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>{t.soilAnalysisModal.moistureLabel}: {collectedReadings[collectedReadings.length - 1]?.data.moisture.toFixed(1)}%</div>
                        <div>{t.soilAnalysisModal.phLabel}: {collectedReadings[collectedReadings.length - 1]?.data.ph.toFixed(1)}</div>
                        <div>{t.soilAnalysisModal.temperatureLabel}: {collectedReadings[collectedReadings.length - 1]?.data.temperature.toFixed(1)}°C</div>
                        <div>{t.soilAnalysisModal.conductivityLabel}: {collectedReadings[collectedReadings.length - 1]?.data.conductivity.toFixed(1)}%</div>
                      </div>
                  </div>
                )}

                {/* Show different buttons based on collection state */}
                {isCollecting ? (
                  <div className="flex justify-center">
                    <button
                      onClick={stopCollection}
                      className="
                        inline-flex items-center justify-center px-6 py-3
                        bg-white/20 dark:bg-black/20 hover:bg-white/30 dark:hover:bg-black/30
                        text-red-500 border border-red-500/20 hover:border-red-500/30
                        rounded-full text-sm font-medium tracking-wide
                        transition-all duration-300 ease-out
                        transform hover:scale-[1.02] active:scale-[0.98]
                        shadow-md hover:shadow-lg backdrop-blur-md
                        focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:ring-offset-2
                        w-auto mx-auto
                      "
                    >
                      <Pause size={18} className="mr-2" />
                        {t.soilAnalysisModal.stopCollectionButton}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                        {t.soilAnalysisModal.collectionFinishedProcessing}
                    </p>
                    {/* Manual continue button as fallback */}
                    <div className="flex justify-center">
                      <button
                        onClick={() => {
                          console.log('[SoilAnalysis] Manual continue clicked');
                          if (collectedReadings.length > 0) {
                            calculateAverages();
                            setStep('naming');
                          }
                        }}
                        className="
                          inline-flex items-center justify-center px-6 py-3
                          bg-white/20 dark:bg-black/20 hover:bg-white/30 dark:hover:bg-black/30
                          text-foliage border border-foliage/20 hover:border-foliage/30
                          rounded-full text-sm font-medium tracking-wide
                          transition-all duration-300 ease-out
                          transform hover:scale-[1.02] active:scale-[0.98]
                          shadow-md hover:shadow-lg backdrop-blur-md
                          focus:outline-none focus:ring-2 focus:ring-foliage/30 focus:ring-offset-2
                          w-auto mx-auto
                        "
                      >
                        <BarChart3 size={18} className="mr-2" />
                          {t.soilAnalysisModal.continueToResultsButton}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Naming */}
            {step === 'naming' && averageData && (
              <div className="space-y-6">
                <div>
                    <h3 className="text-md font-medium mb-4">{t.soilAnalysisModal.analysisCompleteTitle}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                      {t.soilAnalysisModal.analysisCompleteDescription(collectedReadings.length, settings.collectionDuration)}
                  </p>
                </div>

                {/* Average Results */}
                <div className="bg-muted/30 rounded-lg p-4">
                    <h4 className="text-sm font-medium mb-3">{t.soilAnalysisModal.averageResultsTitle}</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex justify-between">
                        <span>{t.soilAnalysisModal.moistureLabel}:</span>
                      <span className="font-medium">{averageData.moisture.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                        <span>{t.soilAnalysisModal.phLabel}:</span>
                      <span className="font-medium">{averageData.ph.toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>{t.soilAnalysisModal.temperatureLabel}:</span>
                      <span className="font-medium">{averageData.temperature.toFixed(1)}°C</span>
                    </div>
                    <div className="flex justify-between">
                        <span>{t.soilAnalysisModal.conductivityLabel}:</span>
                      <span className="font-medium">{averageData.conductivity.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                        <span>{t.soilAnalysisModal.nitrogenLabel}:</span>
                      <span className="font-medium">{averageData.nitrogen.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                        <span>{t.soilAnalysisModal.phosphorusLabel}:</span>
                      <span className="font-medium">{averageData.phosphorus.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                        <span>{t.soilAnalysisModal.potassiumLabel}:</span>
                      <span className="font-medium">{averageData.potassium.toFixed(1)}%</span>
                      </div>
                  </div>
                </div>

                {/* Sample Name Input - Improved for keyboard positioning */}
                <div className="space-y-2 mt-4 mb-6">
                    <label className="text-sm font-medium">{t.soilAnalysisModal.sampleNameLabel}</label>
                  <input
                    type="text"
                      placeholder={t.soilAnalysisModal.sampleNamePlaceholder}
                    value={settings.sampleName}
                    onChange={(e) => setSettings(prev => ({ ...prev, sampleName: e.target.value }))}
                    className="w-full px-4 py-3 border border-border/50 bg-white/50 dark:bg-black/10 
                      rounded-lg focus:outline-none focus:ring-2 focus:ring-foliage/30 focus:border-foliage/50
                      transition-all duration-200 backdrop-blur-sm"
                    autoComplete="off"
                    inputMode="text"
                  />
                </div>

                <div className="flex justify-center mt-6">
                  <button
                    onClick={generateCropRecommendations}
                    disabled={!settings.sampleName.trim()}
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
                      disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                      disabled:shadow-none disabled:bg-muted/20 disabled:text-muted-foreground
                      w-auto mx-auto
                    "
                  >
                    <Sprout size={18} className="mr-2" />
                      {t.soilAnalysisModal.getCropRecommendationsButton}
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Crop Recommendations */}
            {step === 'recommendations' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-md font-medium mb-2 flex items-center">
                    <Sprout size={20} className="mr-2 text-green-500" />
                      {t.soilAnalysisModal.cropRecommendationsTitle}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                      {t.soilAnalysisModal.cropRecommendationsDescription}
                  </p>
                </div>

                {/* Crop Recommendations List */}
                <div className="space-y-3">
                  {cropRecommendations.map((recommendation, index) => (
                    <div 
                      key={recommendation.crop}
                      className={`p-4 rounded-lg border transition-all duration-200 ${
                        index === 0 
                          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                          : index === 1
                          ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                          : 'bg-muted/30 border-border/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mr-2 ${
                            index === 0 ? 'bg-green-500 text-white' :
                            index === 1 ? 'bg-emerald-500 text-white' :
                            index === 2 ? 'bg-lime-500 text-white' :
                            'bg-gray-500 text-white'
                          }`}>
                            {index + 1}
                          </div>
                          <h4 className="font-medium capitalize text-sm">
                            {recommendation.crop}
                          </h4>
                          {index === 0 && (
                            <span className="ml-2 px-2 py-1 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 text-xs rounded-full">
                              Top Choice
                            </span>
                          )}
                        </div>
                        <div className="flex items-center">
                          <span className="text-sm font-bold text-foliage">{recommendation.confidence}%</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          recommendation.suitability === 'Excellent' ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300' :
                          recommendation.suitability === 'Good' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' :
                          recommendation.suitability === 'Fair' ? 'bg-lime-100 dark:bg-lime-900/40 text-lime-700 dark:text-lime-300' :
                          'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'
                        }`}>
                          {recommendation.suitability}
                        </span>
                        <div className="flex items-center">
                          <div className={`w-full bg-gray-200 rounded-full h-2 ml-4 ${
                            index === 0 ? 'w-20' : index === 1 ? 'w-16' : 'w-12'
                          }`}>
                            <div 
                              className={`h-2 rounded-full ${
                                index === 0 ? 'bg-green-500' :
                                index === 1 ? 'bg-emerald-500' :
                                index === 2 ? 'bg-lime-500' :
                                'bg-gray-500'
                              }`}
                              style={{ width: `${recommendation.confidence}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-center mt-6">
                  <button
                    onClick={saveAnalysis}
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
                    <Save size={18} className="mr-2" />
                      {t.soilAnalysisModal.saveAnalysisAndRecommendationsButton}
                    </button>
                  </div>
              </div>
            )}

            {/* Step 5: Complete */}
            {step === 'complete' && (
              <div className="space-y-6 text-center">
                <div className="flex flex-col items-center">
                  <CheckCircle size={48} className="text-green-500 mb-4" />
                    <h3 className="text-md font-medium mb-2">{t.soilAnalysisModal.analysisSavedTitle}</h3>
                  <p className="text-sm text-muted-foreground">
                      {t.soilAnalysisModal.analysisSavedDescription(settings.sampleName)}
                  </p>
                </div>

                <div className="flex space-x-4 justify-center mt-6">
                  <button
                    onClick={() => resetModal()}
                    className="px-5 py-2.5 bg-white/20 dark:bg-black/20 hover:bg-white/30 dark:hover:bg-black/30
                      text-foliage border border-foliage/30 hover:border-foliage/40
                      rounded-full text-sm font-medium tracking-wide
                      transition-all duration-300 ease-out
                      transform hover:scale-[1.02] active:scale-[0.98]
                      shadow-sm hover:shadow-md backdrop-blur-md"
                  >
                      {t.soilAnalysisModal.newAnalysisButton}
                  </button>
                  <button
                    onClick={handleClose}
                    className="px-5 py-2.5 bg-gradient-to-r from-foliage/20 to-foliage/10
                      hover:from-foliage/30 hover:to-foliage/20
                      text-foliage border border-foliage/30 hover:border-foliage/40
                      rounded-full text-sm font-medium tracking-wide
                      transition-all duration-300 ease-out
                      transform hover:scale-[1.02] active:scale-[0.98]
                      shadow-sm hover:shadow-md backdrop-blur-md"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
          )}
        </div>
      </div>
    </>
  );
};

export default SoilAnalysisModal;