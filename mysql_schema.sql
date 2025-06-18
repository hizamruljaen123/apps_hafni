-- MySQL Schema Generated from Excel Files
-- Generated on: 2025-06-18 21:01:11
-- Source files: data_latih.xlsx, data_uji_y.xlsx

-- Create database (optional)
-- CREATE DATABASE stunting_db;
-- USE stunting_db;

-- Table: data_latih
CREATE TABLE data_latih (
    Nama VARCHAR(50) NOT NULL,
    usia BIGINT NOT NULL,
    jenis_kelamin VARCHAR(50) NOT NULL,
    pendapatan BIGINT NOT NULL,
    tinggi BIGINT NOT NULL,
    berat DECIMAL(10,2) NOT NULL,
    air_bersih VARCHAR(50) NOT NULL,
    kondisi_sanitasi VARCHAR(50) NOT NULL,
    susu_formula VARCHAR(50) NOT NULL,
    status_stunting VARCHAR(50) NOT NULL
);

-- Table: data_uji_y
CREATE TABLE data_uji_y (
    nama_keluarga VARCHAR(50) NOT NULL,
    usia BIGINT NOT NULL,
    jenis_kelamin VARCHAR(50) NOT NULL,
    pendapatan BIGINT NOT NULL,
    tinggi DECIMAL(10,2) NOT NULL,
    berat DECIMAL(10,2) NOT NULL,
    air_bersih VARCHAR(50) NOT NULL,
    kondisi_sanitasi VARCHAR(50) NOT NULL,
    susu_formula VARCHAR(50) NOT NULL,
    status_stunting VARCHAR(50) NOT NULL
);

