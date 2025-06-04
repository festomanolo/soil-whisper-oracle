
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
  private esp32IP: string = '192.168.4.1'; // Default ESP32 AP IP
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;

  constructor() {
    this.loadSavedIP();
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

  private async fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  public async connect(): Promise<boolean> {
    try {
      console.log(`Attempting to connect to ESP32 at ${this.esp32IP}`);
      const response = await this.fetchWithTimeout(`http://${this.esp32IP}/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      }, 5000);

      if (response.ok) {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        console.log('Successfully connected to ESP32');
        return true;
      }
    } catch (error) {
      console.error('Failed to connect to ESP32:', error);
      this.isConnected = false;
    }
    return false;
  }

  public async getSensorData(): Promise<ESP32SensorData | null> {
    if (!this.isConnected) {
      const connected = await this.connect();
      if (!connected) return null;
    }

    try {
      const response = await this.fetchWithTimeout(`http://${this.esp32IP}/sensor-data`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      }, 10000);

      if (response.ok) {
        const data = await response.json();
        return {
          moisture: data.moisture || 0,
          nitrogen: data.nitrogen || 0,
          phosphorus: data.phosphorus || 0,
          potassium: data.potassium || 0,
          conductivity: data.conductivity || 0,
          ph: data.ph || 7.0,
          temperature: data.temperature || 20,
          timestamp: Date.now()
        };
      }
    } catch (error) {
      console.error('Failed to get sensor data:', error);
      this.isConnected = false;
      
      // Try to reconnect
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        setTimeout(() => this.connect(), 2000);
      }
    }
    return null;
  }

  public getConnectionStatus(): boolean {
    return this.isConnected;
  }

  public getIP(): string {
    return this.esp32IP;
  }
}

export const esp32Service = new ESP32Service();
