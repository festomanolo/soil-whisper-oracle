import pandas as pd
import numpy as np

def load_and_prepare_data():
    # Load all datasets
    main_data = pd.read_csv('Crop_recommendation.csv')
    cp_data = pd.read_csv('cropsdata/cpdata.csv')
    
    # Define column names for cropDB since it doesn't have headers
    crop_db_columns = [
        'crop', 'min_temp', 'max_temp', 'min_ph', 'max_ph', 
        'min_rainfall', 'max_rainfall', 'water_req', 'temp_req', 'ph_req'
    ]
    
    # Read cropDB and ensure proper data types
    crop_db = pd.read_csv('cropsdata/cropDB.csv', names=crop_db_columns)
    
    # Ensure crop names are strings and clean them
    crop_db['crop'] = crop_db['crop'].astype(str).str.lower().str.strip()
    
    # Standardize column names (convert to lowercase and replace spaces with underscores)
    main_data.columns = main_data.columns.str.lower().str.replace(' ', '_')
    cp_data.columns = cp_data.columns.str.lower().str.replace(' ', '_')
    
    # Standardize crop names in cp_data
    cp_data['label'] = cp_data['label'].astype(str).str.lower().str.strip()
    
    # Ensure numeric columns are properly typed
    numeric_cols = ['n', 'p', 'k', 'temperature', 'humidity', 'ph', 'rainfall']
    for col in numeric_cols:
        if col in main_data.columns:
            main_data[col] = pd.to_numeric(main_data[col], errors='coerce')
        if col in cp_data.columns:
            cp_data[col] = pd.to_numeric(cp_data[col], errors='coerce')
    
    # Drop any rows with missing values
    main_data = main_data.dropna()
    cp_data = cp_data.dropna()
    
    return main_data, cp_data, crop_db

def merge_datasets(main_data, cp_data):
    # Check for common columns
    common_columns = list(set(main_data.columns) & set(cp_data.columns))
    
    # Merge datasets
    combined_data = pd.concat([main_data, cp_data], ignore_index=True)
    
    # Remove any potential duplicates
    combined_data = combined_data.drop_duplicates()
    
    return combined_data

def add_crop_features(combined_data, crop_db):
    # Create a mapping of crop names to their requirements
    crop_info = {}
    for _, row in crop_db.iterrows():
        crop_name = row['crop'].lower().strip()
        try:
            crop_info[crop_name] = {
                'min_temp': float(row['min_temp']),
                'max_temp': float(row['max_temp']),
                'min_ph': float(row['min_ph']),
                'max_ph': float(row['max_ph']),
                'min_rainfall': float(row['min_rainfall']),
                'max_rainfall': float(row['max_rainfall']),
                'water_req': row['water_req']
            }
        except (ValueError, KeyError) as e:
            print(f"Warning: Could not process crop {crop_name}: {e}")
            continue
    
    # Add new features based on crop requirements
    def add_optimal_features(row):
        crop = row['label'].lower().strip()
        if crop in crop_info:
            info = crop_info[crop]
            return pd.Series({
                'temp_in_range': float(info['min_temp'] <= row['temperature'] <= info['max_temp']),
                'ph_in_range': float(info['min_ph'] <= row['ph'] <= info['max_ph']),
                'rainfall_in_range': float(info['min_rainfall'] <= row['rainfall'] <= info['max_rainfall']),
                'water_requirement': 0 if info['water_req'] == 'L' else (1 if info['water_req'] == 'M' else 2),
                'optimal_temp_diff': abs(row['temperature'] - (info['min_temp'] + info['max_temp'])/2),
                'optimal_ph_diff': abs(row['ph'] - (info['min_ph'] + info['max_ph'])/2),
                'optimal_rainfall_diff': abs(row['rainfall'] - (info['min_rainfall'] + info['max_rainfall'])/2)
            })
        return pd.Series({
            'temp_in_range': 0,
            'ph_in_range': 0,
            'rainfall_in_range': 0,
            'water_requirement': -1,
            'optimal_temp_diff': -1,
            'optimal_ph_diff': -1,
            'optimal_rainfall_diff': -1
        })
    
    # Apply the function to each row
    new_features = combined_data.apply(add_optimal_features, axis=1)
    
    # Combine with original data
    enhanced_data = pd.concat([combined_data, new_features], axis=1)
    
    return enhanced_data

def save_enhanced_data(enhanced_data, filename='enhanced_crop_data.csv'):
    # Save the enhanced dataset
    enhanced_data.to_csv(filename, index=False)
    
    # Print dataset information
    print(f"\n{'='*50}")
    print(f"Enhanced dataset saved as {filename}")
    print(f"{'='*50}")
    print(f"Original features: {enhanced_data.shape[1] - 7} features")
    print(f"Added features: 7 new features")
    print(f"Total features: {enhanced_data.shape[1]} features")
    print(f"Total samples: {enhanced_data.shape[0]:,} samples")
    
    # Print information about the new features
    print("\nAdded Features:")
    print("1. temp_in_range: 1 if temperature is within crop's optimal range, else 0")
    print("2. ph_in_range: 1 if pH is within crop's optimal range, else 0")
    print("3. rainfall_in_range: 1 if rainfall is within crop's optimal range, else 0")
    print("4. water_requirement: 0=Low, 1=Medium, 2=High")
    print("5. optimal_temp_diff: Absolute difference from optimal temperature")
    print("6. optimal_ph_diff: Absolute difference from optimal pH")
    print("7. optimal_rainfall_diff: Absolute difference from optimal rainfall")
    
    # Print sample of the new features
    print("\nSample of the enhanced data (first 3 rows):")
    print(enhanced_data[['label', 'temperature', 'ph', 'rainfall', 'temp_in_range', 
                        'ph_in_range', 'rainfall_in_range']].head(3).to_string())
    
    # Save a separate file with just the new features for reference
    new_features = ['temp_in_range', 'ph_in_range', 'rainfall_in_range', 
                   'water_requirement', 'optimal_temp_diff', 'optimal_ph_diff', 
                   'optimal_rainfall_diff']
    enhanced_data[['label'] + new_features].to_csv('crop_optimal_ranges.csv', index=False)
    print("\nOptimal ranges for each crop saved to 'crop_optimal_ranges.csv'")
    print("="*50)

def main():
    print("Loading and preparing data...")
    main_data, cp_data, crop_db = load_and_prepare_data()
    
    print("Merging datasets...")
    combined_data = merge_datasets(main_data, cp_data)
    
    print("Adding crop-specific features...")
    enhanced_data = add_crop_features(combined_data, crop_db)
    
    print("Saving enhanced dataset...")
    save_enhanced_data(enhanced_data)
    
    print("\nPreview of the enhanced dataset:")
    print(enhanced_data.head())
    
    print("\nData enhancement complete!")

if __name__ == "__main__":
    main()
