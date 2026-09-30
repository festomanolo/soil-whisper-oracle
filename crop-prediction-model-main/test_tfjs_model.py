import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder, StandardScaler
from tensorflow import keras
import joblib

# Load data
csv_path = 'Crop_recommendation.csv'
df = pd.read_csv(csv_path)
X = df[['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall']].values
y = df['label'].values

# Load scaler and label encoder
scaler = joblib.load('feature_scaler.pkl')
le = joblib.load('label_encoder.pkl')

# Encode labels
y_enc = le.transform(y)

# Scale features
X_scaled = scaler.transform(X)

# Load Keras model
model = keras.models.load_model('keras_model.h5')

# Predict
y_pred_probs = model.predict(X_scaled)
y_pred = np.argmax(y_pred_probs, axis=1)

# Calculate accuracy
accuracy = np.mean(y_pred == y_enc)
print(f"Keras Model Accuracy: {accuracy*100:.2f}% ({np.sum(y_pred == y_enc)}/{len(y_enc)})")

# Classification report
from sklearn.metrics import classification_report
print(classification_report(y_enc, y_pred, target_names=le.classes_)) 