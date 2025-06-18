#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script untuk menganalisis struktur data Excel dan membuat skema MySQL
Generated on: 2025-06-18
Source files: data_latih.xlsx, data_uji_y.xlsx
"""

import pandas as pd
import numpy as np
import os
from datetime import datetime

def pandas_to_mysql_type(dtype, column_name, sample_data=None):
    """
    Convert pandas dtype to MySQL data type
    """
    dtype_str = str(dtype).lower()
    
    # Check for specific column patterns first
    if 'id' in column_name.lower() and ('int' in dtype_str or 'object' in dtype_str):
        return 'INT AUTO_INCREMENT PRIMARY KEY'
    
    # Map pandas dtypes to MySQL types
    if 'int' in dtype_str:
        if 'int64' in dtype_str:
            return 'BIGINT'
        else:
            return 'INT'
    elif 'float' in dtype_str:
        return 'DECIMAL(10,2)'
    elif 'bool' in dtype_str:
        return 'BOOLEAN'
    elif 'datetime' in dtype_str:
        return 'DATETIME'
    elif 'object' in dtype_str:
        # For object type, we need to check the actual data
        if sample_data is not None:
            max_length = 0
            for val in sample_data.dropna():
                if isinstance(val, str):
                    max_length = max(max_length, len(str(val)))
            
            if max_length <= 50:
                return 'VARCHAR(50)'
            elif max_length <= 255:
                return 'VARCHAR(255)'
            else:
                return 'TEXT'
        else:
            return 'VARCHAR(255)'
    else:
        return 'TEXT'

def generate_create_table_sql(df, table_name):
    """
    Generate CREATE TABLE SQL statement from pandas DataFrame
    """
    sql = f"CREATE TABLE {table_name} (\n"
    
    columns = []
    for column in df.columns:
        # Clean column name (remove spaces, special chars)
        clean_column = column.replace(' ', '_').replace('-', '_').replace('(', '').replace(')', '')
        clean_column = ''.join(c for c in clean_column if c.isalnum() or c == '_')
        
        # Get MySQL type
        mysql_type = pandas_to_mysql_type(df[column].dtype, clean_column, df[column])
        
        # Add NOT NULL constraint for non-nullable columns (except for AUTO_INCREMENT)
        if df[column].isnull().sum() == 0 and 'AUTO_INCREMENT' not in mysql_type:
            mysql_type += ' NOT NULL'
        
        columns.append(f"    {clean_column} {mysql_type}")
    
    sql += ",\n".join(columns)
    sql += "\n);\n"
    
    return sql

def analyze_dataframe(df, name):
    """
    Analyze and display DataFrame structure
    """
    print(f"\n{'='*60}")
    print(f"ANALISIS STRUKTUR {name.upper()}")
    print(f"{'='*60}")
    
    print(f"\nShape: {df.shape}")
    print(f"\nColumn Names:")
    for i, col in enumerate(df.columns):
        print(f"  {i+1}. {col}")
    
    print(f"\nData Types:")
    print(df.dtypes)
    
    print(f"\nFirst 5 rows:")
    print(df.head())
    
    print(f"\nInfo:")
    df.info()
    
    print(f"\nNull values:")
    print(df.isnull().sum())

def main():
    """
    Main function to process Excel files and generate MySQL schema
    """
    print("=" * 60)
    print("ANALISIS STRUKTUR DATA EXCEL DAN PEMBUATAN SKEMA MYSQL")
    print("=" * 60)
    
    create_statements = []
    
    # Load data_latih.xlsx
    try:
        df_latih = pd.read_excel('data_latih.xlsx')
        print(f"✓ data_latih.xlsx loaded successfully! Shape: {df_latih.shape}")
        
        # Analyze structure
        analyze_dataframe(df_latih, "data_latih.xlsx")
        
        # Generate CREATE TABLE
        sql_latih = generate_create_table_sql(df_latih, 'data_latih')
        create_statements.append(("-- Table: data_latih", sql_latih))
        
    except Exception as e:
        print(f"❌ Error loading data_latih.xlsx: {e}")

    # Load data_uji_y.xlsx
    try:
        df_uji_y = pd.read_excel('data_uji_y.xlsx')
        print(f"✓ data_uji_y.xlsx loaded successfully! Shape: {df_uji_y.shape}")
        
        # Analyze structure
        analyze_dataframe(df_uji_y, "data_uji_y.xlsx")
        
        # Generate CREATE TABLE
        sql_uji_y = generate_create_table_sql(df_uji_y, 'data_uji_y')
        create_statements.append(("-- Table: data_uji_y", sql_uji_y))
        
    except Exception as e:
        print(f"❌ Error loading data_uji_y.xlsx: {e}")

    # Generate and display CREATE TABLE statements
    print("\n" + "=" * 60)
    print("GENERATING MySQL CREATE TABLE STATEMENTS")
    print("=" * 60)
    
    for i, (comment, sql) in enumerate(create_statements, 1):
        print(f"\n{i}. {comment}")
        print(sql)

    # Write schema to SQL file
    if create_statements:
        schema_filename = 'mysql_schema.sql'
        
        try:
            with open(schema_filename, 'w', encoding='utf-8') as f:
                # Write header
                f.write("-- MySQL Schema Generated from Excel Files\n")
                f.write(f"-- Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
                f.write("-- Source files: data_latih.xlsx, data_uji_y.xlsx\n\n")
                
                # Write database creation (optional)
                f.write("-- Create database (optional)\n")
                f.write("-- CREATE DATABASE stunting_db;\n")
                f.write("-- USE stunting_db;\n\n")
                
                # Write CREATE TABLE statements
                for comment, sql in create_statements:
                    f.write(f"{comment}\n")
                    f.write(f"{sql}\n")
            
            print(f"\n✓ Schema berhasil ditulis ke file: {schema_filename}")
            print(f"✓ File location: {os.path.abspath(schema_filename)}")
            
            # Display file content
            print(f"\n" + "="*60)
            print("CONTENT OF GENERATED SQL FILE:")
            print("="*60)
            with open(schema_filename, 'r', encoding='utf-8') as f:
                print(f.read())
                
        except Exception as e:
            print(f"❌ Error writing schema file: {e}")

if __name__ == "__main__":
    main()
