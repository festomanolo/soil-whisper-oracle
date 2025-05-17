
import React from 'react';
import DashboardLayout from '../components/Layout/DashboardLayout';
import SoilHealthMetrics from '../components/Dashboard/SoilHealthMetrics';
import CropRecommendations from '../components/Dashboard/CropRecommendations';
import SensorVisualizer from '../components/Dashboard/SensorVisualizer';
import { SensorDataProvider } from '../context/SensorDataContext';

const Index = () => {
  return (
    <SensorDataProvider>
      <DashboardLayout>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Dashboard Content */}
          <div className="lg:col-span-2 space-y-6">
            <h1 className="text-3xl font-bold mb-2">Soil Analysis Dashboard</h1>
            <p className="text-muted-foreground mb-6">
              Monitor soil health metrics and get AI-powered crop recommendations in real-time.
            </p>
            
            {/* Soil Health Metrics */}
            <SoilHealthMetrics />
            
            {/* Charts and Additional Data Would Go Here */}
            <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl p-6 border border-primary/20">
              <h2 className="text-lg font-semibold mb-4">7-Day Trend Forecast</h2>
              <div className="h-64 flex items-center justify-center">
                <p className="text-muted-foreground text-center">
                  Chart visualization will appear here tracking soil metrics over time<br />
                  <span className="text-sm">(Historical data collection in progress)</span>
                </p>
              </div>
            </div>
          </div>
          
          {/* Sidebar Content */}
          <div className="space-y-6">
            {/* Sensor Status */}
            <SensorVisualizer />
            
            {/* Crop Recommendations */}
            <CropRecommendations />
          </div>
        </div>
      </DashboardLayout>
    </SensorDataProvider>
  );
};

export default Index;
