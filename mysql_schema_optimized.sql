-- MySQL Schema Generated from Excel Files
-- Generated on: 2025-06-18 21:01:11
-- Source files: data_latih.xlsx, data_uji_y.xlsx

-- Create database (optional)
-- CREATE DATABASE stunting_db;
-- USE stunting_db;

-- Table: data_latih
-- Tabel data latih untuk model machine learning stunting
-- Total records: 1500
CREATE TABLE data_latih (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama VARCHAR(50) NOT NULL,
    usia BIGINT NOT NULL,
    jenis_kelamin ENUM('Laki-laki', 'Perempuan') NOT NULL,
    pendapatan BIGINT NOT NULL,
    tinggi BIGINT NOT NULL,
    berat DECIMAL(10,2) NOT NULL,
    air_bersih ENUM('Ya', 'Tidak') NOT NULL,
    kondisi_sanitasi ENUM('Baik', 'Cukup', 'Buruk') NOT NULL,
    susu_formula ENUM('Ya', 'Tidak') NOT NULL,
    status_stunting ENUM('Ya', 'Tidak') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table: data_uji_y
-- Tabel data uji untuk validasi model machine learning stunting
-- Total records: 244
CREATE TABLE data_uji_y (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama_keluarga VARCHAR(100) NOT NULL,
    usia BIGINT NOT NULL,
    jenis_kelamin ENUM('Laki-laki', 'Perempuan') NOT NULL,
    pendapatan BIGINT NOT NULL,
    tinggi DECIMAL(10,2) NOT NULL,
    berat DECIMAL(10,2) NOT NULL,
    air_bersih ENUM('Ya', 'Tidak') NOT NULL,
    kondisi_sanitasi ENUM('Baik', 'Cukup', 'Buruk') NOT NULL,
    susu_formula ENUM('Ya', 'Tidak') NOT NULL,
    status_stunting ENUM('Ya', 'Tidak') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_data_latih_usia ON data_latih(usia);
CREATE INDEX idx_data_latih_status ON data_latih(status_stunting);
CREATE INDEX idx_data_latih_jenis_kelamin ON data_latih(jenis_kelamin);

CREATE INDEX idx_data_uji_usia ON data_uji_y(usia);
CREATE INDEX idx_data_uji_status ON data_uji_y(status_stunting);
CREATE INDEX idx_data_uji_jenis_kelamin ON data_uji_y(jenis_kelamin);

-- Create view for combined analysis
CREATE VIEW v_data_stunting AS
SELECT 
    'data_latih' as source_table,
    nama as nama_lengkap,
    usia,
    jenis_kelamin,
    pendapatan,
    tinggi,
    berat,
    air_bersih,
    kondisi_sanitasi,
    susu_formula,
    status_stunting
FROM data_latih
UNION ALL
SELECT 
    'data_uji' as source_table,
    nama_keluarga as nama_lengkap,
    usia,
    jenis_kelamin,
    pendapatan,
    tinggi,
    berat,
    air_bersih,
    kondisi_sanitasi,
    susu_formula,
    status_stunting
FROM data_uji_y;

-- Sample queries for analysis
-- 1. Total data per kategori stunting
-- SELECT status_stunting, COUNT(*) as jumlah FROM v_data_stunting GROUP BY status_stunting;

-- 2. Distribusi berdasarkan jenis kelamin
-- SELECT jenis_kelamin, status_stunting, COUNT(*) as jumlah 
-- FROM v_data_stunting 
-- GROUP BY jenis_kelamin, status_stunting 
-- ORDER BY jenis_kelamin, status_stunting;

-- 3. Rata-rata usia berdasarkan status stunting
-- SELECT status_stunting, AVG(usia) as rata_rata_usia 
-- FROM v_data_stunting 
-- GROUP BY status_stunting;

-- 4. Distribusi kondisi sanitasi
-- SELECT kondisi_sanitasi, status_stunting, COUNT(*) as jumlah
-- FROM v_data_stunting
-- GROUP BY kondisi_sanitasi, status_stunting
-- ORDER BY kondisi_sanitasi;
