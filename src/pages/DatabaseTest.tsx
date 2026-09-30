import React, { useState, useEffect } from 'react';
import { databaseService, SensorReading, Field } from '../services/database';
import { Button } from '@/components/UI/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/UI/card';
import { Input } from '@/components/UI/input';
import { Label } from '@/components/UI/label';

const DatabaseTest = () => {
  const [stats, setStats] = useState<{
    totalReadings: number;
    totalFields: number;
    latestReading?: SensorReading;
  }>({ totalReadings: 0, totalFields: 0 });
  
  const [readings, setReadings] = useState<SensorReading[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldLocation, setNewFieldLocation] = useState('');

  const loadData = async () => {
    try {
      const [statsData, readingsData, fieldsData] = await Promise.all([
        databaseService.getStatistics(),
        databaseService.getSensorReadings(10),
        databaseService.getFields()
      ]);
      
      setStats(statsData);
      setReadings(readingsData);
      setFields(fieldsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const addTestReading = async () => {
    try {
      const testReading: Omit<SensorReading, 'id' | 'created_at'> = {
        ph: Math.random() * 14,
        moisture: Math.random() * 100,
        temperature: 20 + Math.random() * 15,
        nitrogen: Math.random() * 100,
        phosphorus: Math.random() * 100,
        potassium: Math.random() * 100,
        location: 'Test Location',
        timestamp: Date.now()
      };
      
      await databaseService.saveSensorReading(testReading);
      await loadData();
    } catch (error) {
      console.error('Failed to add test reading:', error);
    }
  };

  const addField = async () => {
    if (!newFieldName.trim() || !newFieldLocation.trim()) return;
    
    try {
      await databaseService.saveField({
        name: newFieldName,
        location: newFieldLocation,
        crop_type: 'Test Crop'
      });
      
      setNewFieldName('');
      setNewFieldLocation('');
      await loadData();
    } catch (error) {
      console.error('Failed to add field:', error);
    }
  };

  const clearAllData = async () => {
    try {
      await databaseService.clearAllData();
      await loadData();
    } catch (error) {
      console.error('Failed to clear data:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold">SQLite Database Test</h1>
      
      {/* Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Database Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Readings</p>
              <p className="text-2xl font-bold">{stats.totalReadings}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Fields</p>
              <p className="text-2xl font-bold">{stats.totalFields}</p>
            </div>
          </div>
          {stats.latestReading && (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">Latest Reading</p>
              <p className="text-sm">pH: {stats.latestReading.ph.toFixed(1)}, Moisture: {stats.latestReading.moisture.toFixed(1)}%</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Controls */}
      <div className="flex gap-2 flex-wrap">
        <Button onClick={addTestReading}>Add Test Reading</Button>
        <Button onClick={loadData} variant="outline">Refresh Data</Button>
        <Button onClick={clearAllData} variant="destructive">Clear All Data</Button>
      </div>

      {/* Add Field */}
      <Card>
        <CardHeader>
          <CardTitle>Add New Field</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="fieldName">Field Name</Label>
            <Input
              id="fieldName"
              value={newFieldName}
              onChange={(e) => setNewFieldName(e.target.value)}
              placeholder="Enter field name"
            />
          </div>
          <div>
            <Label htmlFor="fieldLocation">Location</Label>
            <Input
              id="fieldLocation"
              value={newFieldLocation}
              onChange={(e) => setNewFieldLocation(e.target.value)}
              placeholder="Enter location"
            />
          </div>
          <Button onClick={addField}>Add Field</Button>
        </CardContent>
      </Card>

      {/* Recent Readings */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Readings ({readings.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {readings.map((reading) => (
              <div key={reading.id} className="p-2 border rounded text-sm">
                <div className="flex justify-between">
                  <span>pH: {reading.ph.toFixed(1)}</span>
                  <span>Moisture: {reading.moisture.toFixed(1)}%</span>
                  <span>Temp: {reading.temperature.toFixed(1)}°C</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(reading.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Fields */}
      <Card>
        <CardHeader>
          <CardTitle>Fields ({fields.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {fields.map((field) => (
              <div key={field.id} className="p-2 border rounded">
                <div className="font-medium">{field.name}</div>
                <div className="text-sm text-muted-foreground">{field.location}</div>
                {field.crop_type && (
                  <div className="text-xs text-muted-foreground">Crop: {field.crop_type}</div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DatabaseTest;