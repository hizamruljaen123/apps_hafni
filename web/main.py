from flask import Flask, jsonify, render_template, request
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.naive_bayes import GaussianNB
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
from sklearn.manifold import TSNE
from sklearn.impute import SimpleImputer
from sklearn.feature_selection import RFE
import plotly.express as px
import plotly.io as pio
import plotly.graph_objects as go
import joblib
import os
import numpy as np
import math
import json

# Custom JSON encoder for NumPy data types
class NumpyEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.integer):
            return int(obj)
        elif isinstance(obj, np.floating):
            return float(obj)
        elif isinstance(obj, np.ndarray):
            return obj.tolist()
        elif isinstance(obj, np.bool_):
            return bool(obj)
        return super(NumpyEncoder, self).default(obj)

# Setup Flask app with custom JSON encoder for NumPy types
class NumpyEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.integer):
            return int(obj)
        elif isinstance(obj, np.floating):
            return float(obj)
        elif isinstance(obj, np.ndarray):
            return obj.tolist()
        elif isinstance(obj, np.bool_):
            return bool(obj)
        return super(NumpyEncoder, self).default(obj)

app = Flask(__name__)
app.json_encoder = NumpyEncoder
app.json_encoder = NumpyEncoder

# File paths
train_file_path = '../data_latih.xlsx'
test_file_path = '../data_uji_y.xlsx'

# Cek model dan melatih model jika tidak ada
def check_and_train_model():
    if not os.path.exists('naive_bayes_stunting_model.pkl'):
        try:
            print("Model tidak ditemukan, melatih model baru...")
            # Load the training data
            data = pd.read_excel(train_file_path)
            
            # Preprocess the data
            X = preprocess_data(data)
            y = data['status_stunting'].map({'Tidak': 0, 'Ya': 1})
            
            # Train Naive Bayes model
            model = GaussianNB()
            model.fit(X, y)
            
            # Save the model
            joblib.dump(model, 'naive_bayes_stunting_model.pkl')
            print("Model berhasil dilatih dan disimpan!")
        except Exception as e:
            print(f"Error melatih model: {str(e)}")
    else:
        print("Model sudah tersedia!")

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

# Feature Selection with Backward Elimination
def perform_backward_elimination(X, y, feature_names):
    """
    Perform backward elimination feature selection using Naive Bayes
    Returns selected features and their importance scores
    """
    try:
        # Initialize with all features
        n_features = X.shape[1]
        feature_scores = {}
        elimination_steps = []
        
        # Create initial model with all features
        model = GaussianNB()
        model.fit(X, y)
        
        # Get baseline accuracy with all features
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)
        baseline_accuracy = accuracy_score(y_test, y_pred)
        
        current_features = list(range(n_features))
        current_feature_names = feature_names.copy()
        
        # Step 1: Record initial state
        elimination_steps.append({
            'step': 0,
            'action': 'Initial state with all features',
            'features': current_feature_names.copy(),
            'accuracy': baseline_accuracy,
            'removed_feature': None
        })
        
        # Backward elimination process
        step = 1
        while len(current_features) > 1:
            worst_feature_idx = None
            best_accuracy = -1
            
            # Try removing each feature and see which removal gives best accuracy
            for i, feature_idx in enumerate(current_features):
                # Create feature set without this feature
                temp_features = [f for j, f in enumerate(current_features) if j != i]
                X_temp = X[:, temp_features]
                
                # Train and evaluate model
                X_train_temp, X_test_temp, y_train_temp, y_test_temp = train_test_split(
                    X_temp, y, test_size=0.2, random_state=42
                )
                
                model_temp = GaussianNB()
                model_temp.fit(X_train_temp, y_train_temp)
                y_pred_temp = model_temp.predict(X_test_temp)
                accuracy_temp = accuracy_score(y_test_temp, y_pred_temp)
                
                # If removing this feature improves or maintains accuracy, consider it
                if accuracy_temp >= best_accuracy:
                    best_accuracy = accuracy_temp
                    worst_feature_idx = i
            
            # If no improvement found, stop elimination
            if worst_feature_idx is None or best_accuracy < baseline_accuracy - 0.05:  # Allow 5% accuracy drop
                break
                
            # Remove the worst feature
            removed_feature_name = current_feature_names[worst_feature_idx]
            current_features.pop(worst_feature_idx)
            current_feature_names.pop(worst_feature_idx)
            
            # Record elimination step
            elimination_steps.append({
                'step': step,
                'action': f'Removed feature: {removed_feature_name}',
                'features': current_feature_names.copy(),
                'accuracy': best_accuracy,
                'removed_feature': removed_feature_name
            })
            
            step += 1
            
            # Update baseline for next iteration
            baseline_accuracy = best_accuracy
        
        # Calculate feature importance for remaining features
        for i, feature_name in enumerate(current_feature_names):
            # Calculate importance by measuring accuracy drop when feature is removed
            temp_features = [j for j in range(len(current_features)) if j != i]
            if len(temp_features) > 0:
                X_without_feature = X[:, [current_features[j] for j in temp_features]]
                X_train_temp, X_test_temp, y_train_temp, y_test_temp = train_test_split(
                    X_without_feature, y, test_size=0.2, random_state=42
                )
                model_temp = GaussianNB()
                model_temp.fit(X_train_temp, y_train_temp)
                y_pred_temp = model_temp.predict(X_test_temp)
                accuracy_without = accuracy_score(y_test_temp, y_pred_temp)
                
                # Importance is the accuracy drop when feature is removed
                importance = baseline_accuracy - accuracy_without
                feature_scores[feature_name] = max(0, importance)  # Ensure non-negative
            else:
                feature_scores[feature_name] = 1.0  # Only feature left, highest importance
        
        return {
            'selected_features': current_feature_names,
            'selected_feature_indices': current_features,
            'feature_scores': feature_scores,
            'elimination_steps': elimination_steps,
            'final_accuracy': baseline_accuracy
        }
        
    except Exception as e:
        print(f"Error in backward elimination: {str(e)}")
        return {
            'selected_features': feature_names,
            'selected_feature_indices': list(range(len(feature_names))),
            'feature_scores': {name: 1.0 for name in feature_names},
            'elimination_steps': [],
            'final_accuracy': 0.0
        }

