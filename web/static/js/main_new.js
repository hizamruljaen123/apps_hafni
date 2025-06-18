/**
 * Aplikasi Dashboard Stunting - Fixed JS
 */

// Load data when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Initialize charts and fetch data
    fetchCombinedData();
    fetchTrainData();
    fetchEvaluationData();
    fetchAgeAnalysisData();
});

// Fungsi untuk memuat data gabungan test dan prediksi
async function fetchCombinedData() {
    try {
        // Mengambil data dari API train_data
        const trainResponse = await fetch('/test_data');
        const trainResult = await trainResponse.json();
        
        // Handle new API response format
        const trainData = trainResult.data || trainResult;

        // Mengambil data dari API test
        const testResponse = await fetch('/test');
        const testResult = await testResponse.json();
        
        // Handle new API response format
        const testData = testResult.predictions || testResult;

        // Validate data
        if (!Array.isArray(trainData) || !Array.isArray(testData)) {
            console.error('Invalid data format:', { trainData, testData });
            return;
        }

        // Menggabungkan data
        let combinedData = trainData.map(trainItem => {
            const testItem = testData.find(test => test.nama_keluarga === trainItem.nama_keluarga);
            return {
                ...trainItem,
                status_stunting_predicted: testItem ? testItem.status_stunting_predicted : 'Tidak Ditemukan'
            };
        });

        let tbody = '';

        // Mengisi tbody dengan data yang sudah digabungkan
        combinedData.forEach(item => {
            tbody += `<tr>
                <td class="text-left">${item.nama_keluarga || '-'}</td>
                <td class="text-left">${item.jenis_kelamin || '-'}</td>
                <td class="text-left">${item.usia || '-'}</td>
                <td class="text-left">${item.tinggi || '-'}</td>
                <td class="text-left">${item.berat || '-'}</td>
                <td class="text-left">${item.pendapatan || '-'}</td>
                <td class="text-left">${item.air_bersih || '-'}</td>
                <td class="text-left">${item.kondisi_sanitasi || '-'}</td>
                <td class="text-left">${item.susu_formula || '-'}</td>
                <td class="text-left">${item.status_stunting_predicted || '-'}</td>
            </tr>`;
        });

        // Menampilkan tbody di elemen dengan id 'data-test'
        document.getElementById('data-test').innerHTML = tbody;

        // Menghitung frekuensi prediksi stunting berdasarkan jenis kelamin
        const stuntingCounts = {
            'Laki-laki': { Stunting: 0, 'Tidak Stunting': 0 },
            'Perempuan': { Stunting: 0, 'Tidak Stunting': 0 }
        };

        combinedData.forEach(item => {
            if (stuntingCounts[item.jenis_kelamin]) {
                stuntingCounts[item.jenis_kelamin][item.status_stunting_predicted]++;
            }
        });

        // Menghitung frekuensi prediksi stunting berdasarkan rentang pendapatan
        const incomeRanges = {
            '< 1 Juta': { Stunting: 0, 'Tidak Stunting': 0 },
            '1-2 Juta': { Stunting: 0, 'Tidak Stunting': 0 },
            '2-3 Juta': { Stunting: 0, 'Tidak Stunting': 0 },
            '3-4 Juta': { Stunting: 0, 'Tidak Stunting': 0 },
            '> 4 Juta': { Stunting: 0, 'Tidak Stunting': 0 }
        };

        combinedData.forEach(item => {
            let range;
            if (item.pendapatan < 1000000) range = '< 1 Juta';
            else if (item.pendapatan < 2000000) range = '1-2 Juta';
            else if (item.pendapatan < 3000000) range = '2-3 Juta';
            else if (item.pendapatan < 4000000) range = '3-4 Juta';
            else range = '> 4 Juta';

            incomeRanges[range][item.status_stunting_predicted]++;
        });

        // Generate Chart.js data for stuntingChart
        const stuntingCtx = document.getElementById('stuntingChart');
        if (stuntingCtx) {
            new Chart(stuntingCtx.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: ['Laki-laki', 'Perempuan'],
                    datasets: [
                        {
                            label: 'Stunting',
                            data: [stuntingCounts['Laki-laki'].Stunting, stuntingCounts['Perempuan'].Stunting],
                            backgroundColor: 'rgba(255, 99, 132, 0.8)',
                            borderColor: 'rgba(255, 99, 132, 1)',
                            borderWidth: 1
                        },
                        {
                            label: 'Tidak Stunting',
                            data: [stuntingCounts['Laki-laki']['Tidak Stunting'], stuntingCounts['Perempuan']['Tidak Stunting']],
                            backgroundColor: 'rgba(54, 162, 235, 0.8)',
                            borderColor: 'rgba(54, 162, 235, 1)',
                            borderWidth: 1
                        }
                    ]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Jumlah'
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: 'Jenis Kelamin'
                            }
                        }
                    },
                    plugins: {
                        title: {
                            display: true,
                            text: 'Frekuensi Prediksi Stunting Berdasarkan Jenis Kelamin'
                        }
                    }
                }
            });
        }

        // Generate Chart.js data for incomeChart
        const incomeCtx = document.getElementById('incomeChart');
        if (incomeCtx) {
            new Chart(incomeCtx.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: ['< 1 Juta', '1-2 Juta', '2-3 Juta', '3-4 Juta', '> 4 Juta'],
                    datasets: [
                        {
                            label: 'Stunting',
                            data: [
                                incomeRanges['< 1 Juta'].Stunting,
                                incomeRanges['1-2 Juta'].Stunting,
                                incomeRanges['2-3 Juta'].Stunting,
                                incomeRanges['3-4 Juta'].Stunting,
                                incomeRanges['> 4 Juta'].Stunting
                            ],
                            backgroundColor: 'rgba(255, 99, 132, 0.8)',
                            borderColor: 'rgba(255, 99, 132, 1)',
                            borderWidth: 1
                        },
                        {
                            label: 'Tidak Stunting',
                            data: [
                                incomeRanges['< 1 Juta']['Tidak Stunting'],
                                incomeRanges['1-2 Juta']['Tidak Stunting'],
                                incomeRanges['2-3 Juta']['Tidak Stunting'],
                                incomeRanges['3-4 Juta']['Tidak Stunting'],
                                incomeRanges['> 4 Juta']['Tidak Stunting']
                            ],
                            backgroundColor: 'rgba(54, 162, 235, 0.8)',
                            borderColor: 'rgba(54, 162, 235, 1)',
                            borderWidth: 1
                        }
                    ]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Jumlah'
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: 'Rentang Pendapatan'
                            }
                        }
                    },
                    plugins: {
                        title: {
                            display: true,
                            text: 'Frekuensi Prediksi Stunting Berdasarkan Rentang Pendapatan'
                        }
                    }
                }
            });
        }
    } catch (error) {
        console.error('Error fetching combined data:', error);
    }
}

