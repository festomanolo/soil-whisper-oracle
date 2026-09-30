import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { esp32Service } from '../services/esp32Service';
import { offlineStorage } from '../services/offlineStorage';
import { databaseService } from '../services/database';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';
import { NotificationContext } from './NotificationContext';
import { convertSoilAnalysisToConditions, getTopCropRecommendations } from '../services/cropPredictionService';

// Define our sensor data types
export type SoilHealthData = {
  moisture: number; // 0-100%
  nitrogen: number; // 0-100%
  phosphorus: number; // 0-100%
  potassium: number; // 0-100%
  conductivity: number; // 0-100%
  ph: number; // 0-14 scale
  temperature: number; // Celsius
};

export type CropRecommendation = {
  name: string;
  confidence: number; // 0-100%
  timeToMaturity: number; // days
  waterRequirements: 'low' | 'moderate' | 'high';
  soilEnrichment: string[];
};

interface SensorContextType {
  soilHealth: SoilHealthData;
  recommendedCrops: CropRecommendation[];
  isConnected: boolean;
  lastUpdate: Date;
  refreshData: (showDataNotifications?: boolean) => void;
  connectToSensor: (showConnectionNotifications?: boolean) => void;
  isOfflineMode: boolean;
  esp32IP: string;
  setESP32IP: (ip: string) => void;
  // ULTRA-RAPID: New burst mode capabilities
  enableBurstMode: () => void;
  disableBurstMode: () => void;
  isBurstMode: boolean;
  dataUpdateRate: number; // Updates per second
}

const defaultSoilHealth: SoilHealthData = {
  moisture: 65,
  nitrogen: 42,
  phosphorus: 31,
  potassium: 58,
  conductivity: 76,
  ph: 6.8,
  temperature: 22,
};

const defaultCropRecommendations: CropRecommendation[] = [
  {
    name: 'Tomatoes',
    confidence: 78,
    timeToMaturity: 75,
    waterRequirements: 'moderate',
    soilEnrichment: ['Add 10% more nitrogen', 'Increase phosphorus by 5%'],
  },
  {
    name: 'Bell Peppers',
    confidence: 72,
    timeToMaturity: 90,
    waterRequirements: 'moderate',
    soilEnrichment: ['Add 5% more potassium'],
  },
  {
    name: 'Carrots',
    confidence: 65,
    timeToMaturity: 70,
    waterRequirements: 'moderate',
    soilEnrichment: ['Loosen soil structure', 'Reduce nitrogen by 8%'],
  },
];

const SensorDataContext = createContext<SensorContextType | undefined>(undefined);

export const useSensorData = () => {
  const context = useContext(SensorDataContext);
  if (!context) {
    throw new Error('useSensorData must be used within a SensorDataProvider');
  }
  return context;
};

interface SensorDataProviderProps {
  children: ReactNode;
}

// Global flag to track if app has been initialized (persists across page navigation)
let appHasInitialized = false;

