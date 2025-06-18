/**
 * Data Validator & Error Handler
 * Utility untuk memvalidasi dan memperbaiki data sebelum ditampilkan
 */

/**
 * Memeriksa apakah nilai adalah null, undefined, atau NaN
 * @param {*} value - Nilai yang akan diperiksa
 * @return {boolean} True jika nilai invalid
 */
function isInvalidValue(value) {
    return value === null || value === undefined || 
           (typeof value === 'number' && isNaN(value));
}

/**
 * Mengembalikan nilai default jika nilai asli kosong/invalid
 * @param {*} value - Nilai asli
 * @param {*} defaultValue - Nilai default
 * @return {*} Nilai asli jika valid, defaultValue jika invalid
 */
function getValueOrDefault(value, defaultValue) {
    return isInvalidValue(value) ? defaultValue : value;
}

/**
 * Mengonversi respons API yang mungkin berformat baru atau lama
 * @param {Object} response - Respons API
 * @param {string} dataProperty - Nama properti yang berisi data utama
 * @return {Array|Object} Data yang sudah dinormalisasi
 */
function normalizeApiResponse(response, dataProperty = 'data') {
    // Handle respons null/undefined
    if (!response) return [];
    
    // Jika respons memiliki properti data, gunakan itu
    if (response[dataProperty]) {
        return response[dataProperty];
    }
    
    // Jika respons adalah array, gunakan langsung
    if (Array.isArray(response)) {
        return response;
    }
    
    // Jika tidak ada yang sesuai, kembalikan objek asli
    return response;
}

/**
 * Memvalidasi kolom numerik, handle NaN dan kosong
 * @param {*} value - Nilai numerik
 * @param {number} defaultValue - Nilai default jika kosong/NaN
 * @param {number} precision - Jumlah digit desimal
 * @return {string|number} Nilai yang sudah divalidasi
 */
function validateNumberValue(value, defaultValue = 0, precision = 1) {
    if (isInvalidValue(value)) {
        return defaultValue;
    }
    
    // Pastikan nilai adalah angka
    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
        return defaultValue;
    }
    
    // Format dengan presisi yang ditentukan
    return precision > 0 ? numValue.toFixed(precision) : numValue;
}

/**
 * Memformat data status stunting untuk konsistensi
 * @param {string} status - Status stunting asli
 * @return {string} Status yang sudah dinormalisasi
 */
function normalizeStuntingStatus(status) {
    if (!status) return 'Tidak Ada Data';
    
    const normalized = String(status).toLowerCase();
    
    if (normalized === 'ya' || normalized === '1' || normalized === 'stunting' || normalized === 'true') {
        return 'Stunting';
    } 
    
    if (normalized === 'tidak' || normalized === '0' || normalized === 'tidak stunting' || normalized === 'false') {
        return 'Tidak Stunting';
    }
    
    return status; // Kembalikan nilai asli jika tidak cocok
}

/**
 * Memeriksa dan memperbaiki data sebelum ditampilkan di tabel
 * @param {Array} data - Array data dari API
 * @return {Array} Data yang sudah dibersihkan
 */
function sanitizeTableData(data) {
    if (!Array.isArray(data)) {
        console.error('Invalid data format, expected array:', data);
        return [];
    }
    
    return data.map(item => {
        // Buat copy untuk mencegah mutasi data asli
        const sanitized = {...item};
        
        // Normalisasi nilai umum
        sanitized.usia = getValueOrDefault(item.usia, '-');
        sanitized.tinggi = validateNumberValue(item.tinggi, '-', 2);
        sanitized.berat = validateNumberValue(item.berat, '-', 2);
        sanitized.pendapatan = getValueOrDefault(item.pendapatan, '-');
        sanitized.air_bersih = getValueOrDefault(item.air_bersih, 'Tidak Ada Data');
        sanitized.kondisi_sanitasi = getValueOrDefault(item.kondisi_sanitasi, 'Tidak Ada Data');
        sanitized.susu_formula = getValueOrDefault(item.susu_formula, 'Tidak Ada Data');
        sanitized.jenis_kelamin = getValueOrDefault(item.jenis_kelamin, 'Tidak Ada Data');
        
        // Normalisasi status stunting
        if (item.status_stunting !== undefined) {
            sanitized.status_stunting = normalizeStuntingStatus(item.status_stunting);
        }
        
        if (item.status_stunting_predicted !== undefined) {
            sanitized.status_stunting_predicted = normalizeStuntingStatus(item.status_stunting_predicted);
        }
        
        return sanitized;
    });
}

// Export fungsi-fungsi untuk digunakan file lain
window.DataValidator = {
    isInvalidValue,
    getValueOrDefault,
    normalizeApiResponse,
    validateNumberValue,
    normalizeStuntingStatus,
    sanitizeTableData
};