def perform_backward_elimination_safe(X, y, feature_names):
    """
    Safe version of backward elimination that handles preprocessed data properly
    """
    try:
        # Ensure X and y are clean (no NaN values)
        if np.isnan(X).any():
            print("Warning: NaN values detected in X, using imputer...")
            imputer = SimpleImputer(strategy='mean')
            X = imputer.fit_transform(X)
            
        if np.isnan(y).any():
            print("Warning: NaN values detected in y, removing...")
            valid_indices = ~np.isnan(y)
            X = X[valid_indices]
            y = y[valid_indices]
        
        # Convert to appropriate data types
        X = np.array(X, dtype=np.float64)
        y = np.array(y, dtype=np.int32)
        
        # Initialize with all features
        n_features = X.shape[1]
        feature_scores = {}
        elimination_steps = []
        
        # Get baseline accuracy with all features
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
        
        # Create and train initial model
        model = GaussianNB()
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)
        baseline_accuracy = accuracy_score(y_test, y_pred)
        
        current_features = list(range(n_features))
        current_feature_names = feature_names.copy()
        
        # Step 1: Record initial state
        elimination_steps.append({
            'step': 0,
            'action': 'Initial state with all features',
            'features': current_feature_names.copy(),
            'accuracy': baseline_accuracy,
            'removed_feature': None
        })
        
        # Backward elimination process
        step = 1
        max_iterations = len(feature_names) - 1  # Prevent infinite loop
        
        while len(current_features) > 1 and step <= max_iterations:
            worst_feature_idx = None
            best_accuracy = -1
            
            # Try removing each feature and see which removal gives best accuracy
            for i, feature_idx in enumerate(current_features):
                try:
                    # Create feature set without this feature
                    temp_features = [current_features[j] for j in range(len(current_features)) if j != i]
                    X_temp = X[:, temp_features]
                    
                    # Ensure no NaN values in temporary data
                    if np.isnan(X_temp).any():
                        continue
                    
                    # Train and evaluate model
                    X_train_temp, X_test_temp, y_train_temp, y_test_temp = train_test_split(
                        X_temp, y, test_size=0.2, random_state=42, stratify=y
                    )
                    
                    model_temp = GaussianNB()
                    model_temp.fit(X_train_temp, y_train_temp)
                    y_pred_temp = model_temp.predict(X_test_temp)
                    accuracy_temp = accuracy_score(y_test_temp, y_pred_temp)
                    
                    # If removing this feature improves or maintains accuracy, consider it
                    if accuracy_temp >= best_accuracy:
                        best_accuracy = accuracy_temp
                        worst_feature_idx = i
                        
                except Exception as e:
                    print(f"Error evaluating feature {i}: {str(e)}")
                    continue
            
            # If no improvement found, stop elimination
            if worst_feature_idx is None or best_accuracy < baseline_accuracy - 0.1:  # Allow 10% accuracy drop
                break
                
            # Remove the worst feature
            removed_feature_name = current_feature_names[worst_feature_idx]
            current_features.pop(worst_feature_idx)
            current_feature_names.pop(worst_feature_idx)
            
            # Record elimination step
            elimination_steps.append({
                'step': step,
                'action': f'Removed feature: {removed_feature_name}',
                'features': current_feature_names.copy(),
                'accuracy': best_accuracy,
                'removed_feature': removed_feature_name
            })
            
            step += 1
            
            # Update baseline for next iteration
            baseline_accuracy = best_accuracy
        
        # Calculate feature importance for remaining features
        for i, feature_name in enumerate(current_feature_names):
            try:
                # Calculate importance by measuring accuracy drop when feature is removed
                if len(current_features) > 1:
                    temp_features = [current_features[j] for j in range(len(current_features)) if j != i]
                    X_without_feature = X[:, temp_features]
                    
                    if not np.isnan(X_without_feature).any():
                        X_train_temp, X_test_temp, y_train_temp, y_test_temp = train_test_split(
                            X_without_feature, y, test_size=0.2, random_state=42, stratify=y
                        )
                        model_temp = GaussianNB()
                        model_temp.fit(X_train_temp, y_train_temp)
                        y_pred_temp = model_temp.predict(X_test_temp)
                        accuracy_without = accuracy_score(y_test_temp, y_pred_temp)
                        
                        # Importance is the accuracy drop when feature is removed
                        importance = baseline_accuracy - accuracy_without
                        feature_scores[feature_name] = max(0, importance)  # Ensure non-negative
                    else:
                        feature_scores[feature_name] = 0.5  # Default moderate importance
                else:
                    feature_scores[feature_name] = 1.0  # Only feature left, highest importance
            except Exception as e:
                print(f"Error calculating importance for {feature_name}: {str(e)}")
                feature_scores[feature_name] = 0.5  # Default moderate importance
        
        return {
            'selected_features': current_feature_names,
            'selected_feature_indices': current_features,
            'feature_scores': feature_scores,
            'elimination_steps': elimination_steps,
            'final_accuracy': baseline_accuracy
        }
        
    except Exception as e:
        print(f"Error in safe backward elimination: {str(e)}")
        # Return safe defaults
        return {
            'selected_features': feature_names,
            'selected_feature_indices': list(range(len(feature_names))),
            'feature_scores': {name: 1.0 for name in feature_names},
            'elimination_steps': [{
                'step': 0,
                'action': 'Error occurred, using all features',
                'features': feature_names,
                'accuracy': 0.0,
                'removed_feature': None
            }],
            'final_accuracy': 0.0
        }

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

