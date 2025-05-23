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
