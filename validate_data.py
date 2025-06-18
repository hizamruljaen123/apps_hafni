#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Data Validation Script
Script untuk memvalidasi dan membersihkan data sebelum training
"""

import pandas as pd
import numpy as np
from sklearn.impute import SimpleImputer
import sys
import os

# Add the web directory to sys.path to import config
sys.path.append(os.path.join(os.path.dirname(__file__), 'web'))

try:
    from config import FEATURE_MAPPING, FEATURE_NAMES
except ImportError:
    print("Warning: Could not import config, using fallback mappings")
    FEATURE_MAPPING = {
        'pendapatan': {'ranges': [(0, 1000000, 1), (1000000, 2000000, 2), (2000000, 3000000, 3), (3000000, 4000000, 4), (4000000, float('inf'), 5)]},
        'jenis_kelamin': {'Laki-laki': 1, 'Perempuan': 0},
        'air_bersih': {'Buruk': 1, 'Cukup': 2, 'Baik': 3, 'Sangat Baik': 4},
        'kondisi_sanitasi': {'Buruk': 1, 'Cukup': 2, 'Baik': 3, 'Sangat Baik': 4},
        'susu_formula': {'Tidak': 0, 'Ya': 1},
        'status_stunting': {'Tidak': 0, 'Ya': 1}
    }
    FEATURE_NAMES = ['pendapatan', 'tinggi', 'berat', 'jenis_kelamin', 'air_bersih', 'kondisi_sanitasi', 'susu_formula']

def validate_excel_data():
    """Validate and clean Excel data files"""
    print("=" * 60)
    print("DATA VALIDATION AND CLEANING")
    print("=" * 60)
    
    files_to_check = ['data_latih.xlsx', 'data_uji_y.xlsx']
    
    for file_name in files_to_check:
        print(f"\n📁 Checking {file_name}...")
        
        try:
            # Load data
            df = pd.read_excel(file_name)
            print(f"  ✓ File loaded successfully: {df.shape}")
            
            # Check columns
            print(f"  📋 Columns: {list(df.columns)}")
            
            # Check missing values
            missing_values = df.isnull().sum()
            if missing_values.any():
                print(f"  ⚠️  Missing values found:")
                for col, count in missing_values[missing_values > 0].items():
                    print(f"    - {col}: {count} missing ({count/len(df)*100:.1f}%)")
            else:
                print(f"  ✓ No missing values found")
            
            # Check data types
            print(f"  📊 Data types:")
            for col, dtype in df.dtypes.items():
                print(f"    - {col}: {dtype}")
            
            # Check unique values for categorical columns
            categorical_cols = ['jenis_kelamin', 'air_bersih', 'kondisi_sanitasi', 'susu_formula', 'status_stunting']
            for col in categorical_cols:
                if col in df.columns:
                    unique_vals = df[col].unique()
                    print(f"  🏷️  {col} unique values: {unique_vals}")
                    
                    # Check for unexpected values
                    if col in FEATURE_MAPPING:
                        expected_vals = list(FEATURE_MAPPING[col].keys()) if isinstance(FEATURE_MAPPING[col], dict) else None
                        if expected_vals:
                            unexpected = [val for val in unique_vals if val not in expected_vals and pd.notna(val)]
                            if unexpected:
                                print(f"    ⚠️  Unexpected values in {col}: {unexpected}")
            
            # Check numerical ranges
            numerical_cols = ['pendapatan', 'tinggi', 'berat', 'usia']
            for col in numerical_cols:
                if col in df.columns:
                    print(f"  📈 {col} range: {df[col].min():.2f} - {df[col].max():.2f}")
                    if df[col].min() < 0:
                        print(f"    ⚠️  Warning: Negative values found in {col}")
            
            # Clean and save data
            print(f"  🧹 Cleaning data...")
            df_cleaned = clean_dataframe(df)
            
            # Save cleaned data
            output_file = f"cleaned_{file_name}"
            df_cleaned.to_excel(output_file, index=False)
            print(f"  ✓ Cleaned data saved to: {output_file}")
            
        except Exception as e:
            print(f"  ❌ Error processing {file_name}: {e}")

def clean_dataframe(df):
    """Clean a single dataframe"""
    df_clean = df.copy()
    
    # Handle missing values in numerical columns
    numerical_cols = ['pendapatan', 'tinggi', 'berat', 'usia']
    for col in numerical_cols:
        if col in df_clean.columns and df_clean[col].isnull().any():
            median_val = df_clean[col].median()
            df_clean[col].fillna(median_val, inplace=True)
            print(f"    - Filled {col} missing values with median: {median_val}")
    
    # Handle missing values in categorical columns
    categorical_cols = ['jenis_kelamin', 'air_bersih', 'kondisi_sanitasi', 'susu_formula', 'status_stunting']
    for col in categorical_cols:
        if col in df_clean.columns and df_clean[col].isnull().any():
            mode_val = df_clean[col].mode()[0] if not df_clean[col].mode().empty else 'Unknown'
            df_clean[col].fillna(mode_val, inplace=True)
            print(f"    - Filled {col} missing values with mode: {mode_val}")
    
    # Remove rows with all missing values
    before_len = len(df_clean)
    df_clean.dropna(how='all', inplace=True)
    after_len = len(df_clean)
    if before_len != after_len:
        print(f"    - Removed {before_len - after_len} completely empty rows")
    
    # Handle negative values
    for col in ['pendapatan', 'tinggi', 'berat', 'usia']:
        if col in df_clean.columns:
            negative_count = (df_clean[col] < 0).sum()
            if negative_count > 0:
                df_clean[col] = df_clean[col].abs()
                print(f"    - Converted {negative_count} negative values to positive in {col}")
    
    return df_clean

def test_preprocessing():
    """Test the preprocessing functions"""
    print("\n🧪 Testing preprocessing functions...")
    
    try:
        # Load cleaned data
        df_latih = pd.read_excel('cleaned_data_latih.xlsx')
        
        # Test preprocessing
        sys.path.append('web')
        from main import preprocess_data, map_pendapatan
        
        print("  📊 Testing preprocessing on training data...")
        X = preprocess_data(df_latih)
        print(f"    - Input shape: {df_latih.shape}")
        print(f"    - Output shape: {X.shape}")
        print(f"    - Features: {list(X.columns)}")
        print(f"    - Contains NaN: {X.isnull().any().any()}")
        print(f"    - Data types: {X.dtypes.to_dict()}")
        
        # Test specific functions
        print("  🔢 Testing pendapatan mapping...")
        test_values = [500000, 1500000, 2500000, 3500000, 5000000, np.nan, -100000, 'invalid']
        for val in test_values:
            try:
                mapped = map_pendapatan(val)
                print(f"    - {val} -> {mapped}")
            except Exception as e:
                print(f"    - {val} -> Error: {e}")
        
        print("  ✅ Preprocessing test completed successfully!")
        
    except Exception as e:
        print(f"  ❌ Preprocessing test failed: {e}")

def generate_summary_report():
    """Generate a summary report of data quality"""
    print("\n📋 GENERATING SUMMARY REPORT...")
    
    report = []
    report.append("# Data Quality Report")
    report.append(f"Generated on: {pd.Timestamp.now()}")
    report.append("")
    
    files = ['data_latih.xlsx', 'data_uji_y.xlsx']
    
    for file_name in files:
        try:
            df = pd.read_excel(file_name)
            report.append(f"## {file_name}")
            report.append(f"- Shape: {df.shape}")
            report.append(f"- Missing values: {df.isnull().sum().sum()}")
            report.append(f"- Duplicate rows: {df.duplicated().sum()}")
            report.append("")
            
            # Missing values by column
            missing = df.isnull().sum()
            if missing.any():
                report.append("### Missing Values by Column:")
                for col, count in missing[missing > 0].items():
                    report.append(f"- {col}: {count} ({count/len(df)*100:.1f}%)")
                report.append("")
            
        except Exception as e:
            report.append(f"## {file_name}")
            report.append(f"- Error: {e}")
            report.append("")
    
    # Save report
    with open('data_quality_report.md', 'w', encoding='utf-8') as f:
        f.write('\n'.join(report))
    
    print("  ✓ Report saved to: data_quality_report.md")

if __name__ == "__main__":
    validate_excel_data()
    test_preprocessing()
    generate_summary_report()
    
    print("\n" + "=" * 60)
    print("VALIDATION COMPLETED!")
    print("=" * 60)
    print("Next steps:")
    print("1. Review the cleaned data files (cleaned_*.xlsx)")
    print("2. Check the data quality report (data_quality_report.md)")
    print("3. Run the Flask application to test with cleaned data")
    print("4. If issues persist, check the preprocessing functions in main.py")
