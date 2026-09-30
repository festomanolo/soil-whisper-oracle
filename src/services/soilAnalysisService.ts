import { databaseService } from './database';
import { Capacitor } from '@capacitor/core';

export interface SoilAnalysisData {
  id?: number;
  name: string;
  timestamp: number;
  collectionDuration: number;
  readingsCount: number;
  averageData: {
    moisture: number;
    nitrogen: number;
    phosphorus: number;
    potassium: number;
    conductivity: number;
    ph: number;
    temperature: number;
  };
  rawReadings: Array<{
    timestamp: number;
    data: {
      moisture: number;
      nitrogen: number;
      phosphorus: number;
      potassium: number;
      conductivity: number;
      ph: number;
      temperature: number;
    };
  }>;
  cropRecommendations?: Array<{
    crop: string;
    confidence: number;
    suitability: 'Excellent' | 'Good' | 'Fair' | 'Poor';
    reasons: string[];
  }>;
  created_at?: string;
}

class SoilAnalysisService {
  private readonly STORAGE_KEY = 'soilAnalyses';
  private isNativePlatform: boolean;
  private isInitialized: boolean = false;

  constructor() {
    // Always use localStorage for now until we fix SQLite
    this.isNativePlatform = false;
    console.log('[SoilAnalysisService] Constructor - FORCING localStorage mode for reliability');
    console.log('[SoilAnalysisService] Platform:', Capacitor.getPlatform());
    
    // Initialize the service
    this.initialize();
  }
  
  private async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      console.log('[SoilAnalysisService] Initializing...');
      
      // Ensure database is initialized
      await databaseService.initialize();
      
