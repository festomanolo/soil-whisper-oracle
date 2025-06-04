
import React, { useState } from 'react';
import { useSensorData } from '../../context/SensorDataContext';
import { Wifi, WifiOff, Settings, Globe } from 'lucide-react';

const ESP32Connection = () => {
  const { isConnected, esp32IP, setESP32IP, connectToSensor, isOfflineMode } = useSensorData();
  const [showSettings, setShowSettings] = useState(false);
  const [tempIP, setTempIP] = useState(esp32IP);

  const handleSaveIP = () => {
    setESP32IP(tempIP);
    setShowSettings(false);
    connectToSensor();
  };

  return (
    <div className="card-glass p-4 animate-fade-in-up">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          {isConnected ? (
            <>
              <span className="data-indicator bg-green-500"></span>
              <Wifi size={18} className="text-green-500" />
              <h3 className="font-medium">ESP32 Connected</h3>
            </>
          ) : (
            <>
              <span className="data-indicator bg-red-500"></span>
              <WifiOff size={18} className="text-red-500" />
              <h3 className="font-medium">ESP32 Disconnected</h3>
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

      {isOfflineMode && (
        <div className="flex items-center space-x-2 mb-3 p-2 bg-amber-500/20 rounded-md">
          <Globe size={16} className="text-amber-500" />
          <span className="text-sm text-amber-600 dark:text-amber-400">
            Offline Mode - Using cached data
          </span>
        </div>
      )}

      {showSettings && (
        <div className="mb-4 p-3 bg-muted/50 rounded-lg space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              ESP32 IP Address
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={tempIP}
                onChange={(e) => setTempIP(e.target.value)}
                placeholder="192.168.4.1"
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
            <p>Common ESP32 IPs:</p>
            <p>• Access Point mode: 192.168.4.1</p>
            <p>• Station mode: Check your router</p>
          </div>
        </div>
      )}

      <div className="text-sm text-muted-foreground mb-3">
        Current IP: {esp32IP}
      </div>

      <div className="flex space-x-2">
        <button 
          onClick={connectToSensor}
          className="px-3 py-1 text-sm bg-primary hover:bg-primary/90 text-primary-foreground rounded-md"
        >
          {isConnected ? 'Reconnect' : 'Connect'}
        </button>
      </div>
    </div>
  );
};

export default ESP32Connection;
