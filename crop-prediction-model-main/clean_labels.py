import pandas as pd

# Define mapping of label variants to standardized names
label_map = {
    'mungbean': 'mung bean',
    'mung bean': 'mung bean',
    'kidneybeans': 'kidney bean',
    'kidney beans': 'kidney bean',
    'mothbeans': 'moth bean',
    'moth beans': 'moth bean',
    'blackgram': 'black gram',
    'black gram': 'black gram',
    'adzuki beans': 'adzuki bean',
    'adzuki bean': 'adzuki bean',
    'pigeonpeas': 'pigeon pea',
    'pigeon peas': 'pigeon pea',
    'ground nut': 'groundnut',
    'groundnut': 'groundnut',
    # Add more mappings as needed
}

def standardize_label(label):
    # Lowercase and strip whitespace
    label = label.strip().lower()
    # Map to standardized name if present
    return label_map.get(label, label)

# Load the dataset
input_file = 'enhanced_crop_data.csv'
df = pd.read_csv(input_file)

# Standardize the labels
print('Unique labels before cleaning:', df['label'].unique())
df['label'] = df['label'].apply(standardize_label)
print('Unique labels after cleaning:', df['label'].unique())

# Save the cleaned dataset
output_file = 'enhanced_crop_data_cleaned.csv'
df.to_csv(output_file, index=False)
print(f'Cleaned dataset saved as {output_file}') 