# Route untuk halaman simulasi
@app.route('/simulation')
def simulation():
    return render_template('simulation.html')

# API untuk mendapatkan daftar semua data training
@app.route('/api/get_train_data_list', methods=['GET'])
def get_train_data_list():
    try:
        train_data = pd.read_excel(train_file_path)
        data_list = []
        for idx, row in train_data.iterrows():
            data_list.append({
                'id': str(idx),
                'nama': row['nama_keluarga'],
                'status': row['status_stunting']
            })
        return jsonify(data_list)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# API untuk mendapatkan daftar semua data testing
@app.route('/api/get_test_data_list', methods=['GET'])
def get_test_data_list():
    try:
        test_data = pd.read_excel(test_file_path)
        data_list = []
        for idx, row in test_data.iterrows():
            data_list.append({
                'id': str(idx),
                'nama': row['nama_keluarga']
            })
        return jsonify(data_list)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# API untuk mendapatkan detail data berdasarkan ID
@app.route('/api/get_data_detail', methods=['GET'])
def get_data_detail():
    try:
        data_source = request.args.get('source', 'training')
        data_id = int(request.args.get('id', 0))
        
        if data_source == 'training':
            data = pd.read_excel(train_file_path)
        else:
            data = pd.read_excel(test_file_path)
        
        if data_id < 0 or data_id >= len(data):
            return jsonify({'error': 'Data ID tidak valid'}), 400
        
        row = data.iloc[data_id]
        data_detail = row.to_dict()
        
        return jsonify(data_detail)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# API untuk batch processing Naive Bayes
