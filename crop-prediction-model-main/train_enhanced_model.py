import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.model_selection import cross_val_score, GridSearchCV
import matplotlib.pyplot as plt
import seaborn as sns
import joblib
import os

def load_data():
    """Load the enhanced dataset and prepare features/target."""
    import os
    # Prefer the cleaned dataset if it exists
    if os.path.exists('enhanced_crop_data_cleaned.csv'):
        print("Loading cleaned dataset...")
        data = pd.read_csv('enhanced_crop_data_cleaned.csv')
    else:
        print("Loading original dataset...")
        data = pd.read_csv('enhanced_crop_data.csv')
    
    # Check for missing values
    print("\nChecking for missing values:")
    print(data.isnull().sum())
    
    # Drop rows with any missing values
    data = data.dropna()
    
    # Check for infinite values
    print("\nChecking for infinite values:")
    print((np.isinf(data.select_dtypes(include=[np.number])).sum()))
    
    # Replace infinite values with NaN and drop them
    data = data.replace([np.inf, -np.inf], np.nan).dropna()
    
    # Drop labels with fewer than 2 samples (cannot split)
    label_counts = data['label'].value_counts()
    rare_labels = label_counts[label_counts < 2].index
    if len(rare_labels) > 0:
        print(f"Dropping rare labels (fewer than 2 samples): {list(rare_labels)}")
        data = data[~data['label'].isin(rare_labels)]
    
    # Separate features and target
    X = data.drop('label', axis=1)
    y = data['label']
    
    # Check data types
    print("\nFeature data types:")
    print(X.dtypes)
    
    # Convert all numeric columns to float32 to ensure consistency
    for col in X.select_dtypes(include=['int64', 'float64']).columns:
        X[col] = X[col].astype('float32')
    
    # Fit the label encoder on ALL unique labels in the dataset
    le = LabelEncoder()
    le.fit(data['label'].unique())
    y_encoded = le.transform(y)
    
    # Save the label encoder for later use
    joblib.dump(le, 'label_encoder.pkl')
    
    print(f"\nFinal dataset shape: {X.shape}")
    print(f"Number of unique crops: {len(le.classes_)}")
    print(f"Label classes: {le.classes_}")
    
    return X, y, y_encoded, le

def preprocess_features(X):
    """Preprocess the features."""
    # Select numerical columns to scale
    numerical_cols = X.select_dtypes(include=['float32']).columns
    
    # Initialize and fit the scaler
    scaler = StandardScaler()
    X_scaled = X.copy()
    
    # Only scale if there are numerical columns
    if len(numerical_cols) > 0:
        print(f"\nScaling {len(numerical_cols)} numerical features...")
        X_scaled[numerical_cols] = scaler.fit_transform(X[numerical_cols])
        
        # Save the scaler for later use
        joblib.dump(scaler, 'feature_scaler.pkl')
    else:
        print("No numerical features to scale.")
    
    # Convert to float32 to ensure consistency
    X_scaled = X_scaled.astype('float32')
    
    # Check for any remaining invalid values
    if np.any(np.isnan(X_scaled)) or np.any(np.isinf(X_scaled)):
        print("Warning: NaN or infinite values detected after scaling!")
        # Replace any remaining invalid values with column means
        X_scaled = X_scaled.replace([np.inf, -np.inf], np.nan)
        X_scaled = X_scaled.fillna(X_scaled.mean())
    
    return X_scaled, scaler

