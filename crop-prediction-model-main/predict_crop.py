import pickle
import pandas as pd

# Load the trained model
model = pickle.load(open('model.pkl', 'rb'))

def predict_crop(N, P, K, temperature, humidity, ph, rainfall):
    """
    Predict the best crop based on soil and weather conditions.
    
    Parameters:
    N - Nitrogen content ratio in soil
    P - Phosphorous content ratio in soil
    K - Potassium content ratio in soil
    temperature - Temperature in degree Celsius
    humidity - Relative humidity in %
    ph - pH value of the soil
    rainfall - Rainfall in mm
    
    Returns:
    Predicted crop name
    """
    # Create a DataFrame with the input features
    input_data = pd.DataFrame({
        'N': [N],
        'P': [P],
        'K': [K],
        'temperature': [temperature],
        'humidity': [humidity],
        'ph': [ph],
        'rainfall': [rainfall]
    })
    
    # Make prediction
    prediction = model.predict(input_data)
    return prediction[0]

# Example usage
if __name__ == "__main__":
    # Example 1: Conditions suitable for rice
    print("Example 1 - Predicted crop:", predict_crop(90, 40, 40, 25, 80, 6.5, 200))
    
    # Example 2: Conditions suitable for cotton
    print("Example 2 - Predicted crop:", predict_crop(50, 50, 40, 30, 50, 7.5, 100))
    
    # Example 3: Conditions suitable for apple
    print("Example 3 - Predicted crop:", predict_crop(20, 30, 20, 15, 60, 6.0, 120))