@app.route('/api/batch_process', methods=['GET'])
def batch_process():
    try:
        # Load data uji
        data = pd.read_excel(test_file_path)
        
        # Compute predictions
        result = compute_batch_predictions(data)
        
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# API untuk simulasi Naive Bayes dengan step-by-step calculation
@app.route('/api/simulate_naive_bayes', methods=['POST'])
def simulate_naive_bayes():
    try:
        # Ambil data input dari request
        input_data = request.get_json()
        
        # Load training data dan model
        train_data = pd.read_excel(train_file_path)
        model = joblib.load('naive_bayes_stunting_model.pkl')
        
        # Preprocess input data
        processed_input = preprocess_single_input(input_data)
        
        # Buat prediksi
        prediction = model.predict([list(processed_input.values())])[0]
        prediction_proba = model.predict_proba([list(processed_input.values())])[0]
        
        # Hitung step-by-step calculation
        calculation_steps = calculate_naive_bayes_steps(train_data, processed_input)
        
        # Hitung probabilitas prior
        prior_probs = calculate_prior_probabilities(train_data)
        
        # Hitung likelihood probabilities
        likelihood_probs = calculate_likelihood_probabilities(train_data, processed_input)
        
        # Generate 3D plot data
        plot_data = generate_3d_plot_data(train_data)
        
        # Detail calculations untuk tabel
        detailed_calc = calculate_detailed_probabilities(train_data, processed_input)
        
        # Perform Feature Selection Analysis (terintegrasi)
        print("Menjalankan Feature Selection...")
        X = preprocess_data(train_data)
        y = train_data['status_stunting'].map({'Tidak': 0, 'Ya': 1})
        feature_names = ['pendapatan', 'tinggi', 'berat', 'jenis_kelamin', 'air_bersih', 'kondisi_sanitasi', 'susu_formula']
        
        # Perform backward elimination
        feature_selection_results = perform_backward_elimination(X.values, y.values, feature_names)
        
        # Calculate model comparison
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        # Original model with all features
        original_model = GaussianNB()
        original_model.fit(X_train, y_train)
        y_pred_original = original_model.predict(X_test)
        original_metrics = {
            'accuracy': accuracy_score(y_test, y_pred_original),
            'precision': precision_score(y_test, y_pred_original),
            'recall': recall_score(y_test, y_pred_original),
            'f1_score': f1_score(y_test, y_pred_original)
        }
        
        # Model with selected features only
        X_selected = X.iloc[:, feature_selection_results['selected_feature_indices']]
        X_train_selected, X_test_selected, y_train_selected, y_test_selected = train_test_split(
            X_selected, y, test_size=0.2, random_state=42
        )
        
        selected_model = GaussianNB()
        selected_model.fit(X_train_selected, y_train_selected)
        y_pred_selected = selected_model.predict(X_test_selected)
        selected_metrics = {
            'accuracy': accuracy_score(y_test_selected, y_pred_selected),
            'precision': precision_score(y_test_selected, y_pred_selected),
            'recall': recall_score(y_test_selected, y_pred_selected),
            'f1_score': f1_score(y_test_selected, y_pred_selected)
        }
        
        # Prepare feature importance data for visualization
        feature_importance_data = {
            'features': list(feature_selection_results['feature_scores'].keys()),
            'scores': list(feature_selection_results['feature_scores'].values())
        }
        
        # Sort features by importance
        sorted_features = sorted(zip(feature_importance_data['features'], feature_importance_data['scores']),
                               key=lambda x: x[1], reverse=True)
        feature_importance_data['features'] = [f[0] for f in sorted_features]
        feature_importance_data['scores'] = [f[1] for f in sorted_features]
        
        # Format hasil dengan feature selection terintegrasi
        result = {
            'prediction': 'Stunting' if prediction == 1 else 'Tidak Stunting',
            'confidence': float(max(prediction_proba)),
            'probabilities': {
                'stunting': float(prediction_proba[1]),
                'tidak_stunting': float(prediction_proba[0])
            },
            'calculation_steps': calculation_steps,
            'prior_probabilities': prior_probs,
            'likelihood_probabilities': likelihood_probs,
            'plot_data': plot_data,
            'detailed_calculations': detailed_calc,
            'feature_selection': {
                'success': True,
                'selected_features': feature_selection_results['selected_features'],
                'eliminated_features': [f for f in feature_names if f not in feature_selection_results['selected_features']],
                'elimination_steps': feature_selection_results['elimination_steps'],
                'feature_importance': feature_importance_data,
                'original_metrics': original_metrics,
                'selected_metrics': selected_metrics,
                'improvement': {
                    'accuracy': selected_metrics['accuracy'] - original_metrics['accuracy'],
                    'precision': selected_metrics['precision'] - original_metrics['precision'],
                    'recall': selected_metrics['recall'] - original_metrics['recall'],
                    'f1_score': selected_metrics['f1_score'] - original_metrics['f1_score']
                },
                'feature_count_reduction': len(feature_names) - len(feature_selection_results['selected_features'])
            }
        }
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def preprocess_single_input(input_data):
    """Preprocess input data tunggal"""
    processed = {}
    
    # Map pendapatan
    pendapatan = float(input_data['pendapatan'])
    if pendapatan < 1000000:
        processed['pendapatan'] = 1
    elif 1000000 <= pendapatan < 2000000:
        processed['pendapatan'] = 2
    elif 2000000 <= pendapatan < 3000000:
        processed['pendapatan'] = 3
    elif 3000000 <= pendapatan < 4000000:
        processed['pendapatan'] = 4
    else:
        processed['pendapatan'] = 5
    
    # Map categorical variables
    processed['jenis_kelamin'] = 1 if input_data['jenis_kelamin'] == 'Laki-laki' else 0
    
    air_bersih_map = {'Buruk': 1, 'Cukup': 2, 'Baik': 3, 'Sangat Baik': 4}
    processed['air_bersih'] = air_bersih_map[input_data['air_bersih']]
    
    sanitasi_map = {'Buruk': 1, 'Cukup': 2, 'Baik': 3, 'Sangat Baik': 4}
    processed['kondisi_sanitasi'] = sanitasi_map[input_data['kondisi_sanitasi']]
    
    processed['susu_formula'] = 1 if input_data['susu_formula'] == 'Ya' else 0
    
    # Numerical values
    processed['tinggi'] = float(input_data['tinggi'])
    processed['berat'] = float(input_data['berat'])
    
    return processed

def calculate_prior_probabilities(train_data):
    """Hitung probabilitas prior"""
    total_data = len(train_data)
    stunting_count = len(train_data[train_data['status_stunting'] == 'Ya'])
    tidak_stunting_count = total_data - stunting_count
    
    return {
        'stunting': stunting_count / total_data,
        'tidak_stunting': tidak_stunting_count / total_data
    }

