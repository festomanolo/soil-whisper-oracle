import pickle
import pandas as pd
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.model_selection import train_test_split

# Load the model
model = pickle.load(open('model.pkl', 'rb'))

# Load the original dataset
orig_data = pd.read_csv('Crop_recommendation.csv')
X = orig_data[['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall']]
y = orig_data['label']

# Split into train and test sets
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=0, stratify=y)

# Make predictions
y_pred = model.predict(X_test)

# Print accuracy
accuracy = accuracy_score(y_test, y_pred)
print(f"\nModel Accuracy: {accuracy*100:.2f}%\n")

# Print classification report
print("\nClassification Report:")
print(classification_report(y_test, y_pred))

# Print confusion matrix
print("\nConfusion Matrix (counts):")
print(confusion_matrix(y_test, y_pred))
