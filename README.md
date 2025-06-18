# MySQL Schema Generator untuk Data Stunting

Proyek ini berisi scripts dan file yang dihasilkan dari analisis struktur data Excel untuk membuat skema database MySQL yang akan digunakan untuk sistem prediksi stunting.

## 📁 File Structure

```
├── data_latih.xlsx                    # File Excel data training (1500 records)
├── data_uji_y.xlsx                   # File Excel data testing (244 records)
├── analyze_excel_structure.py        # Script Python untuk analisis struktur data
├── analyze_excel_structure.ipynb     # Jupyter Notebook untuk analisis interaktif
├── mysql_schema.sql                  # Skema MySQL basic yang dihasilkan otomatis
├── mysql_schema_optimized.sql        # Skema MySQL yang telah dioptimasi
├── import_excel_to_mysql.py          # Script untuk import data Excel ke MySQL
├── DATABASE_SCHEMA_DOCUMENTATION.md  # Dokumentasi lengkap skema database
└── README.md                         # File ini
```

## 🚀 Quick Start

### 1. Analisis Struktur Data
Jalankan script untuk menganalisis struktur data Excel:

```bash
python analyze_excel_structure.py
```

Script ini akan:
- Membaca file `data_latih.xlsx` dan `data_uji_y.xlsx`
- Menganalisis struktur data (kolom, tipe data, nilai unik)
- Generate skema MySQL CREATE TABLE
- Menyimpan skema ke file `mysql_schema.sql`

### 2. Setup Database MySQL

#### Buat Database:
```sql
CREATE DATABASE stunting_db;
USE stunting_db;
```

#### Jalankan Skema Optimized:
```bash
mysql -u root -p stunting_db < mysql_schema_optimized.sql
```

### 3. Import Data (Opsional)

Untuk mengimpor data Excel ke MySQL:

1. Install dependencies:
```bash
pip install mysql-connector-python pandas openpyxl
```

2. Edit konfigurasi database di `import_excel_to_mysql.py`:
```python
DB_CONFIG = {
    'host': 'localhost',
    'database': 'stunting_db',
    'user': 'root',
    'password': 'your_password',  # Ganti dengan password MySQL Anda
    'port': 3306
}
```

3. Jalankan script import:
```bash
python import_excel_to_mysql.py
```

## 📊 Struktur Data

### Data Training (`data_latih.xlsx`)
- **Records**: 1,500 baris
- **Kolom**: 10 kolom
- **Fungsi**: Data untuk training model machine learning

### Data Testing (`data_uji_y.xlsx`)
- **Records**: 244 baris  
- **Kolom**: 10 kolom
- **Fungsi**: Data untuk testing/validasi model

### Kolom Data:
| Kolom | Deskripsi | Tipe Data |
|-------|-----------|-----------|
| nama/nama_keluarga | Identitas | VARCHAR |
| usia | Usia dalam tahun | INT |
| jenis_kelamin | Laki-laki/Perempuan | ENUM |
| pendapatan | Pendapatan keluarga | BIGINT |
| tinggi | Tinggi badan (cm) | INT/DECIMAL |
| berat | Berat badan (kg) | DECIMAL |
| air_bersih | Akses air bersih (Ya/Tidak) | ENUM |
| kondisi_sanitasi | Baik/Cukup/Buruk | ENUM |
| susu_formula | Penggunaan susu formula (Ya/Tidak) | ENUM |
| status_stunting | Target variable (Ya/Tidak) | ENUM |

## 🎯 Fitur Skema Database

### Skema Basic (`mysql_schema.sql`)
- CREATE TABLE statements sesuai struktur data asli
- Mapping otomatis tipe data pandas ke MySQL
- Constraint NOT NULL untuk kolom non-nullable

### Skema Optimized (`mysql_schema_optimized.sql`)
- ✅ Primary Key dengan AUTO_INCREMENT
- ✅ Penggunaan ENUM untuk data kategorikal
- ✅ Timestamp fields (created_at, updated_at)
- ✅ Indexes untuk performa query
- ✅ View gabungan untuk analisis
- ✅ Sample queries untuk analisis data

### Optimisasi yang Ditambahkan:

1. **Primary Keys & Auto Increment**
   ```sql
   id INT AUTO_INCREMENT PRIMARY KEY
   ```

2. **ENUM untuk Data Kategorikal**
   ```sql
   jenis_kelamin ENUM('Laki-laki', 'Perempuan')
   status_stunting ENUM('Ya', 'Tidak')
   kondisi_sanitasi ENUM('Baik', 'Cukup', 'Buruk')
   ```

3. **Indexes untuk Performance**
   ```sql
   CREATE INDEX idx_data_latih_usia ON data_latih(usia);
   CREATE INDEX idx_data_latih_status ON data_latih(status_stunting);
   ```

4. **View untuk Analisis Gabungan**
   ```sql
   CREATE VIEW v_data_stunting AS ...
   ```

## 📈 Contoh Query Analisis

### Distribusi Status Stunting
```sql
SELECT status_stunting, COUNT(*) as jumlah 
FROM v_data_stunting 
GROUP BY status_stunting;
```

### Analisis berdasarkan Jenis Kelamin
```sql
SELECT jenis_kelamin, status_stunting, COUNT(*) as jumlah 
FROM v_data_stunting 
GROUP BY jenis_kelamin, status_stunting;
```

### Pengaruh Kondisi Sanitasi
```sql
SELECT kondisi_sanitasi, status_stunting, COUNT(*) as jumlah
FROM v_data_stunting
GROUP BY kondisi_sanitasi, status_stunting;
```

## 🛠️ Requirements

### Python Packages:
```bash
pip install pandas openpyxl numpy mysql-connector-python
```

### MySQL:
- MySQL Server 5.7+ atau MySQL 8.0+
- Database `stunting_db` (atau sesuai konfigurasi)

## 📝 Usage Notes

1. **File Excel**: Pastikan file `data_latih.xlsx` dan `data_uji_y.xlsx` ada di direktori yang sama
2. **MySQL Connection**: Update konfigurasi database sesuai setup MySQL Anda
3. **Data Types**: Skema disesuaikan berdasarkan analisis data aktual
4. **Performance**: Gunakan indexes yang telah dibuat untuk query yang lebih cepat
5. **Analysis**: Gunakan view `v_data_stunting` untuk analisis data gabungan

## 🔍 Troubleshooting

### Error "Module not found"
```bash
pip install pandas openpyxl mysql-connector-python
```

### Error "Access denied for user"
- Pastikan username/password MySQL benar
- Pastikan user memiliki permission untuk database yang digunakan

### Error "Can't connect to MySQL server"
- Pastikan MySQL server berjalan
- Cek host dan port di konfigurasi

## 📞 Support

Jika ada pertanyaan atau masalah, silakan check:
1. `DATABASE_SCHEMA_DOCUMENTATION.md` untuk dokumentasi lengkap
2. Log output dari script Python untuk error details
3. MySQL error logs untuk masalah database

---

**Generated**: 2025-06-18  
**Source Files**: data_latih.xlsx, data_uji_y.xlsx  
**Total Records**: 1,744 (1,500 training + 244 testing)
