// Batch accuracy test for model.js using Crop_recommendation.csv
import fs from 'fs';
import path from 'path';
import { predictCrop, cropLabels } from './model.js';
import { parse } from 'csv-parse/sync';

// Load CSV data
const csvPath = path.resolve('../crop-prediction-model-main/Crop_recommendation.csv');
const csvData = fs.readFileSync(csvPath, 'utf8');
const records = parse(csvData, { columns: true });

let correct = 0;
let total = 0;
const confusion = {};

for (const row of records) {
  // Features: [N, P, K, temperature, humidity, ph, rainfall]
  const features = [
    parseFloat(row.N),
    parseFloat(row.P),
    parseFloat(row.K),
    parseFloat(row.temperature),
    parseFloat(row.humidity),
    parseFloat(row.ph),
    parseFloat(row.rainfall)
  ];
  const pred = predictCrop(features);
  const actual = row.label;
  if (!confusion[actual]) confusion[actual] = {};
  if (!confusion[actual][pred]) confusion[actual][pred] = 0;
  confusion[actual][pred]++;
  if (pred === actual) correct++;
  total++;
}

console.log(`\nModel.js Accuracy: ${(correct/total*100).toFixed(2)}% (${correct}/${total})\n`);
console.log('Confusion Matrix (actual x predicted):');
console.log(JSON.stringify(confusion, null, 2)); 