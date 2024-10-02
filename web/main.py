from flask import Flask, jsonify, render_template
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.naive_bayes import GaussianNB
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
import plotly.express as px
import plotly.io as pio
import joblib
import os

# Setup Flask app
app = Flask(__name__)

# File paths
train_file_path = '../data_latih.xlsx'
test_file_path = '../data_uji.xlsx'

# Preprocessing functions
def map_pendapatan(pendapatan):
    if pendapatan < 1000000:
        return 1
    elif 1000000 <= pendapatan < 2000000:
        return 2
    elif 2000000 <= pendapatan < 3000000:
        return 3
    elif 3000000 <= pendapatan < 4000000:
        return 4
    else:
        return 5

def preprocess_data(data):
    # Convert categorical variables to numerical
    data['pendapatan'] = data['pendapatan'].apply(map_pendapatan)
    data['jenis_kelamin'] = data['jenis_kelamin'].map({'Laki-laki': 1, 'Perempuan': 0})
    data['air_bersih'] = data['air_bersih'].map({'Buruk': 1, 'Cukup': 2, 'Baik': 3, 'Sangat Baik': 4})
    data['kondisi_sanitasi'] = data['kondisi_sanitasi'].map({'Buruk': 1, 'Cukup': 2, 'Baik': 3, 'Sangat Baik': 4})
    data['susu_formula'] = data['susu_formula'].map({'Tidak': 0, 'Ya': 1})
    
    selected_columns = ['pendapatan', 'tinggi', 'berat', 'jenis_kelamin', 'air_bersih', 'kondisi_sanitasi', 'susu_formula']
    X_data = data[selected_columns]
    return X_data

# Route for home page to display form and chart
@app.route('/')
def index():
    return render_template('index.html')

# Train route using GET method and preloaded file
@app.route('/train', methods=['GET'])
def train():
    # Load the training data from the preloaded file
    data = pd.read_excel(train_file_path)
    
    # Preprocess the data
    X, y = preprocess_data(data), data['status_stunting'].map({'Tidak': 0, 'Ya': 1})
    
    # Train Naive Bayes model
    model = GaussianNB()
    model.fit(X, y)
    
    # Save the model
    joblib.dump(model, 'naive_bayes_stunting_model.pkl')
    
    return jsonify({'message': 'Model trained and saved successfully using preloaded data'})

# Test route using GET method and preloaded file
@app.route('/test', methods=['GET'])
def test():
    # Load the test data from the preloaded file
    data = pd.read_excel(test_file_path)
    
    # Load the trained model
    model = joblib.load('naive_bayes_stunting_model.pkl')
    
    # Preprocess the data
    X_test = preprocess_data(data)
    
    # Make predictions
    predictions = model.predict(X_test)
    
    # Convert predictions to readable format
    data['status_stunting_predicted'] = predictions
    data['status_stunting_predicted'] = data['status_stunting_predicted'].map({0: 'Tidak Stunting', 1: 'Stunting'})
    
    # Convert the results to JSON format
    result_json = data[['nama_keluarga', 'status_stunting_predicted']].to_dict(orient='records')
    
    return jsonify(result_json)

# Evaluate route using POST method (stays unchanged)
@app.route('/evaluate', methods=['GET'])
def evaluate():
    # Load the evaluation data from the preloaded file `data_x.xlsx`
    data = pd.read_excel(train_file_path)  # Assume `train_file_path` is set to '/mnt/data/data_x.xlsx'
    
    # Preprocess the data
    X, y = preprocess_data(data), data['status_stunting'].map({'Tidak': 0, 'Ya': 1})
    
    # Split into train and test sets
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Load the trained model
    model = joblib.load('naive_bayes_stunting_model.pkl')
    
    # Make predictions and evaluate
    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred)
    recall = recall_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred)
    
    # Frequency of predictions (Stunting vs. Not Stunting)
    stunting_counts = pd.Series(y_pred).value_counts(normalize=True) * 100
    stunting_counts = stunting_counts.rename(index={0: "Tidak Stunting", 1: "Stunting"})
    
    # Convert the evaluation metrics to JSON format
    result_json = {
        'accuracy': accuracy,
        'precision': precision,
        'recall': recall,
        'f1_score': f1,
        'prediction_distribution': stunting_counts.to_dict()
    }
    
    return jsonify(result_json)
# Route to return training data as JSON
@app.route('/train_data', methods=['GET'])
def get_train_data():
    # Load the training data from `data_x.xlsx`
    train_data = pd.read_excel(train_file_path)  # Assume `train_file_path` is set to '/mnt/data/data_x.xlsx'
    
    # Convert the DataFrame to a JSON format
    train_data_json = train_data.to_dict(orient='records')
    
    # Return the training data as JSON
    return jsonify(train_data_json)

# Route to return test data as JSON
@app.route('/test_data', methods=['GET'])
def get_test_data():
    # Load the test data from `data_uji.xlsx`
    test_data = pd.read_excel(test_file_path)  # Assume `test_file_path` is set to '/mnt/data/data_uji.xlsx'
    
    # Convert the DataFrame to a JSON format
    test_data_json = test_data.to_dict(orient='records')
    
    # Return the test data as JSON
    return jsonify(test_data_json)


@app.route('/open_train_data', methods=['GET'])
def open_train_data():
    try:
        # Command to open the Excel file on Windows
        os.system(f'start excel "{train_file_path}"')  # Ensure that `train_file_path` points to data_x.xlsx
    except Exception as e:
        # Log the error or handle it silently if needed
        print(f"Error opening training data file: {str(e)}")
        return jsonify({'error': 'Failed to open training data file.'}), 500  # Return a proper error response
    return jsonify({'message': 'Training data file opened successfully.'})  # Return success message


# Route to open test data Excel file using cmd
@app.route('/open_test_data', methods=['GET'])
def open_test_data():
    try:
        # Command to open the Excel file on Windows
        os.system(f'start excel "{test_file_path}"')  # Ensure that `test_file_path` points to data_uji.xlsx
    except Exception as e:
        # Log the error or handle it silently if needed
        print(f"Error opening test data file: {str(e)}")
        return jsonify({'error': 'Failed to open test data file.'}), 500  # Return a proper error response
    return jsonify({'message': 'Test data file opened successfully.'})  # Return success message


if __name__ == '__main__':
    app.run(debug=True)