export const SensorDataProvider = ({ children }: SensorDataProviderProps) => {
  console.log('[SensorDataContext] Initializing SensorDataProvider');
  
  const { showNotification } = useContext(NotificationContext);
  
  const [soilHealth, setSoilHealth] = useState<SoilHealthData>(defaultSoilHealth);
  const [recommendedCrops, setRecommendedCrops] = useState<CropRecommendation[]>(defaultCropRecommendations);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [esp32IP, setESP32IPState] = useState(esp32Service.getIP());
  // ULTRA-RAPID: Burst mode state management
  const [isBurstMode, setIsBurstMode] = useState(false);
  const [dataUpdateRate, setDataUpdateRate] = useState(0.33); // 0.33 updates per second (every 3 seconds) - ESP8266 friendly
  
  console.log('[SensorDataContext] Initial ESP32 IP:', esp32Service.getIP());
  
  const setESP32IP = (ip: string) => {
    console.log('[SensorDataContext] Setting ESP32 IP to:', ip);
    esp32Service.setIP(ip);
    setESP32IPState(ip);
  };

  const refreshData = async (showDataNotifications = false) => {
    console.log('[SensorDataContext] refreshData called');
    try {
      // Try to get data from ESP32 (only show notifications if explicitly requested)
      const esp32Data = await esp32Service.getSensorData(showDataNotifications ? showNotification : undefined);
      
      if (esp32Data && esp32Data.moisture !== undefined) {
        console.log('[SensorDataContext] Got ESP32 data:', esp32Data);
        const newSoilHealth: SoilHealthData = {
          moisture: esp32Data.moisture || 0,
          nitrogen: esp32Data.nitrogen || 0,
          phosphorus: esp32Data.phosphorus || 0,
          potassium: esp32Data.potassium || 0,
          conductivity: esp32Data.conductivity || 0,
          ph: esp32Data.ph || 7.0,
          temperature: esp32Data.temperature || 20,
        };
        
        setSoilHealth(newSoilHealth);
        setIsConnected(true);
        setIsOfflineMode(false);
        setLastUpdate(new Date());
        
        // Save to offline storage
        try {
          await offlineStorage.saveSensorData(newSoilHealth);
        } catch (storageError) {
          console.warn('[SensorDataContext] Failed to save to offline storage:', storageError);
        }
      } else {
        console.log('[SensorDataContext] No ESP32 data, falling back to offline mode');
        // Fall back to offline mode
        try {
          const offlineData = await offlineStorage.getLatestSensorData();
          if (offlineData) {
            console.log('[SensorDataContext] Using offline data:', offlineData);
            setSoilHealth(offlineData);
            setIsOfflineMode(true);
          } else {
            console.log('[SensorDataContext] No offline data, using simulated data');
            // Use simulated data as last resort
            setSoilHealth(prev => ({
              moisture: Math.max(0, Math.min(100, prev.moisture + (Math.random() * 6 - 3))),
              nitrogen: Math.max(0, Math.min(100, prev.nitrogen + (Math.random() * 4 - 2))),
              phosphorus: Math.max(0, Math.min(100, prev.phosphorus + (Math.random() * 4 - 2))),
              potassium: Math.max(0, Math.min(100, prev.potassium + (Math.random() * 4 - 2))),
              conductivity: Math.max(0, Math.min(100, prev.conductivity + (Math.random() * 6 - 3))),
              ph: Math.max(3, Math.min(10, prev.ph + (Math.random() * 0.4 - 0.2))),
              temperature: Math.max(10, Math.min(35, prev.temperature + (Math.random() * 1 - 0.5))),
            }));
            setIsOfflineMode(true);
          }
        } catch (offlineError) {
          console.error('[SensorDataContext] Offline mode failed:', offlineError);
          // Use default data as absolute fallback
          setSoilHealth(defaultSoilHealth);
          setIsOfflineMode(true);
        }
        setIsConnected(false);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('[SensorDataContext] Error refreshing data:', error);
      setIsConnected(false);
      setIsOfflineMode(true);
      // Don't crash the app, use default data
      setSoilHealth(defaultSoilHealth);
      setLastUpdate(new Date());
    }
  };
  
  const connectToSensor = async (showConnectionNotifications = false) => {
    if (showConnectionNotifications) {
      showNotification('Trying to connect to ESP32 sensor...', 'info');
    }
    setIsConnected(false);
    // Only pass showNotification to esp32Service if we want to show notifications
    const connected = await esp32Service.connect(showConnectionNotifications ? showNotification : undefined);
    console.log('[SensorDataContext] ESP32 connection result:', connected);
    if (connected) {
      if (showConnectionNotifications) {
        showNotification('Connected to ESP32! Getting sensor data...', 'success');
      }
      await refreshData(false); // Don't show data notifications during connection
    } else {
      console.log('[SensorDataContext] Connection failed, setting offline mode');
      if (showConnectionNotifications) {
        showNotification('Could not connect to ESP32. Using offline mode.', 'warning');
      }
      setIsOfflineMode(true);
    }
  };

  // ESP8266-FRIENDLY: Burst mode control functions with stable intervals
  const enableBurstMode = () => {
    console.log('[SensorDataContext] ENABLING BURST MODE - ESP8266 friendly');
    setIsBurstMode(true);
    setDataUpdateRate(0.5); // 0.5 updates per second (every 2 seconds) in burst mode
    esp32Service.enableBurstMode();
    
    if (isConnected) {
      showNotification('🚀 Burst Mode Enabled - Faster data collection active!', 'success');
    }
  };

  const disableBurstMode = () => {
    console.log('[SensorDataContext] DISABLING BURST MODE - Returning to normal speed');
    setIsBurstMode(false);
    setDataUpdateRate(0.33); // 0.33 updates per second (every 3 seconds) in normal mode
    esp32Service.disableBurstMode();
    
    showNotification('Burst Mode Disabled - Normal data collection resumed', 'info');
  };

  // SINGLE STABLE REFRESH: One interval that doesn't overwhelm ESP8266
  useEffect(() => {
    // Always maintain a refresh interval, but at different rates based on connection status
    const refreshInterval = isConnected 
      ? (isBurstMode ? 2000 : 3000) // 2s burst, 3s normal when connected
      : 5000; // 5s when disconnected to attempt reconnection
    
    console.log(`[SensorDataContext] Starting refresh every ${refreshInterval}ms (connected: ${isConnected})`);
    
    const stableIntervalId = setInterval(() => {
      // If connected, just refresh data
      // If disconnected, try to reconnect periodically
      if (isConnected) {
        refreshData(false); // Silent updates when connected
      } else {
        // Try to reconnect silently
        connectToSensor(false);
      }
    }, refreshInterval);
    
    return () => {
      console.log('[SensorDataContext] Stopping refresh interval');
      clearInterval(stableIntervalId);
    };
  }, [isConnected, isBurstMode]);
  
  // Initialize database and app only once
  useEffect(() => {
    if (!appHasInitialized) {
      console.log('[SensorDataContext] First time initialization - initializing database and connecting');
      appHasInitialized = true;
      
      const initializeApp = async () => {
        try {
          // Initialize database first
          await databaseService.initialize();
          console.log('[SensorDataContext] Database initialized successfully');
          
          showNotification('Karibu Mbolea Sahihi! Connecting to ESP32 sensor...', 'info');
          
          // FIXED: Skip internet test and connect directly to ESP32 for offline operation
          console.log('[SensorDataContext] Skipping internet test - connecting directly to ESP32');
          setTimeout(() => {
            connectToSensor(false);
          }, 1000); // Small delay to ensure UI is ready
        } catch (error) {
          console.error('[SensorDataContext] Database initialization failed:', error);
          showNotification('Database initialization failed, using fallback storage', 'warning');
          
          // Still try to connect to ESP32 even if database fails
          setTimeout(() => {
            connectToSensor(false);
          }, 1000);
        }
      };
      
      initializeApp();
    } else {
      console.log('[SensorDataContext] App already initialized - skipping notification and connection');
    }
  }, [showNotification]);

  // Update recommended crops using the JS model whenever soilHealth changes
  useEffect(() => {
    // Prepare features in the order expected by the model: [N, P, K, temperature, humidity, ph, rainfall]
    // Predict crop using our crop prediction service
    try {
      const conditions = convertSoilAnalysisToConditions({
        nitrogen: soilHealth.nitrogen,
        phosphorus: soilHealth.phosphorus,
        potassium: soilHealth.potassium,
        ph: soilHealth.ph,
        temperature: soilHealth.temperature,
        humidity: soilHealth.moisture, // Using moisture as humidity proxy
        rainfall: 100 // Default rainfall
      });
      
      const recommendations = getTopCropRecommendations(conditions, 3);
      
      if (recommendations.length > 0) {
        const updatedRecommendations = recommendations.map((rec, index) => ({
          name: rec.crop.charAt(0).toUpperCase() + rec.crop.slice(1),
          confidence: Math.max(50, Math.min(95, rec.confidence)), // Ensure realistic range
          timeToMaturity: 75 + (index * 15), // Vary maturity times
          waterRequirements: (index === 0 ? 'moderate' : index === 1 ? 'low' : 'high') as 'low' | 'moderate' | 'high',
          soilEnrichment: rec.reasons.slice(0, 2),
        }));
        
        setRecommendedCrops(updatedRecommendations);
      } else {
        setRecommendedCrops([
          {
            name: 'General Crops',
            confidence: 50,
            timeToMaturity: 90,
            waterRequirements: 'moderate',
            soilEnrichment: ['Analyze soil conditions for better recommendations.'],
          },
        ]);
      }
    } catch (error) {
      console.error('[SensorDataContext] Crop prediction failed:', error);
      setRecommendedCrops([
        {
          name: 'General Crops',
          confidence: 50,
          timeToMaturity: 90,
          waterRequirements: 'moderate',
          soilEnrichment: ['Unable to generate recommendations at this time.'],
        },
      ]);
    }
  }, [soilHealth]);

  // Request location permission at runtime with better error handling
  useEffect(() => {
    const requestLocationPermission = async () => {
      try {
        // Check if we're on a native platform first
        if (!Capacitor.isNativePlatform()) {
          console.log('[SensorDataContext] Not on native platform, skipping location permission request');
          return;
        }
        
        // Check current permission status first
        const status = await Geolocation.checkPermissions();
        console.log('[SensorDataContext] Current location permission status:', status);
        
        if (status.location === 'granted') {
          console.log('[SensorDataContext] Location permission already granted');
          return;
        }
        
        // Request permission if not already granted
        const result = await Geolocation.requestPermissions();
        console.log('[SensorDataContext] Location permission request result:', result);
        
        // Handle permission result
        if (result.location !== 'granted') {
          console.log('[SensorDataContext] Location permission not granted, but continuing without location');
          // We can still function without location, so don't show an error
        }
      } catch (err) {
        // Handle error gracefully - don't show error notification
        // console.error('[SensorDataContext] Location permission error:', err);
        console.log('[SensorDataContext] Continuing without location services');
        // Don't show error notification as location is not critical for core functionality
      }
    };
    
    // Execute the permission request
    requestLocationPermission();
  }, []);
  
  return (
    <SensorDataContext.Provider 
      value={{
        soilHealth,
        recommendedCrops,
        isConnected,
        lastUpdate,
        refreshData,
        connectToSensor,
        isOfflineMode,
        esp32IP,
        setESP32IP,
        // ULTRA-RAPID: Burst mode capabilities
        enableBurstMode,
        disableBurstMode,
        isBurstMode,
        dataUpdateRate,
      }}
    >
      {children}
    </SensorDataContext.Provider>
  );
};
