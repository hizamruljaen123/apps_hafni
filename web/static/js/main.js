async function fetchCombinedData() {
    try {
        // Mengambil data dari API train_data
        const trainResponse = await fetch('/test_data');
        const trainData = await trainResponse.json();

        // Mengambil data dari API test
        const testResponse = await fetch('/test');
        const testData = await testResponse.json();

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
                <td>${item.nama_keluarga}</td>
                <td>${item.jenis_kelamin}</td>
                <td>${item.usia}</td>
                <td>${item.tinggi}</td>
                <td>${item.berat}</td>
                <td>${item.pendapatan}</td>
                <td>${item.air_bersih}</td>
                <td>${item.kondisi_sanitasi}</td>
                <td>${item.susu_formula}</td>
                <td>${item.status_stunting_predicted}</td>
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
                        text: 'Frekuensi Prediksi Stunting Berdasarkan Rentang Pendapatan'
                    }
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
        const data = await response.json();

        let tbody = '';

        // Mengisi tbody dengan data
        data.forEach(item => {
            tbody += `<tr>
                <td>${item.Nama}</td>
                <td>${item.jenis_kelamin}</td>
                <td>${item.usia}</td>
                <td>${item.tinggi}</td>
                <td>${item.berat}</td>
                <td>${item.pendapatan}</td>
                <td>${item.air_bersih}</td>
                <td>${item.kondisi_sanitasi}</td>
                <td>${item.susu_formula}</td>
                <td>${item.status_stunting}</td>
            </tr>`;
        });

        // Menampilkan tbody di elemen dengan id 'data-test'
        document.getElementById('data-training').innerHTML = tbody;
    } catch (error) {
        console.error('Error fetching train data:', error);
    }
}


fetchCombinedData()

fetchTrainData()