def calculate_likelihood_probabilities(train_data, processed_input):
    """Hitung probabilitas likelihood untuk setiap feature"""
    likelihood_probs = {}
    
    features = ['pendapatan', 'tinggi', 'berat', 'jenis_kelamin', 'air_bersih', 'kondisi_sanitasi', 'susu_formula']
    
    for feature in features:
        stunting_data = train_data[train_data['status_stunting'] == 'Ya']
        tidak_stunting_data = train_data[train_data['status_stunting'] == 'Tidak']
        
        if feature in ['tinggi', 'berat']:
            # Untuk continuous variables, gunakan Gaussian
            stunting_mean = stunting_data[feature].mean()
            stunting_std = stunting_data[feature].std()
            tidak_stunting_mean = tidak_stunting_data[feature].mean()
            tidak_stunting_std = tidak_stunting_data[feature].std()
            
            # Hitung probabilitas menggunakan probability density function
            stunting_prob = (1 / (stunting_std * math.sqrt(2 * math.pi))) * math.exp(-0.5 * ((processed_input[feature] - stunting_mean) / stunting_std) ** 2)
            tidak_stunting_prob = (1 / (tidak_stunting_std * math.sqrt(2 * math.pi))) * math.exp(-0.5 * ((processed_input[feature] - tidak_stunting_mean) / tidak_stunting_std) ** 2)
        else:
            # Untuk categorical variables
            if feature == 'pendapatan':
                # Map back pendapatan for calculation
                processed_pendapatan = processed_input[feature]
                stunting_processed = stunting_data['pendapatan'].apply(map_pendapatan)
                tidak_stunting_processed = tidak_stunting_data['pendapatan'].apply(map_pendapatan)
                
                stunting_count = len(stunting_processed[stunting_processed == processed_pendapatan])
                tidak_stunting_count = len(tidak_stunting_processed[tidak_stunting_processed == processed_pendapatan])
            else:
                feature_map = {
                    'jenis_kelamin': {'Laki-laki': 1, 'Perempuan': 0},
                    'air_bersih': {'Buruk': 1, 'Cukup': 2, 'Baik': 3, 'Sangat Baik': 4},
                    'kondisi_sanitasi': {'Buruk': 1, 'Cukup': 2, 'Baik': 3, 'Sangat Baik': 4},
                    'susu_formula': {'Tidak': 0, 'Ya': 1}
                }
                
                if feature in feature_map:
                    stunting_mapped = stunting_data[feature].map(feature_map[feature])
                    tidak_stunting_mapped = tidak_stunting_data[feature].map(feature_map[feature])
                    
                    stunting_count = len(stunting_mapped[stunting_mapped == processed_input[feature]])
                    tidak_stunting_count = len(tidak_stunting_mapped[tidak_stunting_mapped == processed_input[feature]])
                else:
                    stunting_count = len(stunting_data[stunting_data[feature] == processed_input[feature]])
                    tidak_stunting_count = len(tidak_stunting_data[tidak_stunting_data[feature] == processed_input[feature]])
            
            # Smoothing untuk menghindari zero probability
            stunting_prob = (stunting_count + 1) / (len(stunting_data) + 2)
            tidak_stunting_prob = (tidak_stunting_count + 1) / (len(tidak_stunting_data) + 2)
        
        likelihood_probs[feature] = {
            'stunting': float(stunting_prob),
            'tidak_stunting': float(tidak_stunting_prob)
        }
    
    return likelihood_probs

def calculate_naive_bayes_steps(train_data, processed_input):
    """Hitung step-by-step calculation Naive Bayes"""
    steps = []
    
    # Step 1: Prior Probabilities
    prior_probs = calculate_prior_probabilities(train_data)
    steps.append({
        'step_name': 'Menghitung Probabilitas Prior P(Y)',
        'description': 'Menghitung probabilitas masing-masing kelas berdasarkan data training',
        'calculations': [
            {
                'label': 'P(Stunting)',
                'formula': f'P(Stunting) = {len(train_data[train_data["status_stunting"] == "Ya"])} / {len(train_data)}',
                'result': f'{prior_probs["stunting"]:.4f}'
            },
            {
                'label': 'P(Tidak Stunting)', 
                'formula': f'P(Tidak Stunting) = {len(train_data[train_data["status_stunting"] == "Tidak"])} / {len(train_data)}',
                'result': f'{prior_probs["tidak_stunting"]:.4f}'
            }
        ]
    })
    
    # Step 2: Likelihood Probabilities
    likelihood_probs = calculate_likelihood_probabilities(train_data, processed_input)
    likelihood_calcs = []
    
    for feature, probs in likelihood_probs.items():
        likelihood_calcs.append({
            'label': f'P({feature}|Stunting)',
            'formula': f'Likelihood untuk {feature} = {processed_input[feature]}',
            'result': f'{probs["stunting"]:.6f}'
        })
        likelihood_calcs.append({
            'label': f'P({feature}|Tidak Stunting)',
            'formula': f'Likelihood untuk {feature} = {processed_input[feature]}',
            'result': f'{probs["tidak_stunting"]:.6f}'
        })
    
    steps.append({
        'step_name': 'Menghitung Probabilitas Likelihood P(X|Y)',
        'description': 'Menghitung probabilitas setiap feature given class',
        'calculations': likelihood_calcs
    })
    
    # Step 3: Posterior Calculation
    # Calculate posterior probabilities
    stunting_posterior = prior_probs['stunting']
    tidak_stunting_posterior = prior_probs['tidak_stunting']
    
    for feature, probs in likelihood_probs.items():
        stunting_posterior *= probs['stunting']
        tidak_stunting_posterior *= probs['tidak_stunting']
    
    # Normalize
    total_posterior = stunting_posterior + tidak_stunting_posterior
    stunting_normalized = stunting_posterior / total_posterior
    tidak_stunting_normalized = tidak_stunting_posterior / total_posterior
    
    steps.append({
        'step_name': 'Menghitung Probabilitas Posterior P(Y|X)',
        'description': 'Menghitung probabilitas final menggunakan Theorem Bayes',
        'calculations': [
            {
                'label': 'P(Stunting|X)',
                'formula': f'P(Stunting) × ∏P(Xi|Stunting) = {stunting_posterior:.8f}',
                'result': f'{stunting_normalized:.4f}'
            },
            {
                'label': 'P(Tidak Stunting|X)',
                'formula': f'P(Tidak Stunting) × ∏P(Xi|Tidak Stunting) = {tidak_stunting_posterior:.8f}',
                'result': f'{tidak_stunting_normalized:.4f}'
            }
        ]
    })
    
    return steps

