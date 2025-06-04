import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { esp32Service } from '../services/esp32Service';
import { offlineStorage } from '../services/offlineStorage';

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
  refreshData: () => void;
  connectToSensor: () => void;
  isOfflineMode: boolean;
  esp32IP: string;
  setESP32IP: (ip: string) => void;
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
    confidence: 91,
    timeToMaturity: 75,
    waterRequirements: 'moderate',
    soilEnrichment: ['Add 10% more nitrogen', 'Increase phosphorus by 5%'],
  },
  {
    name: 'Bell Peppers',
    confidence: 84,
    timeToMaturity: 90,
    waterRequirements: 'moderate',
    soilEnrichment: ['Add 5% more potassium'],
  },
  {
    name: 'Carrots',
    confidence: 72,
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

export const SensorDataProvider = ({ children }: SensorDataProviderProps) => {
  const [soilHealth, setSoilHealth] = useState<SoilHealthData>(defaultSoilHealth);
  const [recommendedCrops, setRecommendedCrops] = useState<CropRecommendation[]>(defaultCropRecommendations);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [esp32IP, setESP32IPState] = useState(esp32Service.getIP());
  
  const setESP32IP = (ip: string) => {
    esp32Service.setIP(ip);
    setESP32IPState(ip);
  };

  const refreshData = async () => {
    try {
      // Try to get data from ESP32
      const esp32Data = await esp32Service.getSensorData();
      
      if (esp32Data) {
        const newSoilHealth: SoilHealthData = {
          moisture: esp32Data.moisture,
          nitrogen: esp32Data.nitrogen,
          phosphorus: esp32Data.phosphorus,
          potassium: esp32Data.potassium,
          conductivity: esp32Data.conductivity,
          ph: esp32Data.ph,
          temperature: esp32Data.temperature,
        };
        
        setSoilHealth(newSoilHealth);
        setIsConnected(true);
        setIsOfflineMode(false);
        setLastUpdate(new Date());
        
        // Save to offline storage
        offlineStorage.saveSensorData(newSoilHealth);
      } else {
        // Fall back to offline mode
        const offlineData = offlineStorage.getLatestSensorData();
        if (offlineData) {
          setSoilHealth(offlineData);
          setIsOfflineMode(true);
        } else {
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
        setIsConnected(false);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
      setIsConnected(false);
      setIsOfflineMode(true);
    }
  };
  
  const connectToSensor = async () => {
    setIsConnected(false);
    const connected = await esp32Service.connect();
    if (connected) {
      await refreshData();
    } else {
      setIsOfflineMode(true);
    }
  };
  
  // Auto-refresh data every 10 seconds when connected
  useEffect(() => {
    if (!isConnected) return;
    
    const intervalId = setInterval(refreshData, 10000);
    return () => clearInterval(intervalId);
  }, [isConnected]);
  
  // Try to connect on mount
  useEffect(() => {
    connectToSensor();
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
      }}
    >
      {children}
    </SensorDataContext.Provider>
  );
};
