
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define our sensor data types
export type SoilHealthData = {
  moisture: number; // 0-100%
  nitrogen: number; // 0-100%
  phosphorus: number; // 0-100%
  potassium: number; // 0-100%
  oxygen: number; // 0-100%
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
}

const defaultSoilHealth: SoilHealthData = {
  moisture: 65,
  nitrogen: 42,
  phosphorus: 31,
  potassium: 58,
  oxygen: 76,
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
  
  // Simulate data changes
  const getRandomVariation = (base: number, range: number) => {
    return Math.max(0, Math.min(100, base + (Math.random() * range * 2 - range)));
  };
  
  const refreshData = () => {
    // In a real app, this would fetch from the ESP32
    setTimeout(() => {
      setSoilHealth(prev => ({
        moisture: getRandomVariation(prev.moisture, 3),
        nitrogen: getRandomVariation(prev.nitrogen, 2),
        phosphorus: getRandomVariation(prev.phosphorus, 2),
        potassium: getRandomVariation(prev.potassium, 2),
        oxygen: getRandomVariation(prev.oxygen, 3),
        ph: Math.max(3, Math.min(10, prev.ph + (Math.random() * 0.4 - 0.2))),
        temperature: Math.max(10, Math.min(35, prev.temperature + (Math.random() * 1 - 0.5))),
      }));
      setLastUpdate(new Date());
    }, 500);
  };
  
  const connectToSensor = () => {
    setIsConnected(false);
    // Simulate connection process
    setTimeout(() => {
      setIsConnected(true);
      refreshData();
    }, 1500);
  };
  
  // Auto-refresh data every 10 seconds
  useEffect(() => {
    if (!isConnected) return;
    
    const intervalId = setInterval(refreshData, 10000);
    return () => clearInterval(intervalId);
  }, [isConnected]);
  
  // Simulate initial connection on mount
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
      }}
    >
      {children}
    </SensorDataContext.Provider>
  );
};