def calculate_detailed_probabilities(train_data, processed_input):
    """Hitung detail probabilitas untuk tabel"""
    detailed = {}
    likelihood_probs = calculate_likelihood_probabilities(train_data, processed_input)
    
    feature_names = {
        'pendapatan': 'Pendapatan',
        'tinggi': 'Tinggi (cm)',
        'berat': 'Berat (kg)',
        'jenis_kelamin': 'Jenis Kelamin',
        'air_bersih': 'Air Bersih',
        'kondisi_sanitasi': 'Kondisi Sanitasi',
        'susu_formula': 'Susu Formula'
    }
    
    for feature, display_name in feature_names.items():
        detailed[display_name] = {
            'input_value': processed_input[feature],
            'prob_stunting': likelihood_probs[feature]['stunting'],
            'prob_tidak_stunting': likelihood_probs[feature]['tidak_stunting']
        }
    
    return detailed

def generate_3d_plot_data(train_data):
    """Generate data untuk 3D plot"""
    stunting_data = train_data[train_data['status_stunting'] == 'Ya']
    tidak_stunting_data = train_data[train_data['status_stunting'] == 'Tidak']
    
    # Map pendapatan to numeric values
    stunting_pendapatan = stunting_data['pendapatan'].apply(map_pendapatan)
    tidak_stunting_pendapatan = tidak_stunting_data['pendapatan'].apply(map_pendapatan)
    
    plot_data = {
        'stunting': {
            'x': stunting_data['tinggi'].tolist(),
            'y': stunting_data['berat'].tolist(),
            'z': stunting_pendapatan.tolist()
        },
        'tidak_stunting': {
            'x': tidak_stunting_data['tinggi'].tolist(),
            'y': tidak_stunting_data['berat'].tolist(),
            'z': tidak_stunting_pendapatan.tolist()
        }
    }
    
    return plot_data

def generate_tsne_visualization(data, labels):
    """Generate t-SNE visualization data"""
    try:
        # Preprocessing
        X = preprocess_data(data)
        
        # Handle missing values by imputing with mean
        imputer = SimpleImputer(strategy='mean')
        X_imputed = imputer.fit_transform(X)
        
        # Apply t-SNE
        tsne = TSNE(n_components=2, random_state=42)
        X_tsne = tsne.fit_transform(X_imputed)
        
        # Prepare data for visualization
        tsne_data = {
            'stunting': {
                'x': X_tsne[labels == 1, 0].tolist(),
                'y': X_tsne[labels == 1, 1].tolist()
            },
            'tidak_stunting': {
                'x': X_tsne[labels == 0, 0].tolist(),
                'y': X_tsne[labels == 0, 1].tolist()
            }
        }
        
        return tsne_data
    except Exception as e:
        print(f"Error in t-SNE visualization: {str(e)}")
        # Return empty data if error occurs
        return {
            'stunting': {'x': [], 'y': []},
            'tidak_stunting': {'x': [], 'y': []}
        }

