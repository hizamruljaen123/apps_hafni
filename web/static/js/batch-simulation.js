// Batch Processing Functions
$(document).ready(function() {
    // Add event listener for the batch processing button
    $('#runBatchProcessing').on('click', function(e) {
        e.preventDefault();
        runBatchProcessing();
    });
});

async function runBatchProcessing() {
    // Show loading indicator
    $('#loadingIndicator').show();
    $('#batchResults').hide();
    $('#batchPredictionDetails').hide();
    $('#batchFeatureSelectionCard').hide();
    
    try {
        // Call batch processing API
        const response = await fetch('/api/batch_process');
        const result = await response.json();
        
        if (response.ok) {
            displayBatchResults(result);
        } else {
            alert('Error: ' + result.error);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Terjadi kesalahan saat memproses batch data: ' + error.message);
    } finally {
        $('#loadingIndicator').hide();
    }
}

function displayBatchResults(data) {
    // Show batch results container
    $('#batchResults').show();
    
    // Display metrics summary
    displayMetricsSummary(data.summary);
    
    // Display confusion matrix
    displayConfusionMatrix(data.summary.confusion_matrix);
    
    // Display t-SNE visualization
    displayTSNEVisualization(data.tsne_data);
    
    // Display detailed prediction results
    displayPredictionTable(data.results);
    
    // Show the prediction details container
    $('#batchPredictionDetails').show();
    
    // Display feature selection results if available
    if (data.feature_selection && data.feature_selection.success) {
        displayBatchFeatureSelection(data.feature_selection);
    }
}

function displayMetricsSummary(summary) {
    // Add metrics to table
    let metricsHtml = `
        <tr>
            <td>Accuracy</td>
            <td>${(summary.accuracy * 100).toFixed(2)}%</td>
        </tr>
        <tr>
            <td>Precision</td>
            <td>${(summary.precision * 100).toFixed(2)}%</td>
        </tr>
        <tr>
            <td>Recall</td>
            <td>${(summary.recall * 100).toFixed(2)}%</td>
        </tr>
        <tr>
            <td>F1 Score</td>
            <td>${(summary.f1_score * 100).toFixed(2)}%</td>
        </tr>
        <tr>
            <td>Prediksi Benar</td>
            <td>${summary.correct_count} / ${summary.total_count} (${summary.correct_percentage.toFixed(2)}%)</td>
        </tr>
    `;
    
    $('#metricsTableBody').html(metricsHtml);
    
    // Check if chart instance exists and destroy it before creating a new one
    if (window.accuracyChart instanceof Chart) {
        window.accuracyChart.destroy();
    }
    
    // Create accuracy chart
    const ctxAcc = document.getElementById('accuracyChart').getContext('2d');
    window.accuracyChart = new Chart(ctxAcc, {
        type: 'pie',
        data: {
            labels: ['Prediksi Benar', 'Prediksi Salah'],
            datasets: [{
                data: [
                    summary.correct_count,
                    summary.total_count - summary.correct_count
                ],
                backgroundColor: [
                    'rgba(46, 204, 113, 0.7)',
                    'rgba(231, 76, 60, 0.7)'
                ],
                borderColor: [
                    'rgba(46, 204, 113, 1)',
                    'rgba(231, 76, 60, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Rasio Prediksi Benar vs Salah'
                },
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function displayConfusionMatrix(confusionMatrix) {
    // Extract values from the confusion matrix
    const tn = confusionMatrix[0][0];
    const fp = confusionMatrix[0][1];
    const fn = confusionMatrix[1][0];
    const tp = confusionMatrix[1][1];
    
    // Create a heatmap using Plotly
    const data = [
        {
            z: [
                [tn, fp], 
                [fn, tp]
            ],
            x: ['Tidak Stunting', 'Stunting'],
            y: ['Tidak Stunting', 'Stunting'],
            type: 'heatmap',
            colorscale: [
                [0, 'rgba(52, 152, 219, 0.7)'],    // Light blue for low values
                [0.5, 'rgba(241, 196, 15, 0.7)'],  // Yellow for mid values
                [1, 'rgba(231, 76, 60, 0.7)']      // Red for high values
            ],
            showscale: false,
            text: [
                [tn, fp],
                [fn, tp]
            ],
            texttemplate: '%{text}',
            textfont: {
                color: 'black',
                size: 16,
                family: 'Arial, sans-serif'
            }
        }
    ];
    
    const layout = {
        title: 'Confusion Matrix',
        annotations: [
            {
                x: 'Tidak Stunting',
                y: 'Tidak Stunting',
                text: 'TN: ' + tn,
                font: { color: 'black' },
                showarrow: false
            },
            {
                x: 'Stunting',
                y: 'Tidak Stunting',
                text: 'FP: ' + fp,
                font: { color: 'black' },
                showarrow: false
            },
            {
                x: 'Tidak Stunting',
                y: 'Stunting',
                text: 'FN: ' + fn,
                font: { color: 'black' },
                showarrow: false
            },
            {
                x: 'Stunting',
                y: 'Stunting',
                text: 'TP: ' + tp,
                font: { color: 'black' },
                showarrow: false
            }
        ],
        xaxis: {
            title: 'Predicted',
            tickangle: 0
        },
        yaxis: {
            title: 'Actual',
            tickangle: 0
        },
        margin: {
            l: 120,
            r: 20,
            b: 60,
            t: 80
        }
    };
    
    // Clear previous plot if any
    Plotly.purge('confusionMatrix');
    
    // Create new plot
    Plotly.newPlot('confusionMatrix', data, layout, {responsive: true});
}

function displayTSNEVisualization(tsneData) {
    // Check if the tsne data is empty or invalid
    if (!tsneData || 
        !tsneData.stunting || 
        !tsneData.tidak_stunting || 
        !tsneData.stunting.x || 
        !tsneData.stunting.y || 
        !tsneData.tidak_stunting.x || 
        !tsneData.tidak_stunting.y) {
        
        // Display a message if data is invalid
        document.getElementById('tsneViz').innerHTML = 
            '<div class="alert alert-warning">Data t-SNE tidak tersedia atau mengandung nilai yang tidak valid.</div>';
        return;
    }
    
    // Purge any existing plot before creating a new one
    Plotly.purge('tsneViz');
    
    const trace1 = {
        x: tsneData.stunting.x,
        y: tsneData.stunting.y,
        mode: 'markers',
        marker: {
            size: 10,
            color: 'red',
            opacity: 0.7
        },
        type: 'scatter',
        name: 'Stunting'
    };

    const trace2 = {
        x: tsneData.tidak_stunting.x,
        y: tsneData.tidak_stunting.y,
        mode: 'markers',
        marker: {
            size: 10,
            color: 'blue',
            opacity: 0.7
        },
        type: 'scatter',
        name: 'Tidak Stunting'
    };

    const layout = {
        title: 't-SNE Visualization',
        xaxis: { title: 't-SNE Dimension 1' },
        yaxis: { title: 't-SNE Dimension 2' },
        margin: { l: 40, r: 20, b: 40, t: 50 }
    };

    Plotly.newPlot('tsneViz', [trace1, trace2], layout);
}

function displayPredictionTable(results) {
    let tableHtml = '';
    
    results.forEach(item => {
        tableHtml += `
            <tr>
                <td>${item.nama_keluarga}</td>
                <td>${item.actual}</td>
                <td>${item.predicted}</td>
                <td>
                    <span class="accuracy-indicator ${item.is_correct ? 'correct' : 'incorrect'}">
                        ${item.is_correct ? 'Benar' : 'Salah'}
                    </span>
                </td>
                <td>${(item.prob_stunting * 100).toFixed(2)}%</td>
                <td>${(item.prob_tidak_stunting * 100).toFixed(2)}%</td>
            </tr>
        `;
    });
    
    $('#predictionTableBody').html(tableHtml);
}

function displayBatchFeatureSelection(featureSelection) {
    // Show the feature selection card for batch processing
    $('#batchFeatureSelectionCard').addClass('feature-loading').show();
    
    // Show loading state first
    $('#batchFeatureSelectionCard .card-body').html(`
        <div class="text-center py-5">
            <div class="spinner-border text-warning" role="status">
                <span class="sr-only">Loading...</span>
            </div>
            <p class="mt-3 text-muted">Memproses Feature Selection untuk Batch Processing...</p>
        </div>
    `);
    
    // Scroll to feature selection card first
    $('html, body').animate({
        scrollTop: $('#batchFeatureSelectionCard').offset().top - 20
    }, 500);
    
    // Simulate processing time and then show results
    setTimeout(() => {
        // Restore original content structure with enhanced visualizations
        $('#batchFeatureSelectionCard .card-body').html(`
            <!-- Ringkasan Hasil Backward Elimination -->
            <div class="row mb-4">
                <div class="col-md-12">
                    <div class="alert alert-info">
                        <h6><i class="fas fa-info-circle"></i> Ringkasan Hasil Backward Elimination - Batch Processing</h6>
                        <div id="batchBackwardEliminationSummary"></div>
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
                                    <tbody id="batchModelComparisonTable">
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
                            <canvas id="batchFeatureImportanceChart" height="200"></canvas>
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
                            <div id="batchSelectedFeaturesList"></div>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card border-danger">
                        <div class="card-header bg-danger text-white">
                            <h6><i class="fas fa-times"></i> Fitur Tereliminasi</h6>
                        </div>
                        <div class="card-body" style="max-height: 200px; overflow-y: auto;">
                            <div id="batchEliminatedFeaturesList"></div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Grafik dan Visualisasi Feature Selection Batch -->
            <div class="row mt-3">
                <div class="col-md-6">
                    <div class="card border-primary">
                        <div class="card-header bg-primary text-white">
                            <h6><i class="fas fa-chart-line"></i> Timeline Seleksi Fitur - Batch</h6>
                        </div>
                        <div class="card-body">
                            <canvas id="batchFeatureSelectionTimelineChart" height="250"></canvas>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card border-success">
                        <div class="card-header bg-success text-white">
                            <h6><i class="fas fa-chart-area"></i> Perbandingan Performa Model - Batch</h6>
                        </div>
                        <div class="card-body">
                            <canvas id="batchModelPerformanceComparisonChart" height="250"></canvas>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Tabel Detailed Feature Analysis -->
            <div class="row mt-3">
                <div class="col-md-12">
                    <div class="card border-dark">
                        <div class="card-header bg-dark text-white">
                            <h6><i class="fas fa-table"></i> Analisis Detail Feature Selection - Batch</h6>
                        </div>
                        <div class="card-body">
                            <div class="table-responsive" style="max-height: 400px; overflow-y: auto;">
                                <table class="table table-sm table-striped table-bordered">
                                    <thead class="thead-dark sticky-top">
                                        <tr>
                                            <th>Fitur</th>
                                            <th>Status</th>
                                            <th>Importance Score</th>
                                            <th>Kontribusi Akurasi</th>
                                            <th>Step Eliminasi</th>
                                            <th>Keterangan</th>
                                        </tr>
                                    </thead>
                                    <tbody id="batchFeatureAnalysisTable">
                                        <!-- Data akan diisi oleh JavaScript -->
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Grafik Feature Impact -->
            <div class="row mt-3">
                <div class="col-md-8">
                    <div class="card border-warning">
                        <div class="card-header bg-warning text-dark">
                            <h6><i class="fas fa-chart-bar"></i> Impact Fitur Terhadap Prediksi - Batch</h6>
                        </div>
                        <div class="card-body">
                            <canvas id="batchFeatureImpactChart" height="200"></canvas>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card border-info">
                        <div class="card-header bg-info text-white">
                            <h6><i class="fas fa-percentage"></i> Ringkasan Optimasi - Batch</h6>
                        </div>
                        <div class="card-body">
                            <div id="batchOptimizationSummary">
                                <!-- Data akan diisi oleh JavaScript -->
                            </div>
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
                            <div id="batchEliminationSteps"></div>
                        </div>
                    </div>
                </div>
            </div>
        `);
        
        // Display backward elimination summary first
        displayBatchBackwardEliminationSummary(featureSelection);
        
        // Display model comparison
        displayBatchModelComparison(featureSelection.original_metrics, featureSelection.selected_metrics, featureSelection.improvement);
        
        // Display feature importance chart
        displayBatchFeatureImportanceChart(featureSelection.feature_importance);
        
        // Display elimination steps
        displayBatchEliminationSteps(featureSelection.elimination_steps);
        
        // Display selected and eliminated features
        displayBatchFeatureLists(featureSelection.selected_features, featureSelection.eliminated_features);
        
        // Display additional visualizations for batch
        displayBatchFeatureSelectionTimeline(featureSelection.elimination_steps);
        displayBatchModelPerformanceComparison(featureSelection.original_metrics, featureSelection.selected_metrics);
        displayBatchFeatureAnalysisTable(featureSelection);
        displayBatchFeatureImpactChart(featureSelection.feature_importance);
        displayBatchOptimizationSummary(featureSelection);
        
        // Add loaded class for animation
        $('#batchFeatureSelectionCard').removeClass('feature-loading').addClass('feature-loaded');
        
    }, 1500); // 1.5 second delay to show processing
}

// Batch-specific feature selection display functions
function displayBatchBackwardEliminationSummary(featureSelection) {
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
                <strong>Hasil Batch Processing:</strong><br>
                <small class="text-muted">
                    Backward Elimination pada batch processing berhasil mengurangi ${featureSelection.feature_count_reduction} fitur
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
    
    $('#batchBackwardEliminationSummary').html(summaryHtml);
}

function displayBatchModelComparison(original, selected, improvement) {
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
    
    $('#batchModelComparisonTable').html(tableHtml);
}

function displayBatchFeatureImportanceChart(importanceData) {
    const ctx = document.getElementById('batchFeatureImportanceChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (window.batchFeatureImportanceChart && typeof window.batchFeatureImportanceChart.destroy === 'function') {
        window.batchFeatureImportanceChart.destroy();
    }
    
    window.batchFeatureImportanceChart = new Chart(ctx, {
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
                    text: 'Feature Importance Ranking - Batch Processing'
                },
                legend: {
                    display: false
                }
            }
        }
    });
}

function displayBatchEliminationSteps(steps) {
    let stepsHtml = '<div class="mb-3"><h6 class="text-info">Proses Backward Elimination Step-by-Step (Batch Processing):</h6></div>';
    
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
            <h6 class="alert-heading"><i class="fas fa-check-circle"></i> Ringkasan Proses Batch</h6>
            <p class="mb-1">
                <strong>Total Steps:</strong> ${steps.length} langkah<br>
                <strong>Fitur Awal:</strong> ${steps[0].features.length} fitur<br>
                <strong>Fitur Akhir:</strong> ${steps[steps.length - 1].features.length} fitur<br>
                <strong>Akurasi Awal:</strong> ${(steps[0].accuracy * 100).toFixed(2)}%<br>
                <strong>Akurasi Akhir:</strong> ${(steps[steps.length - 1].accuracy * 100).toFixed(2)}%
            </p>
        </div>
    `;
    
    $('#batchEliminationSteps').html(stepsHtml);
}

function displayBatchFeatureLists(selectedFeatures, eliminatedFeatures) {
    // Display selected features
    let selectedHtml = '';
    if (selectedFeatures.length > 0) {
        selectedFeatures.forEach(feature => {
            selectedHtml += `<span class="badge badge-success mr-1 mb-1 p-2">${feature}</span>`;
        });
    } else {
        selectedHtml = '<p class="text-muted">Tidak ada fitur yang dipilih</p>';
    }
    $('#batchSelectedFeaturesList').html(selectedHtml);
    
    // Display eliminated features
    let eliminatedHtml = '';
    if (eliminatedFeatures.length > 0) {
        eliminatedFeatures.forEach(feature => {
            eliminatedHtml += `<span class="badge badge-danger mr-1 mb-1 p-2">${feature}</span>`;
        });
    } else {
        eliminatedHtml = '<p class="text-muted">Tidak ada fitur yang dieliminasi</p>';
    }
    $('#batchEliminatedFeaturesList').html(eliminatedHtml);
}

// Additional Batch Feature Selection Visualization Functions
function displayBatchFeatureSelectionTimeline(eliminationSteps) {
    const ctx = document.getElementById('batchFeatureSelectionTimelineChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (window.batchFeatureTimelineChart && typeof window.batchFeatureTimelineChart.destroy === 'function') {
        window.batchFeatureTimelineChart.destroy();
    }
    
    const steps = eliminationSteps.map((step, index) => `Step ${index}`);
    const accuracyData = eliminationSteps.map(step => step.accuracy * 100);
    const featureCount = eliminationSteps.map(step => step.features.length);
    
    window.batchFeatureTimelineChart = new Chart(ctx, {
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
                    text: 'Timeline Proses Feature Selection - Batch'
                },
                legend: {
                    display: true,
                    position: 'top'
                }
            }
        },
    });
}

function displayBatchModelPerformanceComparison(originalMetrics, selectedMetrics) {
    const ctx = document.getElementById('batchModelPerformanceComparisonChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (window.batchPerformanceComparisonChart && typeof window.batchPerformanceComparisonChart.destroy === 'function') {
        window.batchPerformanceComparisonChart.destroy();
    }
    
    const metrics = ['accuracy', 'precision', 'recall', 'f1_score'];
    const metricLabels = ['Akurasi', 'Presisi', 'Recall', 'F1-Score'];
    
    const originalData = metrics.map(metric => originalMetrics[metric] * 100);
    const selectedData = metrics.map(metric => selectedMetrics[metric] * 100);
    
    window.batchPerformanceComparisonChart = new Chart(ctx, {
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
                    text: 'Perbandingan Performa Model - Batch'
                },
                legend: {
                    display: true,
                    position: 'top'
                }
            }
        }
    });
}

function displayBatchFeatureAnalysisTable(featureSelection) {
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
                        'Fitur berkontribusi positif terhadap akurasi model batch' :
                        'Fitur tidak memberikan kontribusi signifikan pada batch processing'
                    }
                </td>
            </tr>
        `;
    });
    
    $('#batchFeatureAnalysisTable').html(tableHtml);
}

function displayBatchFeatureImpactChart(featureImportance) {
    const ctx = document.getElementById('batchFeatureImpactChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (window.batchFeatureImpactChart && typeof window.batchFeatureImpactChart.destroy === 'function') {
        window.batchFeatureImpactChart.destroy();
    }
    
    // Create gradient colors for bars
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(75, 192, 192, 0.8)');
    gradient.addColorStop(1, 'rgba(75, 192, 192, 0.2)');
    
    window.batchFeatureImpactChart = new Chart(ctx, {
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
                    text: 'Impact Fitur Terhadap Prediksi Stunting - Batch'
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

function displayBatchOptimizationSummary(featureSelection) {
    const totalFeatures = featureSelection.selected_features.length + featureSelection.eliminated_features.length;
    const reductionPercentage = ((featureSelection.eliminated_features.length / totalFeatures) * 100).toFixed(1);
    const accuracyImprovement = (featureSelection.improvement.accuracy * 100).toFixed(2);
    const improvementClass = featureSelection.improvement.accuracy >= 0 ? 'text-success' : 'text-danger';
    const improvementIcon = featureSelection.improvement.accuracy >= 0 ? 'fa-arrow-up' : 'fa-arrow-down';
    
    const summaryHtml = `
        <div class="text-center mb-3">
            <h5 class="text-primary">Hasil Optimasi Batch</h5>
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
            <strong>Kesimpulan Batch:</strong><br>
            ${featureSelection.improvement.accuracy >= 0 ?
                `Model batch berhasil dioptimalkan dengan mengurangi ${featureSelection.eliminated_features.length} fitur sambil ${accuracyImprovement === '0.00' ? 'mempertahankan' : 'meningkatkan'} akurasi.` :
                `Model batch mengalami penurunan akurasi ${Math.abs(parseFloat(accuracyImprovement))}% setelah pengurangan fitur.`
            }
        </div>
        
        <div class="text-center mt-3">
            <small class="text-muted">
                <i class="fas fa-clock"></i>
                Proses batch eliminasi: ${featureSelection.elimination_steps.length} langkah
            </small>
        </div>
    `;
    
    $('#batchOptimizationSummary').html(summaryHtml);
}
