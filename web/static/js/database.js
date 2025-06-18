/**
 * Database Management JavaScript
 * Menangani semua operasi CRUD dan interaksi database
 */

// Global variables
let currentTable = '';
let currentPage = 1;
let perPage = 20;
let searchQuery = '';

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    checkDatabaseStatus();
    loadDatabaseStatistics();
    
    // Setup upload form
    document.getElementById('upload-form').addEventListener('submit', handleFileUpload);
});

// Check database connection status
async function checkDatabaseStatus() {
    try {
        const response = await fetch('/api/database_status');
        const data = await response.json();
        
        const statusElement = document.getElementById('database-status');
        const connectionInfo = document.getElementById('connection-info');
        
        if (data.connected) {
            statusElement.innerHTML = '<span class="badge badge-success">Connected</span>';
            connectionInfo.innerHTML = `
                <p><strong>Host:</strong> ${data.host}</p>
                <p><strong>Database:</strong> ${data.database}</p>
                <p><strong>Connection Time:</strong> ${new Date().toLocaleString()}</p>
            `;
            
            // Load table information
            loadTableInfo();
        } else {
            statusElement.innerHTML = '<span class="badge badge-danger">Disconnected</span>';
            connectionInfo.innerHTML = `
                <p class="text-danger"><strong>Error:</strong> ${data.error}</p>
                <p class="text-muted">Using Excel files as fallback</p>
            `;
        }
    } catch (error) {
        console.error('Error checking database status:', error);
        document.getElementById('database-status').innerHTML = '<span class="badge badge-warning">Unknown</span>';
    }
}

// Load table information
async function loadTableInfo() {
    try {
        // Load data_latih info
        const latihResponse = await fetch('/api/data_latih?page=1&per_page=1');
        const latihData = await latihResponse.json();
        
        document.getElementById('table-latih-info').innerHTML = `
            <p><strong>Total Records:</strong> ${latihData.pagination.total}</p>
            <p><strong>Features:</strong> 10 columns</p>
            <p class="text-muted">Training data for ML model</p>
        `;
        
        // Load data_uji info
        const ujiResponse = await fetch('/api/data_uji?page=1&per_page=1');
        const ujiData = await ujiResponse.json();
        
        document.getElementById('table-uji-info').innerHTML = `
            <p><strong>Total Records:</strong> ${ujiData.pagination.total}</p>
            <p><strong>Features:</strong> 10 columns</p>
            <p class="text-muted">Test data for validation</p>
        `;
    } catch (error) {
        console.error('Error loading table info:', error);
        document.getElementById('table-latih-info').innerHTML = '<p class="text-danger">Error loading info</p>';
        document.getElementById('table-uji-info').innerHTML = '<p class="text-danger">Error loading info</p>';
    }
}