def compute_batch_predictions(data):
    """Compute predictions for a batch of data"""
    try:
        # Load model
        model = joblib.load('naive_bayes_stunting_model.pkl')
        
        # Prepare data
        X = preprocess_data(data)
        
        # Handle missing values (NaN)
        imputer = SimpleImputer(strategy='mean')
        X_imputed = imputer.fit_transform(X)
        
        # Make predictions
        y_pred = model.predict(X_imputed)
        y_pred_proba = model.predict_proba(X_imputed)
        
        # Map true labels
        y_true = data['status_stunting'].map({'Tidak': 0, 'Ya': 1}).values
        
        # Calculate metrics
        accuracy = accuracy_score(y_true, y_pred)
        precision = precision_score(y_true, y_pred)
        recall = recall_score(y_true, y_pred)
        f1 = f1_score(y_true, y_pred)
        cm = confusion_matrix(y_true, y_pred).tolist()
        
        # Generate t-SNE visualization
        tsne_data = generate_tsne_visualization(data, y_true)
          # Prepare results
        results = []
        for i, row in enumerate(data.iterrows()):
            idx, record = row
            results.append({
                'nama_keluarga': record['nama_keluarga'],
                'actual': 'Stunting' if y_true[i] == 1 else 'Tidak Stunting',
                'predicted': 'Stunting' if y_pred[i] == 1 else 'Tidak Stunting',
                'is_correct': bool(y_true[i] == y_pred[i]),  # Ensure it's a proper boolean
                'prob_stunting': float(y_pred_proba[i, 1]),
                'prob_tidak_stunting': float(y_pred_proba[i, 0])
            })
        
        # Prepare summary
        correct_count = sum(1 for res in results if res['is_correct'])
        total_count = len(results)
        
        summary = {
            'accuracy': accuracy,
            'precision': precision,
            'recall': recall,
            'f1_score': f1,
            'confusion_matrix': cm,
            'correct_count': correct_count,
            'total_count': total_count,
            'correct_percentage': (correct_count / total_count) * 100 if total_count > 0 else 0
        }
        
        # STEP 2: Feature Selection Analysis (setelah Naive Bayes selesai)
        print("Menjalankan Feature Selection untuk Batch Processing...")
        
        # Use the same preprocessed data from Naive Bayes step to avoid inconsistency
        feature_names = ['pendapatan', 'tinggi', 'berat', 'jenis_kelamin', 'air_bersih', 'kondisi_sanitasi', 'susu_formula']
        
        # Handle missing values properly for feature selection
        imputer_fs = SimpleImputer(strategy='mean')
        X_full_clean = imputer_fs.fit_transform(X_imputed)  # Use already processed data
        y_full = y_true  # Use already mapped labels
        
        # Perform backward elimination with clean data
        feature_selection_results = perform_backward_elimination_safe(X_full_clean, y_full, feature_names)
        
        # Calculate model comparison untuk batch (using clean data)
        X_train_batch, X_test_batch, y_train_batch, y_test_batch = train_test_split(
            X_full_clean, y_full, test_size=0.2, random_state=42, stratify=y_full
        )
        
        # Original model with all features
        original_model_batch = GaussianNB()
        original_model_batch.fit(X_train_batch, y_train_batch)
        y_pred_original_batch = original_model_batch.predict(X_test_batch)
        original_metrics_batch = {
            'accuracy': accuracy_score(y_test_batch, y_pred_original_batch),
            'precision': precision_score(y_test_batch, y_pred_original_batch, zero_division=0),
            'recall': recall_score(y_test_batch, y_pred_original_batch, zero_division=0),
            'f1_score': f1_score(y_test_batch, y_pred_original_batch, zero_division=0)
        }
        
        # Model with selected features only (if any were selected)
        if len(feature_selection_results['selected_feature_indices']) > 0:
            X_selected_batch = X_full_clean[:, feature_selection_results['selected_feature_indices']]
            X_train_selected_batch, X_test_selected_batch, y_train_selected_batch, y_test_selected_batch = train_test_split(
                X_selected_batch, y_full, test_size=0.2, random_state=42, stratify=y_full
            )
            
            selected_model_batch = GaussianNB()
            selected_model_batch.fit(X_train_selected_batch, y_train_selected_batch)
            y_pred_selected_batch = selected_model_batch.predict(X_test_selected_batch)
            selected_metrics_batch = {
                'accuracy': accuracy_score(y_test_selected_batch, y_pred_selected_batch),
                'precision': precision_score(y_test_selected_batch, y_pred_selected_batch, zero_division=0),
                'recall': recall_score(y_test_selected_batch, y_pred_selected_batch, zero_division=0),
                'f1_score': f1_score(y_test_selected_batch, y_pred_selected_batch, zero_division=0)
            }
        else:
            # If no features selected, use original metrics
            selected_metrics_batch = original_metrics_batch.copy()
        
        # Prepare feature importance data for visualization
        feature_importance_data_batch = {
            'features': list(feature_selection_results['feature_scores'].keys()),
            'scores': list(feature_selection_results['feature_scores'].values())
        }
        
        # Sort features by importance
        sorted_features_batch = sorted(zip(feature_importance_data_batch['features'], feature_importance_data_batch['scores']),
                                     key=lambda x: x[1], reverse=True)
        feature_importance_data_batch['features'] = [f[0] for f in sorted_features_batch]
        feature_importance_data_batch['scores'] = [f[1] for f in sorted_features_batch]

        return {
            'results': results,
            'summary': summary,
            'tsne_data': tsne_data,
            'feature_selection': {
                'success': True,
                'selected_features': feature_selection_results['selected_features'],
                'eliminated_features': [f for f in feature_names if f not in feature_selection_results['selected_features']],
                'elimination_steps': feature_selection_results['elimination_steps'],
                'feature_importance': feature_importance_data_batch,
                'original_metrics': original_metrics_batch,
                'selected_metrics': selected_metrics_batch,
                'improvement': {
                    'accuracy': selected_metrics_batch['accuracy'] - original_metrics_batch['accuracy'],
                    'precision': selected_metrics_batch['precision'] - original_metrics_batch['precision'],
                    'recall': selected_metrics_batch['recall'] - original_metrics_batch['recall'],
                    'f1_score': selected_metrics_batch['f1_score'] - original_metrics_batch['f1_score']
                },
                'feature_count_reduction': len(feature_names) - len(feature_selection_results['selected_features'])
            }
        }
    
    except Exception as e:
        print(f"Error in batch processing: {str(e)}")
        return {
            'error': str(e)
        }

