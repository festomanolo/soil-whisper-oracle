import pickle
import m2cgen as m2c
import pandas as pd
import numpy as np

# Load your model
model = pickle.load(open("model.pkl", "rb"))

# Get all unique labels in the order they appear in the dataset
# (Assume the main training file is Crop_recommendation.csv)
df = pd.read_csv("Crop_recommendation.csv")
labels = df["label"].unique().tolist()

# Generate JS code for the model
js_code = m2c.export_to_javascript(model)

# Write the model function to JS file (output to Vue src/lib/model.js)
output_path = "../src/lib/model.js"
# Add scaler parameters for the first 7 features
scaler_mean = [50.551818181818184, 53.36272727272727, 48.14909090909091, 25.616243837529964, 71.48177924459631, 6.469480065757578, 103.46365539290689]
scaler_scale = [36.908942340920056, 32.978386013592605, 50.63641786780126, 5.062597626413046, 22.25875131632835, 0.7737617764803032, 54.94589670105532]

with open(output_path, "w") as f:
    f.write(js_code)
    f.write("\n\n")
    # Add the label mapping
    f.write(f"export const cropLabels = {labels};\n")
    # Add scaler parameters
    f.write(f"export const scalerMean = {scaler_mean};\n")
    f.write(f"export const scalerScale = {scaler_scale};\n")
    # Write a helper to scale features and map prediction to label using argmax
    f.write("""
function scaleFeatures(features) {
    return features.map((x, i) => (x - scalerMean[i]) / scalerScale[i]);
}
export function predictCrop(features) {
    const scaled = scaleFeatures(features);
    const scores = score(scaled);
    let maxIdx = 0;
    for (let i = 1; i < scores.length; i++) {
        if (scores[i] > scores[maxIdx]) maxIdx = i;
    }
    return cropLabels[maxIdx];
}
""")

print(f"Exported model and label mapping to {output_path}") 