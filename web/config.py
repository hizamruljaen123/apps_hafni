# MySQL Database Configuration
# Update these settings according to your MySQL setup

# Database connection settings
DATABASE_CONFIG = {
    'host': 'localhost',
    'database': 'stunting_db',
    'user': 'root',
    'password': '',  
    'port': 3306,
    'charset': 'utf8mb4',
    'collation': 'utf8mb4_unicode_ci',
    'autocommit': True,
    'raise_on_warnings': True
}

# Application settings
APP_CONFIG = {
    'debug': True,
    'port': 5000,
    'host': '127.0.0.1'
}

# Model settings
MODEL_CONFIG = {
    'model_file': 'naive_bayes_stunting_model.pkl',
    'test_size': 0.2,
    'random_state': 42
}

# File paths (fallback jika MySQL tidak tersedia)
FILE_PATHS = {
    'train_data': '../data_latih.xlsx',
    'test_data': '../data_uji_y.xlsx'
}

# Feature mapping untuk preprocessing
FEATURE_MAPPING = {
    'pendapatan': {
        'ranges': [
            (0, 1000000, 1),
            (1000000, 2000000, 2),
            (2000000, 3000000, 3),
            (3000000, 4000000, 4),
            (4000000, float('inf'), 5)
        ]
    },
    'jenis_kelamin': {
        'Laki-laki': 1,
        'Perempuan': 0
    },
    'air_bersih': {
        'Buruk': 1,
        'Cukup': 2,
        'Baik': 3,
        'Sangat Baik': 4
    },
    'kondisi_sanitasi': {
        'Buruk': 1,
        'Cukup': 2,
        'Baik': 3,
        'Sangat Baik': 4
    },
    'susu_formula': {
        'Tidak': 0,
        'Ya': 1
    },
    'status_stunting': {
        'Tidak': 0,
        'Ya': 1
    }
}

# Feature names yang digunakan dalam model
FEATURE_NAMES = [
    'pendapatan',
    'tinggi',
    'berat',
    'jenis_kelamin',
    'air_bersih',
    'kondisi_sanitasi',
    'susu_formula'
]

# SQL Queries
SQL_QUERIES = {
    'select_train_data': """
        SELECT nama, usia, jenis_kelamin, pendapatan, tinggi, berat, 
               air_bersih, kondisi_sanitasi, susu_formula, status_stunting 
        FROM data_latih 
        ORDER BY id
    """,
    'select_test_data': """
        SELECT nama_keluarga, usia, jenis_kelamin, pendapatan, tinggi, berat, 
               air_bersih, kondisi_sanitasi, susu_formula, status_stunting 
        FROM data_uji_y 
        ORDER BY id
    """,
    'count_train_data': "SELECT COUNT(*) FROM data_latih",
    'count_test_data': "SELECT COUNT(*) FROM data_uji_y",
    'clear_train_data': "DELETE FROM data_latih",
    'clear_test_data': "DELETE FROM data_uji_y",
    'insert_train_data': """
        INSERT INTO data_latih (nama, usia, jenis_kelamin, pendapatan, tinggi, berat, 
                               air_bersih, kondisi_sanitasi, susu_formula, status_stunting) 
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """,
    'insert_test_data': """
        INSERT INTO data_uji_y (nama_keluarga, usia, jenis_kelamin, pendapatan, tinggi, berat, 
                               air_bersih, kondisi_sanitasi, susu_formula, status_stunting) 
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """
}
