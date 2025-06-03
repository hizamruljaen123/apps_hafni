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
    
    // Load age analysis data on page load
    loadAgeAnalysis();
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
    
    // Tampilkan hasil feature selection jika tersedia
    if (result.feature_selection && result.feature_selection.success) {
        displayIntegratedFeatureSelection(result.feature_selection);
    }
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

function displayIntegratedFeatureSelection(featureSelection) {
    // Show the feature selection card as separate card after Naive Bayes results
    $('#featureSelectionCard').addClass('feature-loading').show();
    
    // Show loading state first
    $('#featureSelectionCard .card-body').html(`
        <div class="text-center py-5">
            <div class="spinner-border text-warning" role="status">
                <span class="sr-only">Loading...</span>
            </div>
            <p class="mt-3 text-muted">Memproses Feature Selection dengan Backward Elimination...</p>
        </div>
    `);
    
    // Scroll to feature selection card first
    $('html, body').animate({
        scrollTop: $('#featureSelectionCard').offset().top - 20
    }, 500);
    
    // Simulate processing time and then show results
    setTimeout(() => {
        // Restore original content structure
        $('#featureSelectionCard .card-body').html(`
            <!-- Ringkasan Hasil Backward Elimination -->
            <div class="row mb-4">
                <div class="col-md-12">
                    <div class="alert alert-info">
                        <h6><i class="fas fa-info-circle"></i> Ringkasan Hasil Backward Elimination</h6>
                        <div id="backwardEliminationSummary"></div>
                    </div>
                </div>
            </div>
            
            <div class="row">
                <div class="col-md-6">
                    <div class="card border-warning">
                        <div class="card-header bg-warning text-dark">
                            <h6><i class="fas fa-chart-bar"></i> Perbandingan Model</h6>
                        </div>
                        <div class="card-body">
                            <div class="table-responsive" style="max-height: 300px; overflow-y: auto;">
                                <table class="table table-sm table-striped">
                                    <thead class="thead-dark sticky-top">
                                        <tr>
                                            <th>Metrik</th>
                                            <th>Asli</th>
                                            <th>Terpilih</th>
                                            <th>Perubahan</th>
                                        </tr>
                                    </thead>
                                    <tbody id="modelComparisonTable">
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card border-warning">
                        <div class="card-header bg-warning text-dark">
                            <h6><i class="fas fa-chart-pie"></i> Feature Importance</h6>
                        </div>
                        <div class="card-body">
                            <canvas id="featureImportanceChart" height="200"></canvas>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="row mt-3">
                <div class="col-md-6">
                    <div class="card border-success">
                        <div class="card-header bg-success text-white">
                            <h6><i class="fas fa-check"></i> Fitur Terpilih</h6>
                        </div>
                        <div class="card-body" style="max-height: 200px; overflow-y: auto;">
                            <div id="selectedFeaturesList"></div>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card border-danger">
                        <div class="card-header bg-danger text-white">
                            <h6><i class="fas fa-times"></i> Fitur Tereliminasi</h6>
                        </div>
                        <div class="card-body" style="max-height: 200px; overflow-y: auto;">
                            <div id="eliminatedFeaturesList"></div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="row mt-3">
                <div class="col-md-12">
                    <div class="card border-info">
                        <div class="card-header bg-info text-white">
                            <h6><i class="fas fa-cogs"></i> Proses Backward Elimination Step-by-Step</h6>
                        </div>
                        <div class="card-body" style="max-height: 750px; overflow-y: auto;">
                            <div id="eliminationSteps"></div>
                        </div>
                    </div>
                </div>
            </div>
        `);
        
        // Display backward elimination summary first
        displayBackwardEliminationSummary(featureSelection);
        
        // Display model comparison
        displayModelComparison(featureSelection.original_metrics, featureSelection.selected_metrics, featureSelection.improvement);
        
        // Display feature importance chart
        displayFeatureImportanceChart(featureSelection.feature_importance);
        
        // Display elimination steps
        displayEliminationSteps(featureSelection.elimination_steps);
        
        // Display selected and eliminated features
        displayFeatureLists(featureSelection.selected_features, featureSelection.eliminated_features);
        
        // Display additional visualizations
        displayFeatureSelectionTimeline(featureSelection.elimination_steps);
        displayModelPerformanceComparison(featureSelection.original_metrics, featureSelection.selected_metrics);
        displayFeatureAnalysisTable(featureSelection);
        displayFeatureImpactChart(featureSelection.feature_importance);
        displayOptimizationSummary(featureSelection);
        
        // Add loaded class for animation
        $('#featureSelectionCard').removeClass('feature-loading').addClass('feature-loaded');
        
    }, 1500); // 1.5 second delay to show processing
}

