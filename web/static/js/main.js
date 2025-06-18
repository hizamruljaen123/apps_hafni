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

        // Menggabungkan data
        let combinedData = trainData.map(trainItem => {
            const testItem = testData.find(test => test.nama_keluarga === trainItem.nama_keluarga);
            return {
                ...trainItem,
                status_stunting_predicted: testItem ? testItem.status_stunting_predicted : 'Tidak Ditemukan'
            };
        });

        let tbody = '';        // Bersihkan data sebelum dirender
        const sanitizedData = window.DataValidator.sanitizeTableData(combinedData);
        
        // Mengisi tbody dengan data yang sudah digabungkan dan dibersihkan
        sanitizedData.forEach(item => {
            tbody += `<tr>
                <td class="text-left">${item.nama_keluarga || '-'}</td>
                <td class="text-left">${item.jenis_kelamin}</td>
                <td class="text-left">${item.usia}</td>
                <td class="text-left">${item.tinggi}</td>
                <td class="text-left">${item.berat}</td>
                <td class="text-left">${item.pendapatan}</td>
                <td class="text-left">${item.air_bersih || '-'}</td>
                <td class="text-left">${item.kondisi_sanitasi}</td>
                <td class="text-left">${item.susu_formula}</td>
                <td class="text-left">${item.status_stunting_predicted}</td>
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

        // Menyiapkan data untuk grafik frekuensi prediksi stunting berdasarkan jenis kelamin
        const genderLabels = ['Laki-laki Stunting', 'Laki-laki Tidak Stunting', 'Perempuan Stunting', 'Perempuan Tidak Stunting'];
        const genderData = [
            stuntingCounts['Laki-laki'].Stunting,
            stuntingCounts['Laki-laki']['Tidak Stunting'],
            stuntingCounts['Perempuan'].Stunting,
            stuntingCounts['Perempuan']['Tidak Stunting']
        ];

        // Membuat grafik doughnut frekuensi prediksi stunting berdasarkan jenis kelamin
        const ctx1 = document.getElementById('stuntingChart').getContext('2d');
        new Chart(ctx1, {
            type: 'doughnut',
            data: {
                labels: genderLabels,
                datasets: [{
                    label: 'Frekuensi Prediksi Stunting Berdasarkan Jenis Kelamin',
                    data: genderData,
                    backgroundColor: [
                        'rgba(75, 192, 192, 0.5)', // Laki-laki Stunting
                        'rgba(255, 99, 132, 0.5)', // Laki-laki Tidak Stunting
                        'rgba(54, 162, 235, 0.5)', // Perempuan Stunting
                        'rgba(255, 206, 86, 0.5)'   // Perempuan Tidak Stunting
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Frekuensi Prediksi Stunting Berdasarkan Jenis Kelamin'
                    }
                }
            }
        });

        // Menghitung frekuensi prediksi stunting berdasarkan rentang pendapatan
        const incomeRanges = {
            '0 - 500000': { Stunting: 0, 'Tidak Stunting': 0 },
            '500001 - 1000000': { Stunting: 0, 'Tidak Stunting': 0 },
            '1000001 - 1500000': { Stunting: 0, 'Tidak Stunting': 0 },
            '1500001 - 2000000': { Stunting: 0, 'Tidak Stunting': 0 },
            '2000001 ke atas': { Stunting: 0, 'Tidak Stunting': 0 }
        };

        combinedData.forEach(item => {
            let range = '';

            // Menentukan rentang pendapatan
            if (item.pendapatan <= 500000) {
                range = '0 - 500000';
            } else if (item.pendapatan <= 1000000) {
                range = '500001 - 1000000';
            } else if (item.pendapatan <= 1500000) {
                range = '1000001 - 1500000';
            } else if (item.pendapatan <= 2000000) {
                range = '1500001 - 2000000';
            } else {
                range = '2000001 ke atas';
            }

            // Mengupdate jumlah berdasarkan rentang dan status stunting
            if (incomeRanges[range]) {
                incomeRanges[range][item.status_stunting_predicted]++;
            }
        });

        // Menyiapkan data untuk grafik frekuensi prediksi stunting berdasarkan rentang pendapatan
        const incomeLabels = Object.keys(incomeRanges);
        const incomeData = [
            incomeRanges['0 - 500000'].Stunting,
            incomeRanges['0 - 500000']['Tidak Stunting'],
            incomeRanges['500001 - 1000000'].Stunting,
            incomeRanges['500001 - 1000000']['Tidak Stunting'],
            incomeRanges['1000001 - 1500000'].Stunting,
            incomeRanges['1000001 - 1500000']['Tidak Stunting'],
            incomeRanges['1500001 - 2000000'].Stunting,
            incomeRanges['1500001 - 2000000']['Tidak Stunting'],
            incomeRanges['2000001 ke atas'].Stunting,
            incomeRanges['2000001 ke atas']['Tidak Stunting']
        ];

        // Membuat grafik doughnut frekuensi prediksi stunting berdasarkan rentang pendapatan
        const ctx2 = document.getElementById('incomeChart').getContext('2d');
        new Chart(ctx2, {
            type: 'doughnut',
            data: {
                labels: incomeLabels,
                datasets: [{
                    label: 'Frekuensi Prediksi Stunting Berdasarkan Rentang Pendapatan',
                    data: incomeData,
                    backgroundColor: [
                        'rgba(75, 192, 192, 0.5)', // Stunting Rentang 0 - 500000
                        'rgba(255, 99, 132, 0.5)', // Tidak Stunting Rentang 0 - 500000
                        'rgba(54, 162, 235, 0.5)', // Stunting Rentang 500001 - 1000000
                        'rgba(255, 206, 86, 0.5)', // Tidak Stunting Rentang 500001 - 1000000
                        'rgba(75, 192, 192, 0.5)', // Stunting Rentang 1000001 - 1500000
                        'rgba(255, 99, 132, 0.5)', // Tidak Stunting Rentang 1000001 - 1500000
                        'rgba(54, 162, 235, 0.5)', // Stunting Rentang 1500001 - 2000000
                        'rgba(255, 206, 86, 0.5)', // Tidak Stunting Rentang 1500001 - 2000000
                        'rgba(75, 192, 192, 0.5)', // Stunting Rentang 2000001 ke atas
                        'rgba(255, 99, 132, 0.5)'  // Tidak Stunting Rentang 2000001 ke atas
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Frekuensi Prediksi Stunting Berdasarkan Rentang Pendapatan'                    }
                }
            }
        });
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

        // Mengisi tbody dengan data
        data.forEach(item => {
            tbody += `<tr>
                <td class="text-left">${item.Nama || item.nama}</td>
                <td class="text-left">${item.jenis_kelamin}</td>
                <td class="text-left">${item.usia}</td>
                <td class="text-left">${item.tinggi}</td>
                <td class="text-left">${item.berat}</td>
                <td class="text-left">${item.pendapatan}</td>
                <td class="text-left">${item.air_bersih}</td>
                <td class="text-left">${item.kondisi_sanitasi}</td>
                <td class="text-left">${item.susu_formula}</td>
                <td class="text-left">${item.status_stunting}</td>
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
        const response = await fetch('/evaluate'); // Gunakan relative URL
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

fetchEvaluationData()

fetchCombinedData()

fetchTrainData()

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
        const ctx = document.getElementById('ageChart').getContext('2d');
        new Chart(ctx, {
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
        document.getElementById('ageAnalysisTableBody').innerHTML = tableHtml;
        
    } catch (error) {
        console.error('Error fetching age analysis data:', error);
        // Show error message in table
        document.getElementById('ageAnalysisTableBody').innerHTML =
            '<tr><td colspan="5" class="text-center text-muted">Error loading data</td></tr>';
    }
}

// Load all data
document.addEventListener('DOMContentLoaded', function() {
    // Use try-catch untuk setiap fungsi terpisah
    try { fetchEvaluationData(); } catch (e) { console.error(e); }
    try { fetchCombinedData(); } catch (e) { console.error(e); }
    try { fetchTrainData(); } catch (e) { console.error(e); }
    try { fetchAgeAnalysisData(); } catch (e) { console.error(e); }
});

// Menghapus panggilan fungsi yang terpisah
// fetchEvaluationData()
// fetchCombinedData()
// fetchTrainData()
// fetchAgeAnalysisData()