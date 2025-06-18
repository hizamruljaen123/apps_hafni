#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Excel to MySQL Insert Generator
Script untuk membaca data Excel dan generate INSERT statements MySQL
"""

import pandas as pd
import mysql.connector
from mysql.connector import Error
import os
from datetime import datetime

# Database configuration
DB_CONFIG = {
    'host': 'localhost',
    'database': 'stunting_db',
    'user': 'root',
    'password': '',  # Ganti dengan password MySQL Anda
    'port': 3306
}

def create_connection():
    """Membuat koneksi ke MySQL database"""
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        if connection.is_connected():
            print(f"✓ Berhasil terhubung ke MySQL database: {DB_CONFIG['database']}")
            return connection
    except Error as e:
        print(f"❌ Error koneksi ke MySQL: {e}")
        return None

def generate_insert_statements():
    """Generate INSERT statements dari file Excel"""
    try:
        # Load data dari Excel files
        print("📂 Loading Excel files...")
        df_latih = pd.read_excel('data_latih.xlsx')
        df_uji_y = pd.read_excel('data_uji_y.xlsx')
        
        print(f"✓ data_latih.xlsx loaded: {df_latih.shape}")
        print(f"✓ data_uji_y.xlsx loaded: {df_uji_y.shape}")
        
        # Generate INSERT statements
        insert_statements = []
        
        # INSERT untuk data_latih
        print("\n📝 Generating INSERT statements for data_latih...")
        for index, row in df_latih.iterrows():
            insert_sql = f"""INSERT INTO data_latih (nama, usia, jenis_kelamin, pendapatan, tinggi, berat, air_bersih, kondisi_sanitasi, susu_formula, status_stunting) VALUES ('{row['Nama']}', {row['usia']}, '{row['jenis_kelamin']}', {row['pendapatan']}, {row['tinggi']}, {row['berat']}, '{row['air_bersih']}', '{row['kondisi_sanitasi']}', '{row['susu_formula']}', '{row['status_stunting']}');"""
            insert_statements.append(insert_sql)
        
        # INSERT untuk data_uji_y
        print("📝 Generating INSERT statements for data_uji_y...")
        for index, row in df_uji_y.iterrows():
            insert_sql = f"""INSERT INTO data_uji_y (nama_keluarga, usia, jenis_kelamin, pendapatan, tinggi, berat, air_bersih, kondisi_sanitasi, susu_formula, status_stunting) VALUES ('{row['nama_keluarga']}', {row['usia']}, '{row['jenis_kelamin']}', {row['pendapatan']}, {row['tinggi']}, {row['berat']}, '{row['air_bersih']}', '{row['kondisi_sanitasi']}', '{row['susu_formula']}', '{row['status_stunting']}');"""
            insert_statements.append(insert_sql)
        
        # Save to SQL file
        output_file = 'insert_data_stunting.sql'
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write("-- MySQL INSERT Statements Generated from Excel Files\n")
            f.write(f"-- Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write("-- Source files: data_latih.xlsx, data_uji_y.xlsx\n\n")
            f.write("USE stunting_db;\n\n")
            f.write("-- Clear existing data\n")
            f.write("DELETE FROM data_uji_y;\n")
            f.write("DELETE FROM data_latih;\n\n")
            f.write("-- Insert data_latih\n")
            
            # Write INSERT statements
            for stmt in insert_statements:
                f.write(stmt + '\n')
        
        print(f"✓ INSERT statements saved to: {output_file}")
        print(f"✓ Total statements: {len(insert_statements)}")
        
        return insert_statements, output_file
        
    except Exception as e:
        print(f"❌ Error generating INSERT statements: {e}")
        return [], None

def execute_insert_statements(connection, statements):
    """Execute INSERT statements ke database"""
    try:
        cursor = connection.cursor()
        
        # Clear existing data
        print("🗑️ Clearing existing data...")
        cursor.execute("DELETE FROM data_uji_y")
        cursor.execute("DELETE FROM data_latih")
        connection.commit()
        
        # Execute INSERT statements
        success_count = 0
        error_count = 0
        
        print("📥 Executing INSERT statements...")
        for i, stmt in enumerate(statements):
            try:
                cursor.execute(stmt)
                success_count += 1
                if (i + 1) % 100 == 0:
                    print(f"   ✓ Processed {i + 1}/{len(statements)} statements")
            except Exception as e:
                print(f"   ❌ Error on statement {i + 1}: {e}")
                error_count += 1
        
        connection.commit()
        cursor.close()
        
        print(f"✓ Data import completed!")
        print(f"  Success: {success_count}")
        print(f"  Errors: {error_count}")
        
        return success_count, error_count
        
    except Exception as e:
        print(f"❌ Error executing INSERT statements: {e}")
        return 0, len(statements)

def verify_data(connection):
    """Verify imported data"""
    try:
        cursor = connection.cursor()
        
        # Count records
        cursor.execute("SELECT COUNT(*) FROM data_latih")
        count_latih = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM data_uji_y")
        count_uji = cursor.fetchone()[0]
        
        print(f"\n📊 Data Verification:")
        print(f"  data_latih records: {count_latih}")
        print(f"  data_uji_y records: {count_uji}")
        print(f"  Total records: {count_latih + count_uji}")
        
        # Sample data
        print(f"\n📋 Sample data from data_latih:")
        cursor.execute("SELECT * FROM data_latih LIMIT 3")
        for row in cursor.fetchall():
            print(f"  {row}")
        
        print(f"\n📋 Sample data from data_uji_y:")
        cursor.execute("SELECT * FROM data_uji_y LIMIT 3")
        for row in cursor.fetchall():
            print(f"  {row}")
        
        cursor.close()
        
    except Exception as e:
        print(f"❌ Error verifying data: {e}")

def main():
    """Main function"""
    print("=" * 60)
    print("EXCEL TO MYSQL INSERT GENERATOR")
    print("=" * 60)
    
    # Generate INSERT statements
    statements, output_file = generate_insert_statements()
    
    if not statements:
        print("❌ Failed to generate INSERT statements")
        return
    
    # Ask user if they want to execute the statements
    response = input(f"\n🤔 Do you want to execute {len(statements)} INSERT statements to MySQL? (y/n): ")
    
    if response.lower() == 'y':
        # Connect to database
        connection = create_connection()
        if not connection:
            print("❌ Cannot connect to database")
            return
        
        try:
            # Execute statements
            success, errors = execute_insert_statements(connection, statements)
            
            # Verify data
            verify_data(connection)
            
        finally:
            if connection and connection.is_connected():
                connection.close()
                print("\n✓ Database connection closed")
    
    else:
        print(f"📄 INSERT statements saved to: {output_file}")
        print("   You can execute them manually using MySQL client")

if __name__ == "__main__":
    print("⚠️  IMPORTANT:")
    print("1. Make sure MySQL server is running")
    print("2. Database 'stunting_db' exists")
    print("3. Schema has been created (run mysql_schema_optimized.sql)")
    print("4. Update DB_CONFIG in this script with your MySQL credentials")
    print("5. Required packages: pip install mysql-connector-python pandas openpyxl")
    
    response = input("\nContinue? (y/n): ")
    if response.lower() == 'y':
        main()
    else:
        print("Operation cancelled.")