// Load database statistics
async function loadDatabaseStatistics() {
    try {
        const response = await fetch('/api/database_statistics');
        const data = await response.json();
        
        const statisticsHtml = `
            <div class="row">
                <div class="col-md-4">
                    <div class="card bg-light">
                        <div class="card-body text-center">
                            <h3 class="text-primary">${data.summary.total_data_latih}</h3>
                            <p class="text-muted">Data Latih</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card bg-light">
                        <div class="card-body text-center">
                            <h3 class="text-success">${data.summary.total_data_uji}</h3>
                            <p class="text-muted">Data Uji</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card bg-light">
                        <div class="card-body text-center">
                            <h3 class="text-info">${data.summary.total_combined}</h3>
                            <p class="text-muted">Total Data</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="row mt-4">
                <div class="col-md-6">
                    <h6>Status Distribution - Data Latih</h6>
                    <div class="progress mb-2">
                        <div class="progress-bar bg-danger" style="width: ${(data.status_distribution.data_latih.Ya || 0) / data.summary.total_data_latih * 100}%">
                            Stunting: ${data.status_distribution.data_latih.Ya || 0}
                        </div>
                        <div class="progress-bar bg-success" style="width: ${(data.status_distribution.data_latih.Tidak || 0) / data.summary.total_data_latih * 100}%">
                            Normal: ${data.status_distribution.data_latih.Tidak || 0}
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <h6>Status Distribution - Data Uji</h6>
                    <div class="progress mb-2">
                        <div class="progress-bar bg-danger" style="width: ${(data.status_distribution.data_uji.Ya || 0) / data.summary.total_data_uji * 100}%">
                            Stunting: ${data.status_distribution.data_uji.Ya || 0}
                        </div>
                        <div class="progress-bar bg-success" style="width: ${(data.status_distribution.data_uji.Tidak || 0) / data.summary.total_data_uji * 100}%">
                            Normal: ${data.status_distribution.data_uji.Tidak || 0}
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="row mt-4">
                <div class="col-md-12">
                    <h6>Gender Analysis</h6>
                    <div class="table-responsive">
                        <table class="table table-sm">
                            <thead>
                                <tr>
                                    <th>Jenis Kelamin</th>
                                    <th>Status Stunting</th>
                                    <th>Jumlah</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${data.gender_analysis.map(item => `
                                    <tr>
                                        <td>${item.jenis_kelamin}</td>
                                        <td><span class="badge ${item.status_stunting === 'Ya' ? 'badge-danger' : 'badge-success'}">${item.status_stunting}</span></td>
                                        <td>${item.count}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('database-statistics').innerHTML = statisticsHtml;
    } catch (error) {
        console.error('Error loading statistics:', error);
        document.getElementById('database-statistics').innerHTML = 
            '<div class="alert alert-danger">Error loading statistics</div>';
    }
}

// Show data table
async function showDataTable(tableType) {
    currentTable = tableType;
    currentPage = 1;
    searchQuery = '';
    
    document.getElementById('search-input').value = '';
    document.getElementById('data-tables-section').style.display = 'block';
    document.getElementById('table-title').textContent = 
        tableType === 'data_latih' ? 'Data Latih' : 'Data Uji';
    
    // Update form labels based on table type
    if (tableType === 'data_latih') {
        document.getElementById('nama-label').textContent = 'Nama:';
        document.getElementById('nama').name = 'nama';
    } else {
        document.getElementById('nama-label').textContent = 'Nama Keluarga:';
        document.getElementById('nama').name = 'nama_keluarga';
    }
    
    await loadTableData();
}

// Hide data table
function hideDataTable() {
    document.getElementById('data-tables-section').style.display = 'none';
}

