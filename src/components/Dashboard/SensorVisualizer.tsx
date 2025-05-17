
import React from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { useSensorData } from '../../context/SensorDataContext';
import { formatDistance } from 'date-fns';

const SensorVisualizer = () => {
  const { isConnected, lastUpdate, refreshData, connectToSensor } = useSensorData();

  return (
    <div className="card-glass p-4 animate-fade-in-up">
      <div className="flex items-center justify-between">
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
              <h3 className="font-medium">Disconnected</h3>
            </>
          )}
        </div>
        
        <div className="flex space-x-2">
          <button 
            onClick={refreshData}
            disabled={!isConnected}
            className="px-3 py-1 text-sm bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-md disabled:opacity-50"
          >
            Refresh
          </button>
          
          {!isConnected && (
            <button 
              onClick={connectToSensor}
              className="px-3 py-1 text-sm bg-primary hover:bg-primary/90 text-primary-foreground rounded-md"
            >
              Connect
            </button>
          )}
        </div>
      </div>
      
      <div className="mt-2 text-sm text-muted-foreground">
        Last updated: {isConnected ? (
          formatDistance(lastUpdate, new Date(), { addSuffix: true })
        ) : (
          'Never'
        )}
      </div>
      
      <div className="mt-4 p-3 bg-muted/50 rounded-lg">
        <div className="text-xs text-muted-foreground mb-1">Sensor ID</div>
        <div className="font-mono">ESP32-AGRIO-24A71B</div>
        
        <div className="grid grid-cols-2 gap-4 mt-2">
          <div>
            <div className="text-xs text-muted-foreground">Signal Strength</div>
            <div className="flex items-center mt-1">
              <div className="w-full bg-muted rounded-full h-2">
                <div className={`h-full rounded-full ${isConnected ? 'bg-green-500 w-4/5' : 'bg-red-500 w-0'}`}></div>
              </div>
              <span className="ml-2 text-xs">{isConnected ? '80%' : '0%'}</span>
            </div>
          </div>
          
          <div>
            <div className="text-xs text-muted-foreground">Battery</div>
            <div className="flex items-center mt-1">
              <div className="w-full bg-muted rounded-full h-2">
                <div className="h-full rounded-full bg-blue-500 w-2/3"></div>
              </div>
              <span className="ml-2 text-xs">67%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SensorVisualizer;
