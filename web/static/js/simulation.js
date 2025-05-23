// Simulasi Naive Bayes JavaScript
$(document).ready(function() {
    // Handle form submission
    $('#simulationForm').on('submit', function(e) {
        e.preventDefault();
        runSimulation();
    });
    
    // Handler untuk sumber data
    $('#dataSource').on('change', function() {
        const source = $(this).val();
        if (source) {
            loadDataRecords(source);
        } else {
            $('#dataRecordContainer').hide();
            $('#dataPreviewContainer').hide();
        }
    });
    
    // Batch processing button handler
    $('#runBatchProcessing').on('click', function() {
        runBatchProcessing();
    });
    
    // Handler untuk pemilihan data record
    $('#dataRecord').on('change', function() {
        const recordId = $(this).val();
        if (recordId) {
            previewDataRecord();
        } else {
            $('#dataPreviewContainer').hide();
        }
    });
    
    // Form dataset submit handler
    $('#datasetForm').on('submit', function(e) {
        e.preventDefault();
        runDataSetSimulation();
    });
    
    // Add hover effects to calculation step cards
    $(document).on('mouseenter', '#calculationSteps .card-header', function() {
        $(this).css('background-color', 'rgba(24, 188, 156, 0.8)');
    });
    
    $(document).on('mouseleave', '#calculationSteps .card-header', function() {
        $(this).css('background-color', 'rgba(44, 62, 80, 0.9)');
    });
    
    // Format currency input
    $('#pendapatan').on('input', function() {
        let value = $(this).val().replace(/\D/g, '');
        if (value) {
            value = parseInt(value, 10).toLocaleString('id-ID');
            $(this).val(value.replace(/\./g, ''));
        }
    });
});