// Load table data
async function loadTableData() {
    try {
        const url = `/api/${currentTable}?page=${currentPage}&per_page=${perPage}&search=${encodeURIComponent(searchQuery)}`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        // Generate table headers
        const headers = currentTable === 'data_latih' 
            ? ['ID', 'Nama', 'Usia', 'Jenis Kelamin', 'Pendapatan', 'Tinggi', 'Berat', 'Air Bersih', 'Kondisi Sanitasi', 'Susu Formula', 'Status Stunting', 'Actions']
            : ['ID', 'Nama Keluarga', 'Usia', 'Jenis Kelamin', 'Pendapatan', 'Tinggi', 'Berat', 'Air Bersih', 'Kondisi Sanitasi', 'Susu Formula', 'Status Stunting', 'Actions'];
        
        document.getElementById('table-header').innerHTML = `
            <tr>
                ${headers.map(header => `<th>${header}</th>`).join('')}
            </tr>
        `;
        
        // Generate table body
        const tbody = data.data.map(row => {
            const nameField = currentTable === 'data_latih' ? row.nama : row.nama_keluarga;
            return `
                <tr>
                    <td>${row.id}</td>
                    <td>${nameField}</td>
                    <td>${row.usia}</td>
                    <td>${row.jenis_kelamin}</td>
                    <td>${row.pendapatan.toLocaleString()}</td>
                    <td>${row.tinggi}</td>
                    <td>${row.berat}</td>
                    <td><span class="badge ${row.air_bersih === 'Ya' ? 'badge-success' : 'badge-secondary'}">${row.air_bersih}</span></td>
                    <td><span class="badge badge-${row.kondisi_sanitasi === 'Baik' ? 'success' : row.kondisi_sanitasi === 'Cukup' ? 'warning' : 'danger'}">${row.kondisi_sanitasi}</span></td>
                    <td><span class="badge ${row.susu_formula === 'Ya' ? 'badge-info' : 'badge-secondary'}">${row.susu_formula}</span></td>
                    <td><span class="badge ${row.status_stunting === 'Ya' ? 'badge-danger' : 'badge-success'}">${row.status_stunting}</span></td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary" onclick="editData(${row.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteData(${row.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
        
        document.getElementById('table-body').innerHTML = tbody;
        
        // Generate pagination
        generatePagination(data.pagination);
        
    } catch (error) {
        console.error('Error loading table data:', error);
        document.getElementById('table-body').innerHTML = 
            '<tr><td colspan="12" class="text-center text-danger">Error loading data</td></tr>';
    }
}

// Generate pagination
function generatePagination(pagination) {
    const totalPages = pagination.pages;
    const currentPageNum = pagination.page;
    
    let paginationHtml = '';
    
    // Previous button
    if (currentPageNum > 1) {
        paginationHtml += `
            <li class="page-item">
                <a class="page-link" href="#" onclick="changePage(${currentPageNum - 1})">Previous</a>
            </li>
        `;
    }
    
    // Page numbers
    for (let i = Math.max(1, currentPageNum - 2); i <= Math.min(totalPages, currentPageNum + 2); i++) {
        paginationHtml += `
            <li class="page-item ${i === currentPageNum ? 'active' : ''}">
                <a class="page-link" href="#" onclick="changePage(${i})">${i}</a>
            </li>
        `;
    }
    
    // Next button
    if (currentPageNum < totalPages) {
        paginationHtml += `
            <li class="page-item">
                <a class="page-link" href="#" onclick="changePage(${currentPageNum + 1})">Next</a>
            </li>
        `;
    }
    
    document.getElementById('pagination').innerHTML = paginationHtml;
}

// Change page
function changePage(page) {
    currentPage = page;
    loadTableData();
}

// Change items per page
function changePerPage() {
    perPage = parseInt(document.getElementById('per-page-select').value);
    currentPage = 1;
    loadTableData();
}

// Search data
function searchData() {
    searchQuery = document.getElementById('search-input').value;
    currentPage = 1;
    loadTableData();
}

// Show add modal
function showAddModal() {
    document.getElementById('modalTitle').textContent = 'Add New Data';
    document.getElementById('dataForm').reset();
    document.getElementById('recordId').value = '';
    $('#dataModal').modal('show');
}

// Edit data
async function editData(id) {
    try {
        const response = await fetch(`/api/${currentTable}?page=1&per_page=1000`);
        const data = await response.json();
        
        const record = data.data.find(row => row.id === id);
        if (!record) {
            throw new Error('Record not found');
        }
        
        document.getElementById('modalTitle').textContent = 'Edit Data';
        document.getElementById('recordId').value = record.id;
        
        // Fill form fields
        const nameField = currentTable === 'data_latih' ? record.nama : record.nama_keluarga;
        document.getElementById('nama').value = nameField;
        document.getElementById('usia').value = record.usia;
        document.getElementById('jenis_kelamin').value = record.jenis_kelamin;
        document.getElementById('pendapatan').value = record.pendapatan;
        document.getElementById('tinggi').value = record.tinggi;
        document.getElementById('berat').value = record.berat;
        document.getElementById('air_bersih').value = record.air_bersih;
        document.getElementById('kondisi_sanitasi').value = record.kondisi_sanitasi;
        document.getElementById('susu_formula').value = record.susu_formula;
        document.getElementById('status_stunting').value = record.status_stunting;
        
        $('#dataModal').modal('show');
    } catch (error) {
        console.error('Error editing data:', error);
        alert('Error loading data for editing');
    }
}

// Delete data
async function deleteData(id) {
    if (!confirm('Are you sure you want to delete this record?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/${currentTable}?id=${id}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Data deleted successfully!');
            loadTableData();
            loadTableInfo();
        } else {
            throw new Error(result.error || 'Delete failed');
        }
    } catch (error) {
        console.error('Error deleting data:', error);
        alert('Error deleting data');
    }
}

// Save data
async function saveData() {
    try {
        const form = document.getElementById('dataForm');
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        // Convert numeric fields
        data.usia = parseInt(data.usia);
        data.pendapatan = parseInt(data.pendapatan);
        data.tinggi = parseFloat(data.tinggi);
        data.berat = parseFloat(data.berat);
        
        const isEdit = data.id && data.id !== '';
        const url = `/api/${currentTable}`;
        const method = isEdit ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert(result.message);
            $('#dataModal').modal('hide');
            loadTableData();
            loadTableInfo();
        } else {
            throw new Error(result.error || 'Save failed');
        }
    } catch (error) {
        console.error('Error saving data:', error);
        alert('Error saving data');
    }
}

// Handle file upload
async function handleFileUpload(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const resultDiv = document.getElementById('upload-result');
    
    try {
        resultDiv.innerHTML = '<div class="alert alert-info">Uploading file...</div>';
        
        const response = await fetch('/api/upload_excel', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            resultDiv.innerHTML = `
                <div class="alert alert-success">
                    <h6>Upload Successful!</h6>
                    <p>${result.message}</p>
                    <ul>
                        <li>Total rows: ${result.summary.total_rows}</li>
                        <li>Success: ${result.summary.success_count}</li>
                        <li>Errors: ${result.summary.error_count}</li>
                    </ul>
                </div>
            `;
            
            // Refresh data
            loadTableInfo();
            loadDatabaseStatistics();
            if (document.getElementById('data-tables-section').style.display !== 'none') {
                loadTableData();
            }
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Error uploading file:', error);
        resultDiv.innerHTML = `<div class="alert alert-danger">Upload failed: ${error.message}</div>`;
    }
}

// Import Excel data
async function importExcelData() {
    const progressBar = document.querySelector('.progress-bar');
    const statusDiv = document.getElementById('import-status');
    const resultDiv = document.getElementById('import-result');
    
    try {
        progressBar.style.width = '10%';
        statusDiv.innerHTML = 'Starting import process...';
        
        const response = await fetch('/api/import_excel_to_mysql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        progressBar.style.width = '100%';
        const result = await response.json();
        
        if (result.success) {
            statusDiv.innerHTML = 'Import completed successfully!';
            resultDiv.innerHTML = `
                <div class="alert alert-success">
                    <h6>Import Successful!</h6>
                    <p>${result.message}</p>
                </div>
            `;
            
            // Refresh all data
            checkDatabaseStatus();
            loadDatabaseStatistics();
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Error importing data:', error);
        statusDiv.innerHTML = 'Import failed!';
        resultDiv.innerHTML = `<div class="alert alert-danger">Import failed: ${error.message}</div>`;
    } finally {
        setTimeout(() => {
            progressBar.style.width = '0%';
            statusDiv.innerHTML = '';
        }, 3000);
    }
}

// Quick action functions
function viewTrainingData() {
    showDataTable('data_latih');
}

function viewTestData() {
    showDataTable('data_uji');
}

async function trainModel() {
    try {
        const response = await fetch('/train');
        const result = await response.json();
        
        if (result.message) {
            alert(`Training completed: ${result.message}`);
        } else {
            throw new Error(result.error || 'Training failed');
        }
    } catch (error) {
        console.error('Error training model:', error);
        alert('Error training model');
    }
}

async function testModel() {
    try {
        const response = await fetch('/test');
        const result = await response.json();
        
        if (result.predictions) {
            alert(`Testing completed. Generated ${result.total_predictions} predictions.`);
        } else {
            throw new Error(result.error || 'Testing failed');
        }
    } catch (error) {
        console.error('Error testing model:', error);
        alert('Error testing model');
    }
}