function displayBackwardEliminationSummary(featureSelection) {
    const totalFeatures = featureSelection.selected_features.length + featureSelection.eliminated_features.length;
    const accuracyImprovement = featureSelection.improvement.accuracy;
    const accuracyImprovementText = accuracyImprovement >= 0 ?
        `<span class="text-success">+${(accuracyImprovement * 100).toFixed(2)}%</span>` :
        `<span class="text-danger">${(accuracyImprovement * 100).toFixed(2)}%</span>`;
    
    const summaryHtml = `
        <div class="row">
            <div class="col-md-3">
                <div class="text-center">
                    <h4 class="text-primary">${totalFeatures}</h4>
                    <small>Total Fitur Awal</small>
                </div>
            </div>
            <div class="col-md-3">
                <div class="text-center">
                    <h4 class="text-success">${featureSelection.selected_features.length}</h4>
                    <small>Fitur Terpilih</small>
                </div>
            </div>
            <div class="col-md-3">
                <div class="text-center">
                    <h4 class="text-danger">${featureSelection.eliminated_features.length}</h4>
                    <small>Fitur Dieliminasi</small>
                </div>
            </div>
            <div class="col-md-3">
                <div class="text-center">
                    <h4>${accuracyImprovementText}</h4>
                    <small>Perubahan Akurasi</small>
                </div>
            </div>
        </div>
        <hr>
        <div class="row">
            <div class="col-md-6">
                <strong>Hasil Proses:</strong><br>
                <small class="text-muted">
                    Backward Elimination berhasil mengurangi ${featureSelection.feature_count_reduction} fitur
                    dari ${totalFeatures} fitur awal menjadi ${featureSelection.selected_features.length} fitur optimal.
                </small>
            </div>
            <div class="col-md-6">
                <strong>Fitur Paling Penting:</strong><br>
                <span class="badge badge-warning p-2">${featureSelection.feature_importance.features[0]}</span>
                <small class="text-muted ml-2">
                    (Score: ${featureSelection.feature_importance.scores[0].toFixed(4)})
                </small>
            </div>
        </div>
    `;
    
    $('#backwardEliminationSummary').html(summaryHtml);
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

// Age Analysis Chart and Table
let ageChart = null;

// Function to load age analysis data
async function loadAgeAnalysis() {
    try {
        const response = await fetch('/analysis_by_age');
        const data = await response.json();
        
        if (response.ok) {
            renderAgeChart(data.chart_data);
            populateAgeTable(data.table_data);
        } else {
            console.error('Error loading age analysis:', data.error);
        }
    } catch (error) {
        console.error('Error fetching age analysis:', error);
    }
}

// Function to render age chart
function renderAgeChart(chartData) {
    const ctx = document.getElementById('ageChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (ageChart && typeof ageChart.destroy === 'function') {
        ageChart.destroy();
    }
    
    ageChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: chartData.usia_group,
            datasets: [{
                label: 'Tidak Stunting',
                data: chartData['Tidak Stunting'],
                backgroundColor: 'rgba(40, 167, 69, 0.8)',
                borderColor: 'rgba(40, 167, 69, 1)',
                borderWidth: 1
            }, {
                label: 'Stunting',
                data: chartData.Stunting,
                backgroundColor: 'rgba(220, 53, 69, 0.8)',
                borderColor: 'rgba(220, 53, 69, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Jumlah Balita'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Kelompok Usia (Bulan)'
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Distribusi Stunting Berdasarkan Kelompok Usia'
                },
                legend: {
                    display: true,
                    position: 'top'
                }
            }
        }
    });
}