async function loadDataRecords(source) {
    try {
        let url = source === 'training' ? '/api/get_train_data_list' : '/api/get_test_data_list';
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (response.ok) {
            // Populate dropdown
            let options = '<option value="">Pilih Data</option>';
            data.forEach(item => {
                options += `<option value="${item.id}">${item.nama}</option>`;
            });
            
            $('#dataRecord').html(options);
            $('#dataRecordContainer').show();
        } else {
            alert('Error: ' + data.error);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Terjadi kesalahan saat memuat data');
    }
}

async function previewDataRecord() {
    try {
        const source = $('#dataSource').val();
        const recordId = $('#dataRecord').val();
        
        const response = await fetch(`/api/get_data_detail?source=${source}&id=${recordId}`);
        const data = await response.json();
        
        if (response.ok) {
            // Display data preview
            let tableContent = '';
            for (const [key, value] of Object.entries(data)) {
                tableContent += `
                    <tr>
                        <td>${key}</td>
                        <td>${value}</td>
                    </tr>
                `;
            }
            
            $('#dataPreview').html(tableContent);
            $('#dataPreviewContainer').show();
        } else {
            alert('Error: ' + data.error);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Terjadi kesalahan saat memuat detail data');
    }
}

async function runDataSetSimulation() {
    // Tampilkan loading indicator
    $('#loadingIndicator').show();
    $('#simulationResults').hide();
    
    try {
        const source = $('#dataSource').val();
        const recordId = $('#dataRecord').val();
        
        // Get detailed data first
        const dataResponse = await fetch(`/api/get_data_detail?source=${source}&id=${recordId}`);
        const inputData = await dataResponse.json();
        
        if (!dataResponse.ok) {
            throw new Error(inputData.error || 'Gagal mengambil data');
        }
        
        // Send for simulation
        const response = await fetch('/api/simulate_naive_bayes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(inputData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            displaySimulationResults(result);
        } else {
            alert('Error: ' + result.error);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Terjadi kesalahan saat memproses simulasi: ' + error.message);
    } finally {
        $('#loadingIndicator').hide();
    }
}

async function runSimulation() {
    // Tampilkan loading indicator
    $('#loadingIndicator').show();
    $('#simulationResults').hide();

    // Ambil data dari form
    const formData = new FormData($('#simulationForm')[0]);
    const inputData = {};
    
    for (let [key, value] of formData.entries()) {
        inputData[key] = value;
    }

    try {
        // Kirim data ke API simulasi
        const response = await fetch('/api/simulate_naive_bayes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(inputData)
        });

        const result = await response.json();
        
        if (response.ok) {
            displaySimulationResults(result);
        } else {
            alert('Error: ' + result.error);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Terjadi kesalahan saat memproses simulasi');
    } finally {
        $('#loadingIndicator').hide();
    }
}

function displaySimulationResults(result) {
    // Tampilkan hasil
    $('#simulationResults').show();
    
    // Tampilkan step-by-step calculation
    displayCalculationSteps(result.calculation_steps);
    
    // Tampilkan grafik probabilitas prior
    displayPriorChart(result.prior_probabilities);
    
    // Tampilkan grafik likelihood
    displayLikelihoodChart(result.likelihood_probabilities);
    
    // Tampilkan plot 3D
    display3DPlot(result.plot_data);
    
    // Tampilkan hasil prediksi
    displayPredictionResult(result);
    
    // Tampilkan tabel detail
    displayDetailTable(result.detailed_calculations);
}

function displayCalculationSteps(steps) {
    let stepsHtml = '';
    
    steps.forEach((step, index) => {
        stepsHtml += `
            <div class="card mb-3">
                <div class="card-header">
                    <h6>Step ${index + 1}: ${step.step_name}</h6>
                </div>
                <div class="card-body">
                    <p>${step.description}</p>
                    <div class="row">
        `;
        
        if (step.calculations) {
            step.calculations.forEach(calc => {
                stepsHtml += `
                    <div class="col-md-6">
                        <div class="alert alert-light">
                            <strong>${calc.label}:</strong><br>
                            ${calc.formula}<br>
                            <strong>Hasil: ${calc.result}</strong>
                        </div>
                    </div>
                `;
            });
        }
        
        stepsHtml += `
                    </div>
                </div>
            </div>
        `;
    });
    
    $('#calculationSteps').html(stepsHtml);
}

function displayPriorChart(priorData) {
    const ctx = document.getElementById('priorChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Stunting', 'Tidak Stunting'],
            datasets: [{
                label: 'Probabilitas Prior',
                data: [priorData.stunting, priorData.tidak_stunting],
                backgroundColor: [
                    'rgba(255, 99, 132, 0.6)',
                    'rgba(54, 162, 235, 0.6)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 1
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Probabilitas Prior P(Y)'
                }
            }
        }
    });
}

function displayLikelihoodChart(likelihoodData) {
    const ctx = document.getElementById('likelihoodChart').getContext('2d');
    
    const labels = Object.keys(likelihoodData);
    const stuntingData = labels.map(label => likelihoodData[label].stunting);
    const tidakStuntingData = labels.map(label => likelihoodData[label].tidak_stunting);
    
    new Chart(ctx, {
        type: 'radar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Stunting',
                data: stuntingData,
                fill: true,
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderColor: 'rgba(255, 99, 132, 1)',
                pointBackgroundColor: 'rgba(255, 99, 132, 1)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgba(255, 99, 132, 1)'
            }, {
                label: 'Tidak Stunting',
                data: tidakStuntingData,
                fill: true,
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgba(54, 162, 235, 1)',
                pointBackgroundColor: 'rgba(54, 162, 235, 1)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgba(54, 162, 235, 1)'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Probabilitas Likelihood P(X|Y)'
                }
            },
            scales: {
                r: {
                    beginAtZero: true,
                    max: 1
                }
            }
        }
    });
}

function display3DPlot(plotData) {
    const trace1 = {
        x: plotData.stunting.x,
        y: plotData.stunting.y,
        z: plotData.stunting.z,
        mode: 'markers',
        marker: {
            size: 8,
            color: 'red',
            opacity: 0.7
        },
        type: 'scatter3d',
        name: 'Stunting'
    };

    const trace2 = {
        x: plotData.tidak_stunting.x,
        y: plotData.tidak_stunting.y,
        z: plotData.tidak_stunting.z,
        mode: 'markers',
        marker: {
            size: 8,
            color: 'blue',
            opacity: 0.7
        },
        type: 'scatter3d',
        name: 'Tidak Stunting'
    };

    const layout = {
        title: 'Distribusi Data 3D (Tinggi, Berat, Pendapatan)',
        scene: {
            xaxis: {
                title: 'Tinggi (cm)'
            },
            yaxis: {
                title: 'Berat (kg)'
            },
            zaxis: {
                title: 'Pendapatan'
            }
        },
        margin: {
            l: 0,
            r: 0,
            b: 0,
            t: 30
        }
    };

    Plotly.newPlot('plot3d', [trace1, trace2], layout);
}

