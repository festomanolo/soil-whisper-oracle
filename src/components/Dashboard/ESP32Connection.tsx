
import React, { useState } from 'react';
import { useSensorData } from '../../context/SensorDataContext';
import { Wifi, WifiOff, Settings, Globe, Search, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { esp32Service } from '../../services/esp32Service';

interface DiscoveredDevice {
  ip: string;
  data: any;
  responseTime: number;
  isESP8266: boolean;
}

const ESP32Connection = () => {
  const { isConnected, esp32IP, setESP32IP, connectToSensor, isOfflineMode } = useSensorData();
  const [showSettings, setShowSettings] = useState(false);
  const [tempIP, setTempIP] = useState(esp32IP);
  const [isScanning, setIsScanning] = useState(false);
  const [discoveredDevices, setDiscoveredDevices] = useState<DiscoveredDevice[]>([]);
  const [scanProgress, setScanProgress] = useState(0);
  const [showDiscovered, setShowDiscovered] = useState(false);

  const handleSaveIP = () => {
    setESP32IP(tempIP);
    setShowSettings(false);
    connectToSensor();
  };

  // Comprehensive network scanning function
  const handleScanNetwork = async () => {
    setIsScanning(true);
    setScanProgress(0);
    setDiscoveredDevices([]);
    setShowDiscovered(true);
    
    console.log('[ESP32Connection] Starting comprehensive network scan...');
    
    // Define IP ranges to scan (common hotspot and router ranges)
    const ipRanges = [
      '192.168.43', // Android hotspot (your current network)
      '192.168.1',  // Common home router
      '172.20.10',  // iPhone hotspot
      '10.0.0',     // Alternative range
    ];
    
    const devices: DiscoveredDevice[] = [];
    let totalIPs = 0;
    let scannedIPs = 0;
    
    // Calculate total IPs to scan
    ipRanges.forEach(() => {
      totalIPs += 20; // Scan .140 to .160 for each range (most common ESP8266 range)
    });
    
    for (const baseIP of ipRanges) {
      console.log(`[ESP32Connection] Scanning ${baseIP}.x range...`);
      
      // Scan range .140 to .160 (most common ESP8266 IPs)
      for (let i = 140; i <= 160; i++) {
        const testIP = `${baseIP}.${i}`;
        scannedIPs++;
        setScanProgress(Math.round((scannedIPs / totalIPs) * 100));
        
        try {
          const startTime = Date.now();
          
          // Test if device responds to HTTP request
          const response = await fetch(`http://${testIP}/`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            signal: AbortSignal.timeout(2000) // 2 second timeout
          });
          
          if (response.ok) {
            const responseTime = Date.now() - startTime;
            let data = null;
            let isESP8266 = false;
            
            try {
              data = await response.json();
              
              // Check if response looks like ESP8266 sensor data
              isESP8266 = !!(
                data && 
                (data.temperature !== undefined || 
                 data.humidity !== undefined || 
                 data.moisture !== undefined ||
                 data.ph !== undefined ||
                 data.conductivity !== undefined)
              );
              
              console.log(`[ESP32Connection] Found device at ${testIP}:`, { data, isESP8266, responseTime });
              
            } catch (jsonError) {
              // Device responds but doesn't return JSON - might still be ESP8266
              data = { message: 'Device found but no JSON response' };
              isESP8266 = false;
            }
            
            devices.push({
              ip: testIP,
              data,
              responseTime,
              isESP8266
            });
            
            // Update discovered devices in real-time
            setDiscoveredDevices([...devices]);
          }
        } catch (error) {
          // Device not found or timeout - continue scanning
        }
      }
    }
    
    console.log(`[ESP32Connection] Network scan complete. Found ${devices.length} devices.`);
    
    // Auto-connect to the best ESP8266 device found
    const esp8266Devices = devices.filter(d => d.isESP8266);
    if (esp8266Devices.length > 0) {
      // Sort by response time (fastest first)
      esp8266Devices.sort((a, b) => a.responseTime - b.responseTime);
      const bestDevice = esp8266Devices[0];
      
      console.log(`[ESP32Connection] Auto-connecting to best ESP8266 at ${bestDevice.ip}`);
      setESP32IP(bestDevice.ip);
      await connectToSensor();
    }
    
    setIsScanning(false);
    setScanProgress(100);
  };

  // Connect to a specific discovered device
  const connectToDevice = async (device: DiscoveredDevice) => {
    console.log(`[ESP32Connection] Manually connecting to device at ${device.ip}`);
    setESP32IP(device.ip);
    setShowDiscovered(false);
    await connectToSensor();
  };

  return (
    <div className="card-glass rounded-[28px] backdrop-blur-md shadow-2xl p-4 animate-fade-in-up">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          {isScanning ? (
            <>
              <span className="data-indicator bg-emerald-500 animate-pulse"></span>
              <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              <h3 className="font-medium">Scanning Network...</h3>
            </>
          ) : isConnected ? (
            <>
              <span className="data-indicator bg-green-500"></span>
              <Wifi size={18} className="text-green-500" />
              <h3 className="font-medium">ESP8266 Connected</h3>
            </>
          ) : (
            <>
              <span className="data-indicator bg-red-500"></span>
              <WifiOff size={18} className="text-red-500" />
              <h3 className="font-medium">ESP8266 Disconnected</h3>
            </>
          )}
        </div>
        
        <button 
          onClick={() => setShowSettings(!showSettings)}
          className="p-1 hover:bg-muted rounded-md"
        >
          <Settings size={16} />
        </button>
      </div>

      {isOfflineMode && !isScanning && (
        <div className="flex items-center space-x-2 mb-3 p-2 bg-lime-500/20 rounded-md">
          <Globe size={16} className="text-lime-500" />
          <span className="text-sm text-lime-600 dark:text-lime-400">
            Offline Mode - Using cached data
          </span>
        </div>
      )}

      {showSettings && (
        <div className="mb-4 p-3 bg-muted/50 rounded-lg space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              ESP8266 IP Address
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={tempIP}
                onChange={(e) => setTempIP(e.target.value)}
                placeholder="192.168.1.100"
                className="flex-1 px-2 py-1 text-sm bg-background border border-border rounded-md"
              />
              <button 
                onClick={handleSaveIP}
                className="px-3 py-1 text-sm bg-primary hover:bg-primary/90 text-primary-foreground rounded-md"
              >
                Save
              </button>
            </div>
          </div>
          
          <div className="text-xs text-muted-foreground">
            <p>Common ESP8266 IPs when connected to hotspot:</p>
            <p>• Android hotspot: 192.168.43.x</p>
            <p>• iPhone hotspot: 172.20.10.x</p>
            <p>• Home router: 192.168.1.x</p>
          </div>
        </div>
      )}

      <div className="text-sm text-muted-foreground mb-3">
        Current IP: {esp32IP}
      </div>

      {/* Scanning Progress */}
      {isScanning && (
        <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
              Scanning Network...
            </span>
            <span className="text-sm text-emerald-600 dark:text-emerald-400">
              {scanProgress}%
            </span>
          </div>
          <div className="w-full bg-emerald-200 dark:bg-emerald-800 rounded-full h-2">
            <div 
              className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${scanProgress}%` }}
            />
          </div>
          <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
            Scanning IP ranges: 192.168.43.x, 192.168.1.x, 172.20.10.x, 10.0.0.x
          </div>
        </div>
      )}

      {/* Discovered Devices */}
      {showDiscovered && discoveredDevices.length > 0 && (
        <div className="mb-4 p-3 bg-muted/30 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium">Discovered Devices ({discoveredDevices.length})</h4>
            <button
              onClick={() => setShowDiscovered(false)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Hide
            </button>
          </div>
          
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {discoveredDevices.map((device, index) => (
              <div
                key={device.ip}
                className={`p-3 rounded-lg border transition-all cursor-pointer hover:shadow-md ${
                  device.isESP8266
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : 'bg-muted/50 border-border'
                }`}
                onClick={() => connectToDevice(device)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {device.isESP8266 ? (
                      <CheckCircle size={16} className="text-green-500" />
                    ) : (
                      <AlertCircle size={16} className="text-lime-500" />
                    )}
                    <span className="font-medium text-sm">{device.ip}</span>
                    {device.isESP8266 && (
                      <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded-full">
                        ESP8266
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {device.responseTime}ms
                  </span>
                </div>
                
                {device.isESP8266 && device.data && (
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {device.data.temperature !== undefined && (
                      <div>Temp: {device.data.temperature}°C</div>
                    )}
                    {device.data.humidity !== undefined && (
                      <div>Humidity: {device.data.humidity}%</div>
                    )}
                    {device.data.ph !== undefined && (
                      <div>pH: {device.data.ph}</div>
                    )}
                    {device.data.conductivity !== undefined && (
                      <div>EC: {device.data.conductivity}%</div>
                    )}
                  </div>
                )}
                
                {!device.isESP8266 && (
                  <div className="text-xs text-muted-foreground">
                    {device.data?.message || 'Unknown device type'}
                  </div>
                )}
                
                <div className="text-xs text-muted-foreground mt-1">
                  Click to connect to this device
                </div>
              </div>
            ))}
          </div>
          
          {discoveredDevices.filter(d => d.isESP8266).length === 0 && !isScanning && (
            <div className="text-center py-4 text-sm text-muted-foreground">
              <AlertCircle size={20} className="mx-auto mb-2 text-lime-500" />
              No ESP8266 devices found. Make sure your ESP8266 is:
              <ul className="text-xs mt-2 space-y-1">
                <li>• Powered on and running</li>
                <li>• Connected to the same WiFi network</li>
                <li>• Running the web server code</li>
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end space-x-2">
        <button 
          onClick={handleScanNetwork}
          disabled={isScanning}
          className="px-3 py-1 text-sm bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white rounded-md flex items-center space-x-1"
        >
          <Search size={14} />
          <span>{isScanning ? 'Scanning...' : 'Scan Network'}</span>
        </button>
        <button 
          onClick={connectToSensor}
          disabled={isScanning}
          className="px-3 py-1 text-sm bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-primary-foreground rounded-md"
        >
          {isConnected ? 'Reconnect' : 'Connect'}
        </button>
      </div>
    </div>
  );
};

export default ESP32Connection;
