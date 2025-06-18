# MySQL Setup Guide untuk Aplikasi Stunting Prediction

## 📋 Prerequisites

1. **MySQL Server** (8.0+ recommended)
2. **Python packages**:
   ```bash
   pip install mysql-connector-python pandas openpyxl flask scikit-learn
   ```

## 🚀 Setup Instructions

### 1. Install MySQL Server

**Windows:**
- Download MySQL Installer from [official website](https://dev.mysql.com/downloads/mysql/)
- Install MySQL Server dengan konfigurasi default
- Catat username dan password yang Anda buat

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install mysql-server
sudo mysql_secure_installation
```

### 2. Create Database

Login ke MySQL dan buat database:

```sql
-- Login ke MySQL
mysql -u root -p

-- Buat database
CREATE DATABASE stunting_db;
USE stunting_db;

-- Verifikasi database
SHOW DATABASES;
```

### 3. Create Tables

Jalankan schema MySQL:

```bash
# Dari direktori utama project
mysql -u root -p stunting_db < mysql_schema_optimized.sql
```

Atau copy-paste isi file `mysql_schema_optimized.sql` ke MySQL client.

### 4. Update Configuration

Edit file `web/config.py`:

```python
DATABASE_CONFIG = {
    'host': 'localhost',
    'database': 'stunting_db',
    'user': 'root',
    'password': 'YOUR_MYSQL_PASSWORD',  # Update ini
    'port': 3306,
    'charset': 'utf8mb4',
    'collation': 'utf8mb4_unicode_ci'
}
```

### 5. Import Data Excel ke MySQL

**Option 1: Menggunakan Script Generator**
```bash
python excel_to_mysql_generator.py
```

**Option 2: Menggunakan Web Interface**
1. Jalankan aplikasi Flask: `python web/main.py`
2. Buka browser ke `http://localhost:5000/database`
3. Klik "Import Excel Data to MySQL"

**Option 3: Manual SQL**
```bash
mysql -u root -p stunting_db < insert_data_stunting.sql
```

### 6. Verify Setup

```sql
-- Cek data di tabel
USE stunting_db;

SELECT COUNT(*) FROM data_latih;
SELECT COUNT(*) FROM data_uji_y;

-- Sample data
SELECT * FROM data_latih LIMIT 5;
SELECT * FROM data_uji_y LIMIT 5;
```

## 🔧 Configuration Files

### Database Config (`web/config.py`)
- Database connection settings
- Feature mappings
- SQL queries

### Main Application (`web/main.py`)
- Flask routes
- MySQL integration
- Machine learning functions

### Templates (`web/templates/`)
- `database.html` - Database management interface
- `index.html` - Main dashboard
- `simulation.html` - Naive Bayes simulation

## 📊 Database Schema

### Table: `data_latih` (Training Data)
| Column | Type | Description |
|--------|------|-------------|
| id | INT AUTO_INCREMENT PRIMARY KEY | Unique ID |
| nama | VARCHAR(50) | Name |
| usia | BIGINT | Age |
| jenis_kelamin | ENUM('Laki-laki', 'Perempuan') | Gender |
| pendapatan | BIGINT | Income |
| tinggi | BIGINT | Height (cm) |
| berat | DECIMAL(10,2) | Weight (kg) |
| air_bersih | ENUM('Ya', 'Tidak') | Clean water access |
| kondisi_sanitasi | ENUM('Baik', 'Cukup', 'Buruk') | Sanitation condition |
| susu_formula | ENUM('Ya', 'Tidak') | Formula milk usage |
| status_stunting | ENUM('Ya', 'Tidak') | Stunting status |

### Table: `data_uji_y` (Test Data)
Same structure as `data_latih` but with `nama_keluarga` instead of `nama`.

## 🚀 Running the Application

```bash
# Navigate to web directory
cd web

# Run Flask application
python main.py
```

Access the application:
- Main Dashboard: `http://localhost:5000/`
- Database Management: `http://localhost:5000/database`
- Simulation: `http://localhost:5000/simulation`

## 🔍 API Endpoints

### Database Management
- `GET /api/database_status` - Check database connection
- `POST /api/import_excel_to_mysql` - Import Excel data
- `GET /train_data` - Get training data from MySQL
- `GET /test_data` - Get test data from MySQL

### Machine Learning
- `GET /train` - Train model using MySQL data
- `GET /test` - Test model using MySQL data
- `GET /evaluate` - Evaluate model performance
- `POST /api/simulate_naive_bayes` - Simulate prediction
- `GET /api/batch_process` - Batch processing
- `GET /api/feature_selection` - Feature selection analysis

## 🛠️ Troubleshooting

### Error: "Can't connect to MySQL server"
- Check if MySQL service is running
- Verify host, port, username, password in config
- Check firewall settings

### Error: "Access denied for user"
- Verify username and password
- Check user privileges: `GRANT ALL PRIVILEGES ON stunting_db.* TO 'root'@'localhost';`

### Error: "Table doesn't exist"
- Run the schema file: `mysql -u root -p stunting_db < mysql_schema_optimized.sql`
- Check database name is correct

### Error: "Data type mismatch"
- Check Excel file structure matches expected format
- Verify column names and data types

## 📝 File Structure

```
c:\python_apps\apps_hafni\
├── web/
│   ├── main.py                 # Flask application
│   ├── config.py               # Database configuration
│   ├── templates/
│   │   ├── index.html          # Main dashboard
│   │   ├── simulation.html     # Simulation page
│   │   └── database.html       # Database management
│   └── static/
│       ├── css/
│       └── js/
├── mysql_schema_optimized.sql  # Database schema
├── excel_to_mysql_generator.py # Data import script
├── data_latih.xlsx            # Training data
├── data_uji_y.xlsx            # Test data
└── README_MYSQL_SETUP.md      # This file
```

## 🎯 Next Steps

1. Configure your MySQL credentials in `web/config.py`
2. Run the schema file to create tables
3. Import Excel data to MySQL
4. Start the Flask application
5. Access database management interface
6. Train and test your model

## 📞 Support

If you encounter issues:

1. Check MySQL error logs: `/var/log/mysql/error.log` (Linux) or MySQL data directory (Windows)
2. Verify Python package versions: `pip list`
3. Test database connection manually using MySQL client
4. Check Flask application logs for detailed error messages

---

**Generated**: 2025-06-18  
**MySQL Version**: 8.0+  
**Python Version**: 3.8+