@app.route('/analysis_by_age', methods=['GET'])
def analysis_by_age():
    """
    Analisis distribusi stunting berdasarkan usia balita.
    Mengembalikan data untuk grafik dan tabel (jumlah stunting/tidak stunting per rentang usia).
    """
    # Coba baca data hasil prediksi (data_uji_dengan_prediksi.xlsx)
    try:
        df = pd.read_excel('../data_uji_dengan_prediksi.xlsx')
    except Exception:
        try:
            df = pd.read_excel('data_uji_dengan_prediksi.xlsx')
        except Exception:
            return jsonify({'error': 'Data tidak ditemukan'}), 404

    # Pastikan kolom usia dan status_stunting_predicted ada
    if 'usia' not in df.columns or 'status_stunting_predicted' not in df.columns:
        return jsonify({'error': 'Kolom usia atau status_stunting_predicted tidak ditemukan'}), 400

    # Normalisasi label prediksi
    df['status_stunting_predicted'] = df['status_stunting_predicted'].replace({1: 'Stunting', 0: 'Tidak Stunting', 'Ya': 'Stunting', 'Tidak': 'Tidak Stunting'})

    # Buat rentang usia (misal: 0-11, 12-23, 24-35, 36-47, 48-60 bulan)
    bins = [0, 12, 24, 36, 48, 60]
    labels = ['0-11', '12-23', '24-35', '36-47', '48-60']
    df['usia_group'] = pd.cut(df['usia'], bins=bins, labels=labels, right=False, include_lowest=True)

    # Hitung jumlah stunting/tidak stunting per kelompok usia
    summary = df.groupby(['usia_group', 'status_stunting_predicted']).size().unstack(fill_value=0).reset_index()

    # Untuk grafik: data per kelompok usia
    chart_data = {
        'usia_group': summary['usia_group'].astype(str).tolist(),
        'Stunting': summary.get('Stunting', pd.Series([0]*len(summary))).tolist(),
        'Tidak Stunting': summary.get('Tidak Stunting', pd.Series([0]*len(summary))).tolist()
    }
    # Untuk tabel: data mentah
    table_data = summary.to_dict(orient='records')

    return jsonify({'chart_data': chart_data, 'table_data': table_data})

@app.route('/api/feature_selection', methods=['GET'])
def feature_selection_analysis():
    """
    Perform feature selection using backward elimination
    """
    try:
        # Load training data
        data = pd.read_excel(train_file_path)
        
        # Preprocess the data
        X = preprocess_data(data)
        y = data['status_stunting'].map({'Tidak': 0, 'Ya': 1})
        
        # Get feature names
        feature_names = ['pendapatan', 'tinggi', 'berat', 'jenis_kelamin', 'air_bersih', 'kondisi_sanitasi', 'susu_formula']
        
        # Perform backward elimination
        results = perform_backward_elimination(X.values, y.values, feature_names)
        
        # Calculate original model performance for comparison
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        # Original model with all features
        original_model = GaussianNB()
        original_model.fit(X_train, y_train)
        y_pred_original = original_model.predict(X_test)
        original_metrics = {
            'accuracy': accuracy_score(y_test, y_pred_original),
            'precision': precision_score(y_test, y_pred_original),
            'recall': recall_score(y_test, y_pred_original),
            'f1_score': f1_score(y_test, y_pred_original)
        }
        
        # Model with selected features only
        X_selected = X.iloc[:, results['selected_feature_indices']]
        X_train_selected, X_test_selected, y_train_selected, y_test_selected = train_test_split(
            X_selected, y, test_size=0.2, random_state=42
        )
        
        selected_model = GaussianNB()
        selected_model.fit(X_train_selected, y_train_selected)
        y_pred_selected = selected_model.predict(X_test_selected)
        selected_metrics = {
            'accuracy': accuracy_score(y_test_selected, y_pred_selected),
            'precision': precision_score(y_test_selected, y_pred_selected),
            'recall': recall_score(y_test_selected, y_pred_selected),
            'f1_score': f1_score(y_test_selected, y_pred_selected)
        }
        
        # Prepare feature importance data for visualization
        feature_importance_data = {
            'features': list(results['feature_scores'].keys()),
            'scores': list(results['feature_scores'].values())
        }
        
        # Sort features by importance
        sorted_features = sorted(zip(feature_importance_data['features'], feature_importance_data['scores']),
                               key=lambda x: x[1], reverse=True)
        feature_importance_data['features'] = [f[0] for f in sorted_features]
        feature_importance_data['scores'] = [f[1] for f in sorted_features]
        
        return jsonify({
            'success': True,
            'selected_features': results['selected_features'],
            'eliminated_features': [f for f in feature_names if f not in results['selected_features']],
            'elimination_steps': results['elimination_steps'],
            'feature_importance': feature_importance_data,
            'original_metrics': original_metrics,
            'selected_metrics': selected_metrics,
            'improvement': {
                'accuracy': selected_metrics['accuracy'] - original_metrics['accuracy'],
                'precision': selected_metrics['precision'] - original_metrics['precision'],
                'recall': selected_metrics['recall'] - original_metrics['recall'],
                'f1_score': selected_metrics['f1_score'] - original_metrics['f1_score']
            },
            'feature_count_reduction': len(feature_names) - len(results['selected_features'])
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    # Periksa dan latih model jika belum ada
    check_and_train_model()
    app.run(debug=True)