      // Mark as initialized
      this.isInitialized = true;
      console.log('[SoilAnalysisService] Initialized successfully');
    } catch (error) {
      console.error('[SoilAnalysisService] Initialization failed:', error);
      // Continue with localStorage fallback
    }
  }

  async saveAnalysis(analysisData: Omit<SoilAnalysisData, 'id' | 'created_at'>): Promise<number> {
    console.log('[SoilAnalysisService] Attempting to save analysis:', analysisData.name);
    console.log('[SoilAnalysisService] Analysis data:', {
      name: analysisData.name,
      timestamp: analysisData.timestamp,
      readingsCount: analysisData.readingsCount,
      averageData: analysisData.averageData
    });
    
    // ALWAYS use localStorage for now for reliability
    console.log('[SoilAnalysisService] Using localStorage for reliable storage...');
    const analysisId = this.saveToLocalStorage(analysisData);
    console.log('[SoilAnalysisService] localStorage save successful, ID:', analysisId);
    
    // Try to save to SQLite as well, but don't rely on it
    try {
      if (this.isNativePlatform) {
        console.log('[SoilAnalysisService] Also trying SQLite save (backup)...');
        await this.saveToSQLite(analysisData);
        console.log('[SoilAnalysisService] SQLite backup save completed');
      }
    } catch (error) {
      console.error('[SoilAnalysisService] SQLite backup save failed (non-critical):', error);
    }
    
    // Always dispatch multiple events for UI updates
    this.dispatchAnalysisUpdateEvent();
    console.log('[SoilAnalysisService] Analysis update events dispatched');
    
    // Also directly update localStorage to ensure it's saved
    this.updateLocalStorageDirectly();
    
    return analysisId;
  }
  
  // Helper method to ensure localStorage is updated
  private updateLocalStorageDirectly(): void {
    try {
      const analyses = this.getFromLocalStorage();
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(analyses));
      console.log('[SoilAnalysisService] Direct localStorage update completed');
    } catch (error) {
      console.error('[SoilAnalysisService] Direct localStorage update failed:', error);
    }
  }

  async getAllAnalyses(): Promise<SoilAnalysisData[]> {
    console.log('[SoilAnalysisService] Getting all analyses...');
    
    // ALWAYS use localStorage for reliability
    console.log('[SoilAnalysisService] Using localStorage for reliable retrieval...');
    const result = this.getFromLocalStorage();
    console.log('[SoilAnalysisService] localStorage get result:', result.length, 'analyses');
    
    // Log the actual data for debugging
    if (result.length > 0) {
      console.log('[SoilAnalysisService] First analysis:', {
        id: result[0].id,
        name: result[0].name,
        timestamp: result[0].timestamp,
        readingsCount: result[0].readingsCount
      });
    } else {
      console.log('[SoilAnalysisService] No analyses found in localStorage');
      
      // Check if localStorage has the raw string
      const rawStorage = localStorage.getItem(this.STORAGE_KEY);
      console.log('[SoilAnalysisService] Raw localStorage content:', 
        rawStorage ? `${rawStorage.substring(0, 50)}... (${rawStorage.length} chars)` : 'null');
    }
    
    return result;
  }

  async deleteAnalysis(id: number | string): Promise<boolean> {
    try {
      if (this.isNativePlatform && typeof id === 'number') {
        const success = await this.deleteFromSQLite(id);
        if (success) {
          this.dispatchAnalysisUpdateEvent();
        }
        return success;
      } else {
        return this.deleteFromLocalStorage(String(id));
      }
    } catch (error) {
      console.error('Failed to delete analysis from SQLite, falling back to localStorage:', error);
      return this.deleteFromLocalStorage(String(id));
    }
  }

  async clearAllAnalyses(): Promise<void> {
    try {
      if (this.isNativePlatform) {
        await this.clearSQLiteAnalyses();
      } else {
        localStorage.removeItem(this.STORAGE_KEY);
      }
      this.dispatchAnalysisUpdateEvent();
    } catch (error) {
      console.error('Failed to clear analyses from SQLite:', error);
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }

  // SQLite methods
  private async saveToSQLite(analysisData: Omit<SoilAnalysisData, 'id' | 'created_at'>): Promise<number> {
    console.log('[SoilAnalysisService] saveToSQLite called with:', {
      name: analysisData.name,
      timestamp: analysisData.timestamp,
      readingsCount: analysisData.readingsCount
    });
    
    try {
      const sql = `
        INSERT INTO soil_analyses (
          name, timestamp, collection_duration, readings_count,
          avg_moisture, avg_nitrogen, avg_phosphorus, avg_potassium,
          avg_conductivity, avg_ph, avg_temperature, raw_readings_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const params = [
        analysisData.name,
        analysisData.timestamp,
        analysisData.collectionDuration,
        analysisData.readingsCount,
        analysisData.averageData.moisture,
        analysisData.averageData.nitrogen,
        analysisData.averageData.phosphorus,
        analysisData.averageData.potassium,
        analysisData.averageData.conductivity,
        analysisData.averageData.ph,
        analysisData.averageData.temperature,
        JSON.stringify(analysisData.rawReadings)
      ];

      console.log('[SoilAnalysisService] Executing SQL with params:', params);
      const result = await databaseService.executeSQLWithResult(sql, params);
      console.log('[SoilAnalysisService] SQLite insert result:', result);
      
      return result;
    } catch (error) {
      console.error('[SoilAnalysisService] SQLite save error:', error);
      throw error;
    }
  }

  private async getFromSQLite(): Promise<SoilAnalysisData[]> {
    console.log('[SoilAnalysisService] getFromSQLite called');
    
    try {
      const sql = `
        SELECT * FROM soil_analyses 
        ORDER BY timestamp DESC
      `;

      console.log('[SoilAnalysisService] Executing query:', sql);
      const result = await databaseService.querySQL(sql);
      console.log('[SoilAnalysisService] Raw SQLite result:', result);
      
      const mappedResult = (result || []).map((row: any) => {
        try {
          const analysis: SoilAnalysisData = {
            id: row.id,
            name: row.name,
            timestamp: row.timestamp,
            collectionDuration: row.collection_duration,
            readingsCount: row.readings_count,
            averageData: {
              moisture: row.avg_moisture,
              nitrogen: row.avg_nitrogen,
              phosphorus: row.avg_phosphorus,
              potassium: row.avg_potassium,
              conductivity: row.avg_conductivity,
              ph: row.avg_ph,
              temperature: row.avg_temperature
            },
            rawReadings: JSON.parse(row.raw_readings_json || '[]'),
            created_at: row.created_at
          };
          
          console.log('[SoilAnalysisService] Mapped analysis:', analysis.name, 'ID:', analysis.id);
          return analysis;
        } catch (parseError) {
          console.error('[SoilAnalysisService] Error parsing row:', row, parseError);
          return null;
        }
      }).filter(Boolean) as SoilAnalysisData[];
      
      console.log('[SoilAnalysisService] Final mapped result:', mappedResult.length, 'analyses');
      return mappedResult;
    } catch (error) {
      console.error('[SoilAnalysisService] SQLite get error:', error);
      throw error;
    }
  }

  private async deleteFromSQLite(id: number): Promise<boolean> {
    const sql = `DELETE FROM soil_analyses WHERE id = ?`;
    return await databaseService.executeSQLWithSuccess(sql, [id]);
  }

  private async clearSQLiteAnalyses(): Promise<void> {
    const sql = `DELETE FROM soil_analyses`;
    await databaseService.executeSQL(sql);
  }

  // localStorage fallback methods
  private saveToLocalStorage(analysisData: Omit<SoilAnalysisData, 'id' | 'created_at'>): number {
    try {
      console.log('[SoilAnalysisService] Saving to localStorage...');
      
      // Get existing analyses with error handling
      const existingAnalyses = this.getFromLocalStorage();
      console.log('[SoilAnalysisService] Retrieved', existingAnalyses.length, 'existing analyses');
      
      // Create new analysis with unique ID
      const newId = Date.now();
      const newAnalysis = {
        ...analysisData,
        id: newId
      };
      
      console.log('[SoilAnalysisService] Created new analysis with ID:', newId);
      
      // Add to beginning of array
      const updatedAnalyses = [newAnalysis, ...existingAnalyses];
      
      // Save to localStorage with error handling
      try {
        const jsonString = JSON.stringify(updatedAnalyses);
        console.log('[SoilAnalysisService] Saving JSON string of length:', jsonString.length);
        
        localStorage.setItem(this.STORAGE_KEY, jsonString);
        console.log('[SoilAnalysisService] Successfully saved to localStorage');
        
        // Verify the save
        const verifyString = localStorage.getItem(this.STORAGE_KEY);
        if (verifyString) {
          console.log('[SoilAnalysisService] Verified localStorage save, length:', verifyString.length);
        } else {
          console.error('[SoilAnalysisService] Failed to verify localStorage save - item not found');
        }
      } catch (saveError) {
        console.error('[SoilAnalysisService] Error saving to localStorage:', saveError);
        
        // Try with just the new analysis if the full array is too large
        try {
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify([newAnalysis]));
          console.log('[SoilAnalysisService] Saved only the new analysis due to size constraints');
        } catch (fallbackError) {
          console.error('[SoilAnalysisService] Even fallback save failed:', fallbackError);
        }
      }
      
      return newId;
    } catch (error) {
      console.error('[SoilAnalysisService] Unexpected error in saveToLocalStorage:', error);
      return Date.now(); // Return a unique ID anyway
    }
  }

  private getFromLocalStorage(): SoilAnalysisData[] {
    try {
      console.log('[SoilAnalysisService] Reading from localStorage key:', this.STORAGE_KEY);
      const stored = localStorage.getItem(this.STORAGE_KEY);
      
      if (!stored) {
        console.log('[SoilAnalysisService] No data found in localStorage');
        return [];
      }
      
      console.log('[SoilAnalysisService] Found data in localStorage, length:', stored.length);
      
      try {
        const parsed = JSON.parse(stored);
        
        if (!Array.isArray(parsed)) {
          console.error('[SoilAnalysisService] Stored data is not an array:', typeof parsed);
          return [];
        }
        
        console.log('[SoilAnalysisService] Successfully parsed', parsed.length, 'analyses from localStorage');
        return parsed;
      } catch (parseError) {
        console.error('[SoilAnalysisService] Failed to parse stored analyses:', parseError);
        
        // Try to recover corrupted data
        localStorage.setItem(this.STORAGE_KEY, '[]');
        return [];
      }
    } catch (error) {
      console.error('[SoilAnalysisService] Error accessing localStorage:', error);
      return [];
    }
  }

  private deleteFromLocalStorage(id: string): boolean {
    const analyses = this.getFromLocalStorage();
    const filteredAnalyses = analyses.filter(analysis => String(analysis.id) !== id);
    
    if (filteredAnalyses.length !== analyses.length) {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredAnalyses));
      this.dispatchAnalysisUpdateEvent();
      return true;
    }
    return false;
  }

  // Utility method to dispatch update events
  private dispatchAnalysisUpdateEvent(): void {
    console.log('[SoilAnalysisService] Dispatching analysis update event');
    
    // Dispatch multiple events to ensure UI updates
    const events = [
      'soilAnalysisUpdated',
      'soilAnalysisChanged',
      'analysisDataChanged'
    ];
    
    events.forEach(eventName => {
      const customEvent = new CustomEvent(eventName, {
        detail: { 
          timestamp: Date.now(),
          source: 'soilAnalysisService'
        }
      });
      window.dispatchEvent(customEvent);
      console.log('[SoilAnalysisService] Dispatched event:', eventName);
    });
    
    // Also trigger a storage event for localStorage listeners
    window.dispatchEvent(new StorageEvent('storage', {
      key: this.STORAGE_KEY,
      newValue: 'updated',
      storageArea: localStorage
    }));
  }

  // Force refresh method for debugging
  async forceRefresh(): Promise<SoilAnalysisData[]> {
    console.log('[SoilAnalysisService] Force refresh called');
    const analyses = await this.getAllAnalyses();
    this.dispatchAnalysisUpdateEvent();
    return analyses;
  }
}

export const soilAnalysisService = new SoilAnalysisService();