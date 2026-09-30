import * as tf from '@tensorflow/tfjs';

// Scaler parameters (must match Python StandardScaler)
export const scalerMean = [50.551818181818184, 53.36272727272727, 48.14909090909091, 25.616243837529964, 71.48177924459631, 6.469480065757578, 103.46365539290689];
export const scalerScale = [36.908942340920056, 32.978386013592605, 50.63641786780126, 5.062597626413046, 22.25875131632835, 0.7737617764803032, 54.94589670105532];

// Label encoder classes (must match Python LabelEncoder)
export const cropLabels = [
  "apple", "banana", "blackgram", "chickpea", "coconut", "coffee", "cotton", "grapes", "jute", "kidneybeans",
  "lentil", "maize", "mango", "mothbeans", "mungbean", "muskmelon", "orange", "papaya", "pigeonpeas", "pomegranate",
  "rice", "watermelon"
];

// Preprocess features (scale)
function scaleFeatures(features) {
    return features.map((x, i) => (x - scalerMean[i]) / scalerScale[i]);
}

// Load the model (do this once, e.g. in a useEffect or on app start)
let model;
export async function loadModel() {
  if (!model) {
    model = await tf.loadLayersModel('tfjs_model/tfjs_model/model.json');
  }
}

// Predict crop
export async function predictCrop(features) {
  if (!model) {
    await loadModel();
  }
    const scaled = scaleFeatures(features);
  const input = tf.tensor2d([scaled]);
  const prediction = model.predict(input);
  const predIdx = (await prediction.argMax(1).data())[0];
  input.dispose();
  prediction.dispose();
  return cropLabels[predIdx];
}

// Example usage:
// await loadModel();
// const features = [N, P, K, temperature, humidity, ph, rainfall];
// const crop = await predictCrop(features);
// console.log('Predicted crop:', crop);