async function fetchTrainData() {
    try {
        const response = await fetch('/train_data');
        const result = await response.json();
        
        // Handle new API response format
        const data = result.data || result;

        let tbody = '';

        // Validate data
        if (!Array.isArray(data)) {
            console.error('Invalid training data format:', data);
            return;
        }

        // Mengisi tbody dengan data
        data.forEach(item => {
            tbody += `<tr>
                <td class="text-left">${item.Nama || item.nama || '-'}</td>
                <td class="text-left">${item.jenis_kelamin || '-'}</td>
                <td class="text-left">${item.usia || '-'}</td>
                <td class="text-left">${item.tinggi || '-'}</td>
                <td class="text-left">${item.berat || '-'}</td>
                <td class="text-left">${item.pendapatan || '-'}</td>
                <td class="text-left">${item.air_bersih || '-'}</td>
                <td class="text-left">${item.kondisi_sanitasi || '-'}</td>
                <td class="text-left">${item.susu_formula || '-'}</td>
                <td class="text-left">${item.status_stunting || '-'}</td>
            </tr>`;
        });

        // Menampilkan tbody di elemen dengan id 'data-training'
        document.getElementById('data-training').innerHTML = tbody;
    } catch (error) {
        console.error('Error fetching train data:', error);
    }
}