function displayPredictionResult(result) {
    $('#predictionResult').text(result.prediction);
    $('#confidenceScore').text((result.confidence * 100).toFixed(2));
    
    // Set warna berdasarkan hasil prediksi
    const alertClass = result.prediction === 'Stunting' ? 'alert-danger' : 'alert-success';
    $('#predictionResult').parent().parent().removeClass('alert-info alert-danger alert-success').addClass(alertClass);
    
    // Tambah icon berdasarkan hasil
    const icon = result.prediction === 'Stunting' ? 
        '<i class="fas fa-exclamation-triangle mr-2"></i>' : 
        '<i class="fas fa-check-circle mr-2"></i>';
    $('#predictionResult').html(icon + result.prediction);
    
    // Chart hasil prediksi
    const ctx = document.getElementById('resultChart').getContext('2d');
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Stunting', 'Tidak Stunting'],
            datasets: [{
                data: [result.probabilities.stunting * 100, result.probabilities.tidak_stunting * 100],
                backgroundColor: [
                    'rgba(255, 99, 132, 0.8)',
                    'rgba(54, 162, 235, 0.8)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Distribusi Probabilitas Hasil'
                },
                legend: {
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.label + ': ' + context.raw.toFixed(2) + '%';
                        }
                    }
                }
            },
            animation: {
                animateRotate: true,
                animateScale: true
            }
        }
    });
}

function displayDetailTable(detailedCalc) {
    let tableHtml = '';
    
    Object.keys(detailedCalc).forEach(param => {
        const calc = detailedCalc[param];
        tableHtml += `
            <tr>
                <td>${param}</td>
                <td>${calc.input_value}</td>
                <td>${calc.prob_stunting.toFixed(6)}</td>
                <td>${calc.prob_tidak_stunting.toFixed(6)}</td>
            </tr>
        `;
    });
    
    $('#detailTable').html(tableHtml);
}

// Load data records dari sumber yang dipilih (training atau testing)
async function loadDataRecords(source) {
    try {
        // Ambil data sesuai sumber
        const endpoint = source === 'training' ? '/train_data' : '/test_data';
        const response = await fetch(endpoint);
        const data = await response.json();
        
        // Isi dropdown dengan data
        let options = '<option value="">Pilih Data</option>';
        
        data.forEach((item, index) => {
            options += `<option value="${index}">${item.nama_keluarga}</option>`;
        });
        
        $('#dataRecord').html(options);
        $('#dataRecordContainer').show();
        
        // Simpan data di localStorage untuk akses cepat
        localStorage.setItem('currentDataSet', JSON.stringify({
            source: source,
            data: data
        }));
    } catch (error) {
        console.error('Error loading data records:', error);
        alert('Gagal memuat data. Silakan coba lagi.');
    }
}

// Preview data record yang dipilih
function previewDataRecord() {
    try {
        // Ambil data dari localStorage
        const storedData = JSON.parse(localStorage.getItem('currentDataSet'));
        const recordIndex = parseInt($('#dataRecord').val());
        const selectedData = storedData.data[recordIndex];
        
        // Tampilkan preview di tabel
        let previewHtml = '';
        
        // Tampilkan semua properti kecuali yang kompleks
        Object.keys(selectedData).forEach(key => {
            if (typeof selectedData[key] !== 'object') {
                previewHtml += `
                    <tr>
                        <td><strong>${key}</strong></td>
                        <td>${selectedData[key]}</td>
                    </tr>
                `;
            }
        });
        
        $('#dataPreview').html(previewHtml);
        $('#dataPreviewContainer').show();
    } catch (error) {
        console.error('Error previewing data record:', error);
    }
}

// Jalankan simulasi berdasarkan data set yang dipilih
async function runDataSetSimulation() {
    // Tampilkan loading indicator
    $('#loadingIndicator').show();
    $('#simulationResults').hide();
    
    try {
        // Ambil data dari localStorage
        const storedData = JSON.parse(localStorage.getItem('currentDataSet'));
        const recordIndex = parseInt($('#dataRecord').val());
        
        if (isNaN(recordIndex) || !storedData || !storedData.data || !storedData.data[recordIndex]) {
            throw new Error('Data tidak valid atau tidak ditemukan.');
        }
        
        const selectedData = storedData.data[recordIndex];
        
        // Kirim data ke API simulasi
        const response = await fetch('/api/simulate_naive_bayes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(selectedData)
        });

        const result = await response.json();
        
        if (response.ok) {
            displaySimulationResults(result);
        } else {
            alert('Error: ' + result.error);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Terjadi kesalahan saat memproses simulasi: ' + error.message);
    } finally {
        $('#loadingIndicator').hide();
    }
}

// Reset form function
$('#simulationForm').on('reset', function() {
    $('#simulationResults').hide();
    $('#loadingIndicator').hide();
});

// Reset form function untuk dataset juga
$('#datasetForm').on('reset', function() {
    $('#simulationResults').hide();
    $('#loadingIndicator').hide();
    $('#dataPreviewContainer').hide();
});
