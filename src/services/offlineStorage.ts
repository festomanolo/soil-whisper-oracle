import { SoilHealthData } from '../context/SensorDataContext';

interface StoredSensorData {
  data: SoilHealthData;
  timestamp: number;
}

class OfflineStorageService {
  private readonly STORAGE_KEY = 'agri_oracle_sensor_data';
  private readonly MAX_STORED_READINGS = 100;

  public saveSensorData(data: SoilHealthData): void {
    try {
      const storedData = this.getAllStoredData();
      const newEntry: StoredSensorData = {
        data,
        timestamp: Date.now()
      };

      storedData.push(newEntry);

      // Keep only the latest readings
      if (storedData.length > this.MAX_STORED_READINGS) {
        storedData.splice(0, storedData.length - this.MAX_STORED_READINGS);
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(storedData));
    } catch (error) {
      console.error('Failed to save sensor data:', error);
    }
  }

  public getLatestSensorData(): SoilHealthData | null {
    try {
      const storedData = this.getAllStoredData();
      if (storedData.length > 0) {
        return storedData[storedData.length - 1].data;
      }
    } catch (error) {
      console.error('Failed to get latest sensor data:', error);
    }
    return null;
  }

  public getAllStoredData(): StoredSensorData[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to get stored data:', error);
      return [];
    }
  }

  public clearStoredData(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear stored data:', error);
    }
  }

  public getDataHistory(hours: number = 24): StoredSensorData[] {
    const now = Date.now();
    const cutoff = now - (hours * 60 * 60 * 1000);
    
    return this.getAllStoredData().filter(entry => entry.timestamp > cutoff);
  }
}

export const offlineStorage = new OfflineStorageService();