// Function to populate age table
function populateAgeTable(tableData) {
    const tbody = document.getElementById('ageAnalysisTableBody');
    tbody.innerHTML = '';
    
    tableData.forEach(row => {
        const normal = row['Tidak Stunting'] || 0;
        const stunting = row['Stunting'] || 0;
        const total = normal + stunting;
        const stuntingPercentage = total > 0 ? ((stunting / total) * 100).toFixed(1) : '0.0';
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${row.usia_group}</td>
            <td class="text-center">${normal}</td>
            <td class="text-center">${stunting}</td>
            <td class="text-center">${total}</td>
            <td class="text-center">${stuntingPercentage}%</td>
        `;
        tbody.appendChild(tr);
    });
}

// Feature Selection Functions (now integrated into simulation)
function displayModelComparison(original, selected, improvement) {
    const metrics = ['accuracy', 'precision', 'recall', 'f1_score'];
    const metricNames = {
        'accuracy': 'Akurasi',
        'precision': 'Presisi',
        'recall': 'Recall',
        'f1_score': 'F1-Score'
    };
    
    let tableHtml = '';
    
    metrics.forEach(metric => {
        const changeValue = improvement[metric];
        const changeClass = changeValue >= 0 ? 'text-success' : 'text-danger';
        const changeIcon = changeValue >= 0 ? 'fa-arrow-up' : 'fa-arrow-down';
        
        tableHtml += `
            <tr>
                <td><strong>${metricNames[metric]}</strong></td>
                <td>${(original[metric] * 100).toFixed(2)}%</td>
                <td>${(selected[metric] * 100).toFixed(2)}%</td>
                <td class="${changeClass}">
                    <i class="fas ${changeIcon}"></i> ${(changeValue * 100).toFixed(2)}%
                </td>
            </tr>
        `;
    });
    
    $('#modelComparisonTable').html(tableHtml);
}

function displayFeatureImportanceChart(importanceData) {
    const ctx = document.getElementById('featureImportanceChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (window.featureImportanceChart && typeof window.featureImportanceChart.destroy === 'function') {
        window.featureImportanceChart.destroy();
    }
    
    window.featureImportanceChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: importanceData.features,
            datasets: [{
                label: 'Feature Importance',
                data: importanceData.scores,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.8)',
                    'rgba(54, 162, 235, 0.8)',
                    'rgba(255, 205, 86, 0.8)',
                    'rgba(75, 192, 192, 0.8)',
                    'rgba(153, 102, 255, 0.8)',
                    'rgba(255, 159, 64, 0.8)',
                    'rgba(199, 199, 199, 0.8)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 205, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)',
                    'rgba(199, 199, 199, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Importance Score'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Features'
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Feature Importance Ranking'
                },
                legend: {
                    display: false
                }
            }
        }
    });
}

function displayEliminationSteps(steps) {
    let stepsHtml = '<div class="mb-3"><h6 class="text-info">Proses Backward Elimination Step-by-Step:</h6></div>';
    
    steps.forEach((step, index) => {
        const cardClass = step.removed_feature ? 'border-warning' : 'border-info';
        const iconClass = step.removed_feature ? 'fa-minus-circle text-warning' : 'fa-plus-circle text-info';
        const headerClass = step.removed_feature ? 'bg-warning text-dark' : 'bg-info text-white';
        
        // Determine if this step improved or maintained accuracy
        let accuracyStatus = '';
        if (index > 0) {
            const prevAccuracy = steps[index - 1].accuracy;
            const currentAccuracy = step.accuracy;
            const diff = currentAccuracy - prevAccuracy;
            
            if (diff > 0) {
                accuracyStatus = `<span class="badge badge-success ml-2"><i class="fas fa-arrow-up"></i> +${(diff * 100).toFixed(2)}%</span>`;
            } else if (diff < 0) {
                accuracyStatus = `<span class="badge badge-danger ml-2"><i class="fas fa-arrow-down"></i> ${(diff * 100).toFixed(2)}%</span>`;
            } else {
                accuracyStatus = `<span class="badge badge-secondary ml-2"><i class="fas fa-equals"></i> 0.00%</span>`;
            }
        }
        
        stepsHtml += `
            <div class="card mb-3 ${cardClass}" style="border-width: 2px;">
                <div class="card-header ${headerClass} py-2">
                    <div class="d-flex justify-content-between align-items-center">
                        <h6 class="mb-0">
                            <i class="fas ${iconClass}"></i>
                            Step ${step.step}: ${step.action}
                        </h6>
                        <div>
                            <span class="badge badge-light text-dark">
                                Akurasi: ${(step.accuracy * 100).toFixed(2)}%
                            </span>
                            ${accuracyStatus}
                        </div>
                    </div>
                </div>
                <div class="card-body py-3">
                    <div class="row">
                        <div class="col-md-8">
                            <strong class="text-primary">Fitur yang tersisa (${step.features.length}):</strong><br>
                            <div class="mt-2">
                                ${step.features.map(feature => `<span class="badge badge-success mr-1 mb-1">${feature}</span>`).join('')}
                            </div>
                        </div>
                        <div class="col-md-4">
                            ${step.removed_feature ? `
                                <strong class="text-danger">Fitur yang dihapus:</strong><br>
                                <span class="badge badge-danger p-2 mt-1">${step.removed_feature}</span>
                            ` : `
                                <strong class="text-info">Status:</strong><br>
                                <span class="badge badge-info p-2 mt-1">Kondisi Awal</span>
                            `}
                        </div>
                    </div>
                    ${step.removed_feature ? `
                        <hr class="my-2">
                        <small class="text-muted">
                            <i class="fas fa-info-circle"></i>
                            Fitur "${step.removed_feature}" dihapus karena penghapusannya
                            ${accuracyStatus.includes('arrow-up') ? 'meningkatkan' :
                              accuracyStatus.includes('arrow-down') ? 'menurunkan' : 'mempertahankan'}
                            akurasi model.
                        </small>
                    ` : ''}
                </div>
            </div>
        `;
    });
    
    // Add summary at the end
    stepsHtml += `
        <div class="alert alert-success mt-3">
            <h6 class="alert-heading"><i class="fas fa-check-circle"></i> Ringkasan Proses</h6>
            <p class="mb-1">
                <strong>Total Steps:</strong> ${steps.length} langkah<br>
                <strong>Fitur Awal:</strong> ${steps[0].features.length} fitur<br>
                <strong>Fitur Akhir:</strong> ${steps[steps.length - 1].features.length} fitur<br>
                <strong>Akurasi Awal:</strong> ${(steps[0].accuracy * 100).toFixed(2)}%<br>
                <strong>Akurasi Akhir:</strong> ${(steps[steps.length - 1].accuracy * 100).toFixed(2)}%
            </p>
        </div>
    `;
    
    $('#eliminationSteps').html(stepsHtml);
}

function displayFeatureLists(selectedFeatures, eliminatedFeatures) {
    // Display selected features
    let selectedHtml = '';
    if (selectedFeatures.length > 0) {
        selectedFeatures.forEach(feature => {
            selectedHtml += `<span class="badge badge-success mr-1 mb-1 p-2">${feature}</span>`;
        });
    } else {
        selectedHtml = '<p class="text-muted">Tidak ada fitur yang dipilih</p>';
    }
    $('#selectedFeaturesList').html(selectedHtml);
    
    // Display eliminated features
    let eliminatedHtml = '';
    if (eliminatedFeatures.length > 0) {
        eliminatedFeatures.forEach(feature => {
            eliminatedHtml += `<span class="badge badge-danger mr-1 mb-1 p-2">${feature}</span>`;
        });
    } else {
        eliminatedHtml = '<p class="text-muted">Tidak ada fitur yang dieliminasi</p>';
    }
    $('#eliminatedFeaturesList').html(eliminatedHtml);
}

// Additional Feature Selection Visualization Functions
function displayFeatureSelectionTimeline(eliminationSteps) {
    const ctx = document.getElementById('featureSelectionTimelineChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (window.featureTimelineChart && typeof window.featureTimelineChart.destroy === 'function') {
        window.featureTimelineChart.destroy();
    }
    
    const steps = eliminationSteps.map((step, index) => `Step ${index}`);
    const accuracyData = eliminationSteps.map(step => step.accuracy * 100);
    const featureCount = eliminationSteps.map(step => step.features.length);
    
    window.featureTimelineChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: steps,
            datasets: [{
                label: 'Akurasi (%)',
                data: accuracyData,
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                yAxisID: 'y',
                tension: 0.4
            }, {
                label: 'Jumlah Fitur',
                data: featureCount,
                borderColor: 'rgba(255, 99, 132, 1)',
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                yAxisID: 'y1',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Langkah Eliminasi'
                    }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Akurasi (%)'
                    },
                    grid: {
                        drawOnChartArea: false,
                    },
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Jumlah Fitur'
                    },
                    grid: {
                        drawOnChartArea: false,
                    },
                },
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Timeline Proses Feature Selection'
                },
                legend: {
                    display: true,
                    position: 'top'
                }
            }
        },
    });
}

function displayModelPerformanceComparison(originalMetrics, selectedMetrics) {
    const ctx = document.getElementById('modelPerformanceComparisonChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (window.performanceComparisonChart && typeof window.performanceComparisonChart.destroy === 'function') {
        window.performanceComparisonChart.destroy();
    }
    
    const metrics = ['accuracy', 'precision', 'recall', 'f1_score'];
    const metricLabels = ['Akurasi', 'Presisi', 'Recall', 'F1-Score'];
    
    const originalData = metrics.map(metric => originalMetrics[metric] * 100);
    const selectedData = metrics.map(metric => selectedMetrics[metric] * 100);
    
    window.performanceComparisonChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: metricLabels,
            datasets: [{
                label: 'Model Asli',
                data: originalData,
                fill: true,
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderColor: 'rgba(255, 99, 132, 1)',
                pointBackgroundColor: 'rgba(255, 99, 132, 1)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgba(255, 99, 132, 1)'
            }, {
                label: 'Model Optimal',
                data: selectedData,
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
            maintainAspectRatio: false,
            elements: {
                line: {
                    borderWidth: 3
                }
            },
            scales: {
                r: {
                    angleLines: {
                        display: false
                    },
                    suggestedMin: 0,
                    suggestedMax: 100
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Perbandingan Performa Model'
                },
                legend: {
                    display: true,
                    position: 'top'
                }
            }
        }
    });
}

function displayFeatureAnalysisTable(featureSelection) {
    const allFeatures = ['pendapatan', 'tinggi', 'berat', 'jenis_kelamin', 'air_bersih', 'kondisi_sanitasi', 'susu_formula'];
    const featureNames = {
        'pendapatan': 'Pendapatan',
        'tinggi': 'Tinggi Badan',
        'berat': 'Berat Badan',
        'jenis_kelamin': 'Jenis Kelamin',
        'air_bersih': 'Akses Air Bersih',
        'kondisi_sanitasi': 'Kondisi Sanitasi',
        'susu_formula': 'Susu Formula'
    };
    
    let tableHtml = '';
    
    allFeatures.forEach((feature, index) => {
        const isSelected = featureSelection.selected_features.includes(feature);
        const importanceScore = featureSelection.feature_importance.scores[featureSelection.feature_importance.features.indexOf(feature)] || 0;
        
        // Find elimination step
        let eliminationStep = 'N/A';
        let contributionText = 'Positif';
        
        if (!isSelected) {
            const eliminationStepData = featureSelection.elimination_steps.find(step => step.removed_feature === feature);
            if (eliminationStepData) {
                eliminationStep = `Step ${eliminationStepData.step}`;
                contributionText = 'Negatif/Netral';
            }
        }
        
        const statusBadge = isSelected ?
            '<span class="badge badge-success">Terpilih</span>' :
            '<span class="badge badge-danger">Dieliminasi</span>';
        
        const importanceScoreFormatted = importanceScore > 0 ? importanceScore.toFixed(4) : '0.0000';
        
        tableHtml += `
            <tr class="${isSelected ? 'table-success' : 'table-danger'}">
                <td><strong>${featureNames[feature]}</strong></td>
                <td>${statusBadge}</td>
                <td><span class="badge badge-info">${importanceScoreFormatted}</span></td>
                <td><span class="badge ${contributionText === 'Positif' ? 'badge-success' : 'badge-warning'}">${contributionText}</span></td>
                <td>${eliminationStep}</td>
                <td class="small text-muted">
                    ${isSelected ?
                        'Fitur berkontribusi positif terhadap akurasi model' :
                        'Fitur tidak memberikan kontribusi signifikan dan dieliminasi'
                    }
                </td>
            </tr>
        `;
    });
    
    $('#featureAnalysisTable').html(tableHtml);
}

function displayFeatureImpactChart(featureImportance) {
    const ctx = document.getElementById('featureImpactChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (window.featureImpactChart && typeof window.featureImpactChart.destroy === 'function') {
        window.featureImpactChart.destroy();
    }
    
    // Create gradient colors for bars
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(75, 192, 192, 0.8)');
    gradient.addColorStop(1, 'rgba(75, 192, 192, 0.2)');
    
    window.featureImpactChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: featureImportance.features,
            datasets: [{
                label: 'Impact Score',
                data: featureImportance.scores,
                backgroundColor: gradient,
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 2,
                borderRadius: 5,
                borderSkipped: false,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Impact Score'
                    },
                    grid: {
                        color: 'rgba(0,0,0,0.1)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Fitur'
                    },
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Impact Fitur Terhadap Prediksi Stunting'
                },
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Impact: ${context.parsed.y.toFixed(4)}`;
                        }
                    }
                }
            },
            animation: {
                duration: 1000,
                easing: 'easeInOutQuart'
            }
        }
    });
}

