export interface ESP32SensorData {
  moisture: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  conductivity: number;
  ph: number;
  temperature: number;
  timestamp: number;
}

class ESP32Service {
  private esp32IP: string = '192.168.43.149'; // Force the correct IP
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10; // RAPID: Increased reconnect attempts for persistence
  private lastRequestTime: number = 0;
  private requestQueue: Promise<any>[] = []; // Queue for managing rapid requests
  private connectionPool: XMLHttpRequest[] = []; // Connection pool for faster requests
  private burstMode: boolean = false; // Ultra-rapid burst mode
  private parallelRequests: number = 3; // Number of parallel requests for speed

  constructor() {
    // Force the correct IP instead of loading from localStorage
    this.esp32IP = '192.168.43.149';
    console.log('[ESP32Service] Constructor - Using IP:', this.esp32IP);
  }

  private loadSavedIP() {
    const savedIP = localStorage.getItem('esp32_ip');
    if (savedIP) {
      this.esp32IP = savedIP;
    }
  }

  public setIP(ip: string) {
    this.esp32IP = ip;
    localStorage.setItem('esp32_ip', ip);
  }

  // New method to scan for ESP8266 on the network
  public async scanForESP8266(): Promise<string | null> {
    console.log('Scanning for ESP8266 on network...');
    
    // Common IP ranges for phone hotspots
    const ipRanges = [
      '192.168.1', // Common home/hotspot range
      '192.168.43', // Android hotspot range
      '172.20.10',  // iPhone hotspot range
      '10.0.0',     // Alternative range
    ];

    for (const baseIP of ipRanges) {
      for (let i = 1; i <= 254; i++) {
        const testIP = `${baseIP}.${i}`;
        
        try {
          const response = await this.fetchWithTimeout(`http://${testIP}/`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            }
          }, 1000); // Short timeout for scanning

          if (response.ok) {
            const data = await response.json();
            // Check if response contains expected sensor data fields
            if (data.humidity !== undefined || data.temperature !== undefined || 
                data.conductivity !== undefined || data.ph !== undefined) {
              console.log(`Found ESP8266 at ${testIP}`);
              return testIP;
            }
          }
        } catch (error) {
          // Continue scanning
        }
      }
    }
    
    console.log('ESP8266 not found on network');
    return null;
  }

  private async fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open(options.method || 'GET', url, true);
      xhr.timeout = timeoutMs;
      
      // SIMPLE: No headers - ESP8266 doesn't need them and they cause CORS issues
      
      xhr.onload = function () {
        const response = {
          ok: xhr.status >= 200 && xhr.status < 300,
          status: xhr.status,
          json: async () => JSON.parse(xhr.responseText),
        } as Response;
        resolve(response);
      };
      xhr.onerror = function () {
        reject(new Error('Network error'));
      };
      xhr.ontimeout = function () {
        reject(new Error('Request timed out'));
      };
      xhr.send();
    });
  }

  public async connect(showNotification?: (msg: string) => void): Promise<boolean> {
    console.log(`[ESP8266Service] SIMPLE: Connecting to ESP8266 at ${this.esp32IP}`);
    
    try {
      const response = await this.fetchWithTimeout(`http://${this.esp32IP}/`, {
        method: 'GET'
      }, 5000); // 5 second timeout - simple and reliable

      if (response.ok) {
        const data = await response.json();
        console.log(`[ESP8266Service] ✅ Connected! Data:`, data);
        this.isConnected = true;
        this.reconnectAttempts = 0;
        return true;
      }
    } catch (error) {
      console.log(`[ESP8266Service] ❌ Connection failed at ${this.esp32IP}:`, error.message);
      
      // Try to find ESP8266 on network if main IP fails
      console.log(`[ESP8266Service] 🔍 Scanning network for ESP8266...`);
      const foundIP = await this.scanForESP8266();
      if (foundIP) {
        console.log(`[ESP8266Service] ✅ Found ESP8266 at ${foundIP}!`);
        this.esp32IP = foundIP;
        this.setIP(foundIP);
        this.isConnected = true;
        this.reconnectAttempts = 0;
        return true;
      }
      
      this.isConnected = false;
    }
    
    return false;
  }

  public async getSensorData(showNotification?: (msg: string) => void): Promise<ESP32SensorData | null> {
    console.log('[ESP8266Service] SIMPLE: Getting sensor data');
    
    try {
      const response = await this.fetchWithTimeout(`http://${this.esp32IP}/`, {
        method: 'GET'
      }, 5000); // 5 second timeout
      
      if (response.ok) {
        const data = await response.json();
        console.log('[ESP8266Service] ✅ Data received:', data);
        
        // SIMPLE mapping - your ESP8266 sends this exact data
        const sensorData = {
          moisture: data.humidity || 0,     // ESP8266 humidity → moisture
          nitrogen: data.nitrogen || 0,
          phosphorus: data.phosphorus || 0,
          potassium: data.potassium || 0,
          conductivity: data.conductivity || 0,
          ph: data.ph || 7.0,
          temperature: data.temperature || 20,
          timestamp: Date.now()
        };
        
        this.isConnected = true;
        return sensorData;
      } else {
        console.log(`[ESP8266Service] ❌ Response not OK:`, response.status);
        this.isConnected = false;
      }
    } catch (error) {
      console.log(`[ESP8266Service] ❌ Failed:`, error.message);
      this.isConnected = false;
    }
    
    return null;
  }

  public getConnectionStatus(): boolean {
    return this.isConnected;
  }

  public getIP(): string {
    return this.esp32IP;
  }

  // ULTRA-RAPID: Enable burst mode for maximum data throughput
  public enableBurstMode() {
    console.log('[ESP32Service] BURST MODE ENABLED - Maximum data throughput');
    this.burstMode = true;
  }

  public disableBurstMode() {
    console.log('[ESP32Service] BURST MODE DISABLED');
    this.burstMode = false;
  }

  // PARALLEL DATA FETCHING: Get multiple sensor readings simultaneously
  public async getBurstSensorData(showNotification?: (msg: string) => void): Promise<ESP32SensorData[]> {
    if (!this.isConnected) {
      const connected = await this.connect(showNotification);
      if (!connected) return [];
    }

    console.log(`[ESP32Service] BURST MODE: Fetching ${this.parallelRequests} parallel sensor readings`);
    
    // Create multiple parallel requests for ultra-rapid data collection
    const promises = Array.from({ length: this.parallelRequests }, () => 
      this.getSensorData(showNotification)
    );

    try {
      const results = await Promise.allSettled(promises);
      const validData = results
        .filter((result): result is PromiseFulfilledResult<ESP32SensorData> => 
          result.status === 'fulfilled' && result.value !== null
        )
        .map(result => result.value);

      console.log(`[ESP32Service] BURST MODE: Retrieved ${validData.length}/${this.parallelRequests} sensor readings`);
      return validData;
    } catch (error) {
      console.error('[ESP32Service] BURST MODE: Error in parallel data fetching:', error);
      return [];
    }
  }

  // RAPID PING: Quick connection test with minimal timeout
  public async rapidPing(): Promise<boolean> {
    try {
      const response = await this.fetchWithTimeout(`http://${this.esp32IP}/`, {
        method: 'HEAD', // HEAD request is faster than GET
        headers: { 'Content-Type': 'application/json' }
      }, 200); // Ultra-fast 200ms timeout for ping
      
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}

export const esp32Service = new ESP32Service();
