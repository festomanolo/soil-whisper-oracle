import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';

export interface SensorReading {
  id?: number;
  ph: number;
  moisture: number;
  temperature: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  location?: string;
  timestamp: number;
  created_at?: string;
}

export interface Field {
  id?: number;
  name: string;
  location: string;
  crop_type?: string;
  area_size?: number;
  created_at?: string;
  updated_at?: string;
}

class DatabaseService {
  private sqlite: SQLiteConnection;
  private db: SQLiteDBConnection | null = null;
  private readonly DB_NAME = 'soil_whisper_oracle.db';
  private readonly DB_VERSION = 1;

  constructor() {
    this.sqlite = new SQLiteConnection(CapacitorSQLite);
  }

  async initialize(): Promise<void> {
    try {
      // Always try to initialize SQLite, even on web for testing
      console.log('Initializing SQLite database...');
      console.log('Platform info:', {
        isNative: Capacitor.isNativePlatform(),
        platform: Capacitor.getPlatform()
      });

      // Create connection
      this.db = await this.sqlite.createConnection(
        this.DB_NAME,
        false,
        'no-encryption',
        this.DB_VERSION,
        false
      );

      // Open database
      await this.db.open();
      console.log('Database connection opened successfully');

      // Create tables
      await this.createTables();
      console.log('Database tables created successfully');

      // Test the connection with a simple query
      const testResult = await this.db.query('SELECT 1 as test');
      console.log('Database test query result:', testResult);

      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      console.log('Creating database tables...');
      
      // Create tables one by one to isolate any issues
      const tables = [
        // Fields table
        `CREATE TABLE IF NOT EXISTS fields (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          location TEXT NOT NULL,
          crop_type TEXT,
          area_size REAL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        
        // Sensor readings table
        `CREATE TABLE IF NOT EXISTS sensor_readings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          field_id INTEGER,
          ph REAL NOT NULL,
          moisture REAL NOT NULL,
          temperature REAL NOT NULL,
          nitrogen REAL NOT NULL,
          phosphorus REAL NOT NULL,
          potassium REAL NOT NULL,
          location TEXT,
          timestamp INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (field_id) REFERENCES fields (id) ON DELETE SET NULL
        )`,
        
        // Soil analyses table
        `CREATE TABLE IF NOT EXISTS soil_analyses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          timestamp INTEGER NOT NULL,
          collection_duration INTEGER NOT NULL,
          readings_count INTEGER NOT NULL,
          avg_moisture REAL NOT NULL,
          avg_nitrogen REAL NOT NULL,
          avg_phosphorus REAL NOT NULL,
          avg_potassium REAL NOT NULL,
          avg_conductivity REAL NOT NULL,
          avg_ph REAL NOT NULL,
          avg_temperature REAL NOT NULL,
          raw_readings_json TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`
      ];
      
      // Create indexes
      const indexes = [
        `CREATE INDEX IF NOT EXISTS idx_sensor_readings_timestamp ON sensor_readings(timestamp)`,
        `CREATE INDEX IF NOT EXISTS idx_sensor_readings_field_id ON sensor_readings(field_id)`,
        `CREATE INDEX IF NOT EXISTS idx_fields_name ON fields(name)`,
        `CREATE INDEX IF NOT EXISTS idx_soil_analyses_timestamp ON soil_analyses(timestamp)`,
        `CREATE INDEX IF NOT EXISTS idx_soil_analyses_name ON soil_analyses(name)`
      ];
      
      // Execute each table creation statement separately
      for (const sql of tables) {
        try {
          console.log('Executing SQL:', sql.substring(0, 40) + '...');
          await this.db.execute(sql);
          console.log('SQL executed successfully');
        } catch (error) {
          console.error('Error creating table:', error);
          throw error;
        }
      }
      
      // Execute each index creation statement separately
      for (const sql of indexes) {
        try {
          console.log('Creating index:', sql.substring(0, 40) + '...');
          await this.db.execute(sql);
        } catch (error) {
          console.error('Error creating index (non-fatal):', error);
          // Don't throw for index errors, they're not critical
        }
      }
      
      console.log('All tables and indexes created successfully');
    } catch (error) {
      console.error('Error in createTables:', error);
      throw error;
    }
  }

  // Sensor Readings Methods
  async saveSensorReading(reading: Omit<SensorReading, 'id' | 'created_at'>): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');

    const sql = `
      INSERT INTO sensor_readings (ph, moisture, temperature, nitrogen, phosphorus, potassium, location, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await this.db.run(sql, [
      reading.ph,
      reading.moisture,
      reading.temperature,
      reading.nitrogen,
      reading.phosphorus,
      reading.potassium,
      reading.location || '',
      reading.timestamp
    ]);

    return result.changes?.lastId || 0;
  }

  async getLatestSensorReading(): Promise<SensorReading | null> {
    if (!this.db) throw new Error('Database not initialized');

    const sql = `
      SELECT * FROM sensor_readings 
      ORDER BY timestamp DESC 
      LIMIT 1
    `;

    const result = await this.db.query(sql);
    return result.values && result.values.length > 0 ? result.values[0] as SensorReading : null;
  }

  async getSensorReadings(limit: number = 100): Promise<SensorReading[]> {
    if (!this.db) throw new Error('Database not initialized');

    const sql = `
      SELECT * FROM sensor_readings 
      ORDER BY timestamp DESC 
      LIMIT ?
    `;

    const result = await this.db.query(sql, [limit]);
    return (result.values || []) as SensorReading[];
  }

  async getSensorReadingsByTimeRange(startTime: number, endTime: number): Promise<SensorReading[]> {
    if (!this.db) throw new Error('Database not initialized');

    const sql = `
      SELECT * FROM sensor_readings 
      WHERE timestamp BETWEEN ? AND ?
      ORDER BY timestamp DESC
    `;

    const result = await this.db.query(sql, [startTime, endTime]);
    return (result.values || []) as SensorReading[];
  }

  async getDataHistory(hours: number = 24): Promise<SensorReading[]> {
    const now = Date.now();
    const cutoff = now - (hours * 60 * 60 * 1000);
    return this.getSensorReadingsByTimeRange(cutoff, now);
  }

  // Fields Methods
  async saveField(field: Omit<Field, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');

    const sql = `
      INSERT INTO fields (name, location, crop_type, area_size)
      VALUES (?, ?, ?, ?)
    `;

    const result = await this.db.run(sql, [
      field.name,
      field.location,
      field.crop_type || null,
      field.area_size || null
    ]);

    return result.changes?.lastId || 0;
  }

  async getFields(): Promise<Field[]> {
    if (!this.db) throw new Error('Database not initialized');

    const sql = `SELECT * FROM fields ORDER BY created_at DESC`;
    const result = await this.db.query(sql);
    return (result.values || []) as Field[];
  }

  async updateField(id: number, field: Partial<Omit<Field, 'id' | 'created_at'>>): Promise<boolean> {
    if (!this.db) throw new Error('Database not initialized');

    const updates: string[] = [];
    const values: any[] = [];

    if (field.name !== undefined) {
      updates.push('name = ?');
      values.push(field.name);
    }
    if (field.location !== undefined) {
      updates.push('location = ?');
      values.push(field.location);
    }
    if (field.crop_type !== undefined) {
      updates.push('crop_type = ?');
      values.push(field.crop_type);
    }
    if (field.area_size !== undefined) {
      updates.push('area_size = ?');
      values.push(field.area_size);
    }

    if (updates.length === 0) return false;

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const sql = `UPDATE fields SET ${updates.join(', ')} WHERE id = ?`;
    const result = await this.db.run(sql, values);

    return (result.changes?.changes || 0) > 0;
  }

  async deleteField(id: number): Promise<boolean> {
    if (!this.db) throw new Error('Database not initialized');

    const sql = `DELETE FROM fields WHERE id = ?`;
    const result = await this.db.run(sql, [id]);

    return (result.changes?.changes || 0) > 0;
  }

  // Utility Methods
  async clearAllData(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.execute(`
      DELETE FROM sensor_readings;
      DELETE FROM fields;
    `);
  }

  async getStatistics(): Promise<{
    totalReadings: number;
    totalFields: number;
    latestReading?: SensorReading;
  }> {
    if (!this.db) throw new Error('Database not initialized');

    const readingsCount = await this.db.query('SELECT COUNT(*) as count FROM sensor_readings');
    const fieldsCount = await this.db.query('SELECT COUNT(*) as count FROM fields');
    const latestReading = await this.getLatestSensorReading();

    return {
      totalReadings: readingsCount.values?.[0]?.count || 0,
      totalFields: fieldsCount.values?.[0]?.count || 0,
      latestReading: latestReading || undefined
    };
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
    }
  }

  // Public SQL execution methods for other services
  async executeSQL(sql: string, params?: any[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.execute(sql, params);
  }

  async executeSQLWithResult(sql: string, params?: any[]): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');
    const result = await this.db.run(sql, params);
    return result.changes?.lastId || 0;
  }

  async executeSQLWithSuccess(sql: string, params?: any[]): Promise<boolean> {
    if (!this.db) throw new Error('Database not initialized');
    const result = await this.db.run(sql, params);
    return (result.changes?.changes || 0) > 0;
  }

  async querySQL(sql: string, params?: any[]): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');
    const result = await this.db.query(sql, params);
    return result.values || [];
  }
}

export const databaseService = new DatabaseService();