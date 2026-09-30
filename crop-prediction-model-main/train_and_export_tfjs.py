import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder, StandardScaler
from tensorflow import keras
import tensorflowjs as tfjs

# Load data
csv_path = 'Crop_recommendation.csv'
df = pd.read_csv(csv_path)
X = df[['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall']].values
y = df['label'].values

# Encode labels
le = LabelEncoder()
y_enc = le.fit_transform(y)

# Scale features
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# Build model using Functional API
inputs = keras.Input(shape=(7,), name="input_layer")
x = keras.layers.Dense(64, activation='relu')(inputs)
x = keras.layers.Dense(64, activation='relu')(x)
outputs = keras.layers.Dense(len(le.classes_), activation='softmax')(x)
model = keras.Model(inputs=inputs, outputs=outputs)
model.compile(optimizer='adam', loss='sparse_categorical_crossentropy', metrics=['accuracy'])

# Train
model.fit(X_scaled, y_enc, epochs=30, batch_size=32, validation_split=0.1)

# Force model build with input shape
model.build((None, 7))

# Save Keras model
model.save('keras_model.keras')

# Export to TensorFlow.js format
print('Exporting to tfjs_model/')
tfjs.converters.save_keras_model(model, 'tfjs_model/')

# Save label encoder and scaler for JS use
import joblib
joblib.dump(le, 'label_encoder.pkl')
joblib.dump(scaler, 'feature_scaler.pkl')
print('Done!') 