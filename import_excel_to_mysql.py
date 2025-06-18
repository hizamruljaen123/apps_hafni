#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script untuk mengimpor data dari Excel ke MySQL Database
Menggunakan skema yang telah dibuat sebelumnya
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
    """
    Membuat koneksi ke MySQL database
    """
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        if connection.is_connected():
            print(f"✓ Berhasil terhubung ke MySQL database: {DB_CONFIG['database']}")
            return connection
    except Error as e:
        print(f"❌ Error koneksi ke MySQL: {e}")
        return None

def import_data_latih(connection, df):
    """
    Import data dari data_latih.xlsx ke tabel data_latih
    """
    cursor = connection.cursor()
    
    # Prepare SQL statement
    insert_query = """
    INSERT INTO data_latih (
        nama, usia, jenis_kelamin, pendapatan, tinggi, berat,
        air_bersih, kondisi_sanitasi, susu_formula, status_stunting
    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """
    
    success_count = 0
    error_count = 0
    
    for index, row in df.iterrows():
        try:
            values = (
                row['Nama'],
                int(row['usia']),
                row['jenis_kelamin'],
                int(row['pendapatan']),
                int(row['tinggi']),
                float(row['berat']),
                row['air_bersih'],
                row['kondisi_sanitasi'],
                row['susu_formula'],
                row['status_stunting']
            )
            
            cursor.execute(insert_query, values)
            success_count += 1
            
        except Exception as e:
            print(f"❌ Error pada baris {index}: {e}")
            error_count += 1
    
    connection.commit()
    cursor.close()
    
    print(f"✓ Data latih imported: {success_count} berhasil, {error_count} error")
    return success_count, error_count

def import_data_uji_y(connection, df):
    """
    Import data dari data_uji_y.xlsx ke tabel data_uji_y
    """
    cursor = connection.cursor()
    
    # Prepare SQL statement
    insert_query = """
    INSERT INTO data_uji_y (
        nama_keluarga, usia, jenis_kelamin, pendapatan, tinggi, berat,
        air_bersih, kondisi_sanitasi, susu_formula, status_stunting
    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """
    
    success_count = 0
    error_count = 0
    
    for index, row in df.iterrows():
        try:
            values = (
                row['nama_keluarga'],
                int(row['usia']),
                row['jenis_kelamin'],
                int(row['pendapatan']),
                float(row['tinggi']),
                float(row['berat']),
                row['air_bersih'],
                row['kondisi_sanitasi'],
                row['susu_formula'],
                row['status_stunting']
            )
            
            cursor.execute(insert_query, values)
            success_count += 1
            
        except Exception as e:
            print(f"❌ Error pada baris {index}: {e}")
            error_count += 1
    
    connection.commit()
    cursor.close()
    
    print(f"✓ Data uji imported: {success_count} berhasil, {error_count} error")
    return success_count, error_count

def verify_import(connection):
    """
    Verifikasi hasil import data
    """
    cursor = connection.cursor()
    
    # Check data_latih
    cursor.execute("SELECT COUNT(*) FROM data_latih")
    count_latih = cursor.fetchone()[0]
    
    # Check data_uji_y
    cursor.execute("SELECT COUNT(*) FROM data_uji_y")
    count_uji = cursor.fetchone()[0]
    
    print(f"\n{'='*50}")
    print("VERIFIKASI HASIL IMPORT:")
    print(f"{'='*50}")
    print(f"Total data di tabel data_latih: {count_latih}")
    print(f"Total data di tabel data_uji_y: {count_uji}")
    
    # Sample queries
    print(f"\n--- Sample Data dari data_latih ---")
    cursor.execute("SELECT * FROM data_latih LIMIT 3")
    for row in cursor.fetchall():
        print(row)
    
    print(f"\n--- Sample Data dari data_uji_y ---")
    cursor.execute("SELECT * FROM data_uji_y LIMIT 3")
    for row in cursor.fetchall():
        print(row)
    
    # Status stunting distribution
    print(f"\n--- Distribusi Status Stunting (Gabungan) ---")
    cursor.execute("""
        SELECT status_stunting, COUNT(*) as jumlah 
        FROM v_data_stunting 
        GROUP BY status_stunting
    """)
    for row in cursor.fetchall():
        print(f"Status {row[0]}: {row[1]} orang")
    
    cursor.close()

def main():
    """
    Main function untuk import data Excel ke MySQL
    """
    print("=" * 60)
    print("IMPORT DATA EXCEL KE MYSQL DATABASE")
    print("=" * 60)
    
    # Load Excel files
    try:
        print("\n1. Loading Excel files...")
        df_latih = pd.read_excel('data_latih.xlsx')
        df_uji_y = pd.read_excel('data_uji_y.xlsx')
        print(f"✓ data_latih.xlsx loaded: {df_latih.shape}")
        print(f"✓ data_uji_y.xlsx loaded: {df_uji_y.shape}")
    except Exception as e:
        print(f"❌ Error loading Excel files: {e}")
        return
    
    # Create database connection
    print("\n2. Connecting to MySQL database...")
    connection = create_connection()
    if not connection:
        print("❌ Gagal terhubung ke database. Pastikan MySQL berjalan dan konfigurasi benar.")
        return
    
    try:
        # Clear existing data (optional)
        print("\n3. Clearing existing data...")
        cursor = connection.cursor()
        cursor.execute("DELETE FROM data_uji_y")
        cursor.execute("DELETE FROM data_latih")
        connection.commit()
        cursor.close()
        print("✓ Existing data cleared")
        
        # Import data
        print("\n4. Importing data...")
        success_latih, error_latih = import_data_latih(connection, df_latih)
        success_uji, error_uji = import_data_uji_y(connection, df_uji_y)
        
        # Verify import
        print("\n5. Verifying import...")
        verify_import(connection)
        
        print(f"\n{'='*60}")
        print("IMPORT COMPLETED!")
        print(f"{'='*60}")
        print(f"Total data latih imported: {success_latih}")
        print(f"Total data uji imported: {success_uji}")
        print(f"Total errors: {error_latih + error_uji}")
        
    except Error as e:
        print(f"❌ Database error: {e}")
    
    finally:
        if connection and connection.is_connected():
            connection.close()
            print("\n✓ Database connection closed")

if __name__ == "__main__":
    # Peringatan untuk konfigurasi database
    print("⚠️  PERHATIAN:")
    print("1. Pastikan MySQL server sudah berjalan")
    print("2. Database 'stunting_db' sudah dibuat")
    print("3. Schema MySQL sudah dijalankan (mysql_schema_optimized.sql)")
    print("4. Update konfigurasi DB_CONFIG di script ini sesuai setup MySQL Anda")
    print("5. Install required packages: pip install mysql-connector-python pandas openpyxl")
    
    response = input("\nLanjutkan import? (y/n): ")
    if response.lower() == 'y':
        main()
    else:
        print("Import dibatalkan.")
