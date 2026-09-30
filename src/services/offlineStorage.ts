import { SoilHealthData } from '../context/SensorDataContext';
import { databaseService, SensorReading } from './database';
import { Capacitor } from '@capacitor/core';

interface StoredSensorData {
  data: SoilHealthData;
  timestamp: number;
}

class OfflineStorageService {
  private readonly STORAGE_KEY = 'agri_oracle_sensor_data';
  private readonly MAX_STORED_READINGS = 100;
  private isNativePlatform: boolean;

  constructor() {
    this.isNativePlatform = Capacitor.isNativePlatform();
  }

  public async saveSensorData(data: SoilHealthData): Promise<void> {
    try {
      if (this.isNativePlatform) {
        // Use SQLite on native platforms
        const reading: Omit<SensorReading, 'id' | 'created_at'> = {
          ph: data.ph,
          moisture: data.moisture,
          temperature: data.temperature,
          nitrogen: data.nitrogen,
          phosphorus: data.phosphorus,
          potassium: data.potassium,
          location: data.location || '',
          timestamp: Date.now()
        };
        await databaseService.saveSensorReading(reading);
      } else {
        // Fallback to localStorage on web
        this.saveToLocalStorage(data);
      }
    } catch (error) {
      console.error('Failed to save sensor data:', error);
      // Fallback to localStorage if SQLite fails
      this.saveToLocalStorage(data);
    }
  }

  public async getLatestSensorData(): Promise<SoilHealthData | null> {
    try {
      if (this.isNativePlatform) {
        const reading = await databaseService.getLatestSensorReading();
        return reading ? this.convertSensorReadingToSoilHealthData(reading) : null;
      } else {
        return this.getLatestFromLocalStorage();
      }
    } catch (error) {
      console.error('Failed to get latest sensor data:', error);
      return this.getLatestFromLocalStorage();
    }
  }

  public async getAllStoredData(): Promise<StoredSensorData[]> {
    try {
      if (this.isNativePlatform) {
        const readings = await databaseService.getSensorReadings(this.MAX_STORED_READINGS);
        return readings.map(reading => ({
          data: this.convertSensorReadingToSoilHealthData(reading),
          timestamp: reading.timestamp
        }));
      } else {
        return this.getAllFromLocalStorage();
      }
    } catch (error) {
      console.error('Failed to get stored data:', error);
      return this.getAllFromLocalStorage();
    }
  }

  public async clearStoredData(): Promise<void> {
    try {
      if (this.isNativePlatform) {
        await databaseService.clearAllData();
      } else {
        localStorage.removeItem(this.STORAGE_KEY);
      }
    } catch (error) {
      console.error('Failed to clear stored data:', error);
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }

  public async getDataHistory(hours: number = 24): Promise<StoredSensorData[]> {
    try {
      if (this.isNativePlatform) {
        const readings = await databaseService.getDataHistory(hours);
        return readings.map(reading => ({
          data: this.convertSensorReadingToSoilHealthData(reading),
          timestamp: reading.timestamp
        }));
      } else {
        const now = Date.now();
        const cutoff = now - (hours * 60 * 60 * 1000);
        return this.getAllFromLocalStorage().filter(entry => entry.timestamp > cutoff);
      }
    } catch (error) {
      console.error('Failed to get data history:', error);
      const now = Date.now();
      const cutoff = now - (hours * 60 * 60 * 1000);
      return this.getAllFromLocalStorage().filter(entry => entry.timestamp > cutoff);
    }
  }

  // Helper methods for localStorage fallback
  private saveToLocalStorage(data: SoilHealthData): void {
    const storedData = this.getAllFromLocalStorage();
    const newEntry: StoredSensorData = {
      data,
      timestamp: Date.now()
    };

    storedData.push(newEntry);

    if (storedData.length > this.MAX_STORED_READINGS) {
      storedData.splice(0, storedData.length - this.MAX_STORED_READINGS);
    }

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(storedData));
  }

  private getLatestFromLocalStorage(): SoilHealthData | null {
    const storedData = this.getAllFromLocalStorage();
    if (storedData.length > 0) {
      return storedData[storedData.length - 1].data;
    }
    return null;
  }

  private getAllFromLocalStorage(): StoredSensorData[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to get stored data from localStorage:', error);
      return [];
    }
  }

  private convertSensorReadingToSoilHealthData(reading: SensorReading): SoilHealthData {
    return {
      ph: reading.ph,
      moisture: reading.moisture,
      temperature: reading.temperature,
      nitrogen: reading.nitrogen,
      phosphorus: reading.phosphorus,
      potassium: reading.potassium,
      location: reading.location || undefined
    };
  }
}

export const offlineStorage = new OfflineStorageService();