def train_model(X_train, y_train):
    """Train and tune a Random Forest model."""
    print("\nTraining the model...")
    
    # First, check if we have enough data
    n_samples = X_train.shape[0]
    print(f"Training samples: {n_samples}")
    print(f"Number of features: {X_train.shape[1]}")
    
    # Use simpler parameters for smaller datasets
    if n_samples < 1000:
        print("Small dataset detected - using simpler parameter grid")
        param_grid = {
            'n_estimators': [50, 100],
            'max_depth': [None, 10],
            'min_samples_split': [2, 5],
            'random_state': [42]
        }
    else:
        param_grid = {
            'n_estimators': [100, 200],
            'max_depth': [None, 10, 20],
            'min_samples_split': [2, 5],
            'min_samples_leaf': [1, 2],
            'random_state': [42]
        }
    
    # Initialize the model with balanced class weights
    model = RandomForestClassifier(
        class_weight='balanced',
        n_jobs=-1,  # Use all available cores
        verbose=1
    )
    
    # Initialize GridSearchCV with error_score='raise' to see errors
    grid_search = GridSearchCV(
        estimator=model,
        param_grid=param_grid,
        cv=min(5, n_samples // 10),  # Use fewer folds for small datasets
        n_jobs=-1,
        verbose=2,
        scoring='accuracy',
        error_score='raise'
    )
    
    try:
        # Fit the model
        print("Starting model training...")
        grid_search.fit(X_train, y_train)
        
        # Get the best model
        best_model = grid_search.best_estimator_
        
        print(f"\nBest parameters: {grid_search.best_params_}")
        print(f"Best cross-validation accuracy: {grid_search.best_score_:.4f}")
        
        return best_model
        
    except Exception as e:
        print(f"Error during model training: {str(e)}")
        print("Falling back to default parameters...")
        
        # Fall back to default model if grid search fails
        model = RandomForestClassifier(
            n_estimators=100,
            random_state=42,
            class_weight='balanced',
            n_jobs=-1
        )
        model.fit(X_train, y_train)
        return model

def evaluate_model(model, X_test, y_test, y_test_encoded, le):
    """Evaluate the model and print metrics."""
    print("\nEvaluating the model...")
    
    # Make predictions
    y_pred = model.predict(X_test)
    y_pred_labels = le.inverse_transform(y_pred)
    
    # Calculate accuracy
    accuracy = accuracy_score(y_test_encoded, y_pred)
    print(f"\nModel Accuracy: {accuracy * 100:.2f}%")
    
    # Print classification report
    print("\nClassification Report:")
    print(classification_report(y_test_encoded, y_pred, target_names=le.classes_))
    
    # Plot confusion matrix
    plt.figure(figsize=(12, 10))
    cm = confusion_matrix(y_test_encoded, y_pred)
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', 
                xticklabels=le.classes_, 
                yticklabels=le.classes_)
    plt.title('Confusion Matrix')
    plt.xlabel('Predicted Label')
    plt.ylabel('True Label')
    plt.xticks(rotation=45, ha='right')
    plt.tight_layout()
    plt.savefig('confusion_matrix.png')
    print("Confusion matrix saved as 'confusion_matrix.png'")
    
    return accuracy

def plot_feature_importance(model, feature_names):
    """Plot and save feature importance."""
    print("\nPlotting feature importance...")
    
    # Get feature importances
    importances = model.feature_importances_
    indices = np.argsort(importances)[::-1]
    
    # Plot
    plt.figure(figsize=(12, 8))
    plt.title("Feature Importances")
    plt.bar(range(len(importances)), importances[indices], align='center')
    plt.xticks(range(len(importances)), [feature_names[i] for i in indices], rotation=90)
    plt.tight_layout()
    plt.savefig('feature_importance.png')
    print("Feature importance plot saved as 'feature_importance.png'")

def save_model(model, model_name='enhanced_crop_model.pkl'):
    """Save the trained model."""
    joblib.dump(model, model_name)
    print(f"\nModel saved as '{model_name}'")

def main():
    # Load and preprocess data
    X, y, y_encoded, le = load_data()
    X_scaled, scaler = preprocess_features(X)

    # Print feature columns and order for diagnostics
    print("\n[TRAIN] Feature columns and order:")
    print(list(X.columns))
    
    # Split the data
    X_train, X_test, y_train, y_test, y_train_encoded, y_test_encoded = train_test_split(
        X_scaled, y, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded
    )
    
    # Train the model
    model = train_model(X_train, y_train_encoded)
    
    # Evaluate the model
    accuracy = evaluate_model(model, X_test, y_test, y_test_encoded, le)
    
    # Plot feature importance
    plot_feature_importance(model, X.columns)
    
    # Save the model
    save_model(model)
    
    print("\nModel training and evaluation complete!")
    print(f"Final test accuracy: {accuracy * 100:.2f}%")

if __name__ == "__main__":
    main()
