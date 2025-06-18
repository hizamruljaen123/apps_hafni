# Dokumentasi Skema Database MySQL untuk Data Stunting

## Overview
Dokumentasi ini menjelaskan struktur database MySQL yang dibuat berdasarkan analisis file Excel `data_latih.xlsx` dan `data_uji_y.xlsx` untuk sistem prediksi stunting.

## Struktur Data yang Dianalisis

### File: data_latih.xlsx
- **Total Records**: 1,500 baris
- **Kolom**: 10 kolom
- **Fungsi**: Data training untuk model machine learning

### File: data_uji_y.xlsx  
- **Total Records**: 244 baris
- **Kolom**: 10 kolom
- **Fungsi**: Data testing/validasi untuk model machine learning

## Struktur Database

### Tabel: `data_latih`
Tabel untuk menyimpan data training model stunting.

| Kolom | Tipe Data | Deskripsi |
|-------|-----------|-----------|
| `id` | INT AUTO_INCREMENT PRIMARY KEY | ID unik untuk setiap record |
| `nama` | VARCHAR(50) NOT NULL | Nama individu |
| `usia` | BIGINT NOT NULL | Usia dalam bulan/tahun |
| `jenis_kelamin` | ENUM('Laki-laki', 'Perempuan') | Jenis kelamin |
| `pendapatan` | BIGINT NOT NULL | Pendapatan keluarga |
| `tinggi` | BIGINT NOT NULL | Tinggi badan (cm) |
| `berat` | DECIMAL(10,2) NOT NULL | Berat badan (kg) |
| `air_bersih` | ENUM('Ya', 'Tidak') | Akses air bersih |
| `kondisi_sanitasi` | ENUM('Baik', 'Cukup', 'Buruk') | Kondisi sanitasi |
| `susu_formula` | ENUM('Ya', 'Tidak') | Penggunaan susu formula |
| `status_stunting` | ENUM('Ya', 'Tidak') | Status stunting (target variable) |
| `created_at` | TIMESTAMP | Waktu pembuatan record |
| `updated_at` | TIMESTAMP | Waktu update terakhir |

### Tabel: `data_uji_y`
Tabel untuk menyimpan data testing/validasi model stunting.

| Kolom | Tipe Data | Deskripsi |
|-------|-----------|-----------|
| `id` | INT AUTO_INCREMENT PRIMARY KEY | ID unik untuk setiap record |
| `nama_keluarga` | VARCHAR(100) NOT NULL | Nama keluarga |
| `usia` | BIGINT NOT NULL | Usia dalam bulan/tahun |
| `jenis_kelamin` | ENUM('Laki-laki', 'Perempuan') | Jenis kelamin |
| `pendapatan` | BIGINT NOT NULL | Pendapatan keluarga |
| `tinggi` | DECIMAL(10,2) NOT NULL | Tinggi badan (cm) |
| `berat` | DECIMAL(10,2) NOT NULL | Berat badan (kg) |
| `air_bersih` | ENUM('Ya', 'Tidak') | Akses air bersih |
| `kondisi_sanitasi` | ENUM('Baik', 'Cukup', 'Buruk') | Kondisi sanitasi |
| `susu_formula` | ENUM('Ya', 'Tidak') | Penggunaan susu formula |
| `status_stunting` | ENUM('Ya', 'Tidak') | Status stunting (target variable) |
| `created_at` | TIMESTAMP | Waktu pembuatan record |
| `updated_at` | TIMESTAMP | Waktu update terakhir |

## Fitur Optimisasi

### 1. Primary Key dan Auto Increment
- Setiap tabel memiliki kolom `id` sebagai primary key dengan auto increment
- Memudahkan referensi dan tracking data

### 2. Penggunaan ENUM
- Kolom dengan nilai terbatas menggunakan tipe ENUM untuk:
  - Menghemat storage space
  - Memastikan data consistency
  - Meningkatkan performance query

### 3. Indexes
```sql
-- Indexes untuk performa query yang lebih baik
CREATE INDEX idx_data_latih_usia ON data_latih(usia);
CREATE INDEX idx_data_latih_status ON data_latih(status_stunting);
CREATE INDEX idx_data_latih_jenis_kelamin ON data_latih(jenis_kelamin);

CREATE INDEX idx_data_uji_usia ON data_uji_y(usia);
CREATE INDEX idx_data_uji_status ON data_uji_y(status_stunting);
CREATE INDEX idx_data_uji_jenis_kelamin ON data_uji_y(jenis_kelamin);
```

### 4. View untuk Analisis Gabungan
```sql
-- View untuk analisis data gabungan dari kedua tabel
CREATE VIEW v_data_stunting AS
SELECT 
    'data_latih' as source_table,
    nama as nama_lengkap,
    usia, jenis_kelamin, pendapatan, tinggi, berat,
    air_bersih, kondisi_sanitasi, susu_formula, status_stunting
FROM data_latih
UNION ALL
SELECT 
    'data_uji' as source_table,
    nama_keluarga as nama_lengkap,
    usia, jenis_kelamin, pendapatan, tinggi, berat,
    air_bersih, kondisi_sanitasi, susu_formula, status_stunting
FROM data_uji_y;
```

## Contoh Query Analisis

### 1. Distribusi Status Stunting
```sql
SELECT status_stunting, COUNT(*) as jumlah 
FROM v_data_stunting 
GROUP BY status_stunting;
```

### 2. Analisis berdasarkan Jenis Kelamin
```sql
SELECT jenis_kelamin, status_stunting, COUNT(*) as jumlah 
FROM v_data_stunting 
GROUP BY jenis_kelamin, status_stunting 
ORDER BY jenis_kelamin, status_stunting;
```

### 3. Rata-rata Usia per Status Stunting
```sql
SELECT status_stunting, AVG(usia) as rata_rata_usia 
FROM v_data_stunting 
GROUP BY status_stunting;
```

### 4. Pengaruh Kondisi Sanitasi
```sql
SELECT kondisi_sanitasi, status_stunting, COUNT(*) as jumlah
FROM v_data_stunting
GROUP BY kondisi_sanitasi, status_stunting
ORDER BY kondisi_sanitasi;
```

## Files yang Dibuat

1. **`mysql_schema.sql`** - Skema basic yang dihasilkan otomatis
2. **`mysql_schema_optimized.sql`** - Skema yang dioptimasi dengan fitur tambahan
3. **`analyze_excel_structure.py`** - Script Python untuk analisis struktur data
4. **`analyze_excel_structure.ipynb`** - Jupyter notebook untuk analisis interaktif

## Penggunaan

1. **Setup Database:**
   ```sql
   CREATE DATABASE stunting_db;
   USE stunting_db;
   SOURCE mysql_schema_optimized.sql;
   ```

2. **Import Data:**
   - Gunakan tools seperti MySQL Workbench atau phpMyAdmin
   - Atau buat script Python untuk import dari Excel ke MySQL

3. **Analisis Data:**
   - Gunakan query contoh yang disediakan
   - Gunakan view `v_data_stunting` untuk analisis gabungan

## Catatan Penting

- Tipe data disesuaikan berdasarkan analisis actual data
- ENUM values disesuaikan dengan nilai unik yang ditemukan di data
- Index dibuat pada kolom yang sering digunakan untuk filtering
- View memudahkan analisis data gabungan dari kedua tabel