function displayOptimizationSummary(featureSelection) {
    const totalFeatures = featureSelection.selected_features.length + featureSelection.eliminated_features.length;
    const reductionPercentage = ((featureSelection.eliminated_features.length / totalFeatures) * 100).toFixed(1);
    const accuracyImprovement = (featureSelection.improvement.accuracy * 100).toFixed(2);
    const improvementClass = featureSelection.improvement.accuracy >= 0 ? 'text-success' : 'text-danger';
    const improvementIcon = featureSelection.improvement.accuracy >= 0 ? 'fa-arrow-up' : 'fa-arrow-down';
    
    const summaryHtml = `
        <div class="text-center mb-3">
            <h5 class="text-primary">Hasil Optimasi</h5>
        </div>
        
        <div class="mb-3">
            <div class="d-flex justify-content-between align-items-center mb-2">
                <span class="small text-muted">Pengurangan Fitur:</span>
                <span class="badge badge-warning">${reductionPercentage}%</span>
            </div>
            <div class="progress" style="height: 8px;">
                <div class="progress-bar bg-warning" role="progressbar" style="width: ${reductionPercentage}%"></div>
            </div>
        </div>
        
        <div class="mb-3">
            <div class="d-flex justify-content-between align-items-center">
                <span class="small text-muted">Perubahan Akurasi:</span>
                <span class="badge badge-primary ${improvementClass}">
                    <i class="fas ${improvementIcon}"></i> ${accuracyImprovement}%
                </span>
            </div>
        </div>
        
        <div class="mb-3">
            <div class="d-flex justify-content-between align-items-center">
                <span class="small text-muted">Fitur Tersisa:</span>
                <span class="badge badge-success">${featureSelection.selected_features.length}/${totalFeatures}</span>
            </div>
        </div>
        
        <div class="mb-3">
            <div class="d-flex justify-content-between align-items-center">
                <span class="small text-muted">Fitur Terpenting:</span>
                <span class="badge badge-info small">${featureSelection.feature_importance.features[0]}</span>
            </div>
        </div>
        
        <hr>
        
        <div class="alert alert-${featureSelection.improvement.accuracy >= 0 ? 'success' : 'warning'} p-2 small">
            <i class="fas fa-lightbulb"></i>
            <strong>Kesimpulan:</strong><br>
            ${featureSelection.improvement.accuracy >= 0 ?
                `Model berhasil dioptimalkan dengan mengurangi ${featureSelection.eliminated_features.length} fitur sambil ${accuracyImprovement === '0.00' ? 'mempertahankan' : 'meningkatkan'} akurasi.` :
                `Model mengalami penurunan akurasi ${Math.abs(parseFloat(accuracyImprovement))}% setelah pengurangan fitur.`
            }
        </div>
        
        <div class="text-center mt-3">
            <small class="text-muted">
                <i class="fas fa-clock"></i>
                Proses eliminasi: ${featureSelection.elimination_steps.length} langkah
            </small>
        </div>
    `;
    
    $('#optimizationSummary').html(summaryHtml);
}