async function fetchEvaluationData() {
    try {
        const response = await fetch('/evaluate'); 
        const data = await response.json();
        
        if (data.error) {
            console.error('Error from server:', data.error);
            return;
        }
        
        document.getElementById('accuracy').textContent = data.accuracy.toFixed(3);
        document.getElementById('f1-score').textContent = data.f1_score.toFixed(3);
        document.getElementById('precision').textContent = data.precision.toFixed(3);
        document.getElementById('recall').textContent = data.recall.toFixed(3);
        document.getElementById('stunting').textContent = data.prediction_distribution.Stunting.toFixed(2);
        document.getElementById('not-stunting').textContent = data.prediction_distribution["Tidak Stunting"].toFixed(2);
    } catch (error) {
        console.error('Gagal mengambil data:', error);
    }
}

// Fetch data untuk analisa berdasarkan usia balita
async function fetchAgeAnalysisData() {
    try {
        const response = await fetch('/analysis_by_age');
        const data = await response.json();
        
        if (!data.chart_data) {
            console.error("Invalid response format from analysis_by_age:", data);
            return;
        }
        
        // Data untuk chart (format baru)
        const ageLabels = data.chart_data.usia_group.map(item => `${item} bulan`);
        const normalData = data.chart_data["Tidak Stunting"];
        const stuntingData = data.chart_data["Stunting"];
        
        // Membuat chart
        const ctx = document.getElementById('ageChart');
        if (ctx) {
            new Chart(ctx.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: ageLabels,
                    datasets: [{
                        label: 'Normal',
                        data: normalData,
                        backgroundColor: 'rgba(54, 162, 235, 0.8)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1
                    }, {
                        label: 'Stunting',
                        data: stuntingData,
                        backgroundColor: 'rgba(255, 99, 132, 0.8)',
                        borderColor: 'rgba(255, 99, 132, 1)',
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
                                text: 'Kelompok Usia'
                            }
                        }
                    },
                    plugins: {
                        title: {
                            display: true,
                            text: 'Distribusi Status Stunting Berdasarkan Usia Balita'
                        },
                        legend: {
                            display: true,
                            position: 'top'
                        }
                    }
                }
            });
        }
        
        // Isi tabel (format baru)
        let tableHtml = '';
        data.table_data.forEach(item => {
            const normalCount = item["Tidak Stunting"] || 0;
            const stuntingCount = item["Stunting"] || 0;
            const total = normalCount + stuntingCount;
            const stuntingPercentage = total > 0 ? ((stuntingCount / total) * 100).toFixed(1) : '0.0';
            
            tableHtml += `
                <tr>
                    <td>${item.usia_group}</td>
                    <td class="text-center">${normalCount}</td>
                    <td class="text-center">${stuntingCount}</td>
                    <td class="text-center"><strong>${total}</strong></td>
                    <td class="text-center">
                        <span class="badge ${parseFloat(stuntingPercentage) > 50 ? 'badge-danger' : 'badge-warning'}">
                            ${stuntingPercentage}%
                        </span>
                    </td>
                </tr>
            `;
        });
        
        const ageTableBody = document.getElementById('ageAnalysisTableBody');
        if (ageTableBody) {
            ageTableBody.innerHTML = tableHtml;
        }
        
    } catch (error) {
        console.error('Error fetching age analysis data:', error);
        // Show error message in table
        const ageTableBody = document.getElementById('ageAnalysisTableBody');
        if (ageTableBody) {
            ageTableBody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Error loading data</td></tr>';
        }
    }
}
