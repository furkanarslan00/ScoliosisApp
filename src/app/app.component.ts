import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { ChartData, ChartOptions } from 'chart.js';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'scoliosisapp';

// Line Chart for FSR Data
public lineChartData: ChartData<'line'> = {
  labels: [],
  datasets: [
    {
      data: [], // Gerçek zamanlı FSR verileri
      label: 'FSR Basınç Değeri',
      fill: true,
      borderColor: 'blue',
      backgroundColor: 'rgba(75,192,192,0.2)',
      tension: 0.4,
    },
    {
      data: [], // Referans basıncı için veri
      label: 'Referans Basıncı',
      borderColor: 'red',
      borderDash: [10, 5], // Kesikli çizgi
      pointRadius: 0, // Nokta olmaması için
      borderWidth: 2, // Çizgi kalınlığı
    },
  ],
};


  public lineChartOptions: ChartOptions<'line'> = {
    responsive: true,
  };

  public lineChartLegend = true;

  // Bar Chart for Average Pressure
  public averagePressureData: ChartData<'bar'> = {
    labels: ['FSR Ortalama Basıncı'],
    datasets: [
      {
        data: [],
        label: 'Ortalama Basınç',
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
      }
    ]
  };

  public averagePressureOptions: ChartOptions<'bar'> = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            return `${context.dataset.label}: ${context.raw} N`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 400, 
        title: {
          display: true,
        },
      },

    },
  };
  

  isBrowser: boolean;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit() {
    this.fetchData();
  }

  fetchData() {
    this.http
      .get<any>('https://scolisensemvpserver-azhpd3hchqgsc8bm.germanywestcentral-01.azurewebsites.net/api/sensor')
      .subscribe((response) => {
        if (response && response[0] && response[0].values) {
          const sensorData = response[0].values;
  
          // Line Chart Data for FSR
          const labels = sensorData.map((dataPoint: any) => {
            const date = new Date(dataPoint.timestamp);
            return date.toLocaleTimeString();
          });
  
          const data = sensorData.map((dataPoint: any) => dataPoint.value);
  
          this.lineChartData.labels = labels;
          this.lineChartData.datasets[0].data = data;
  
          // Referans Basıncı
          const referencePressure = 500; // Referans basıncı (örnek değer)
          this.lineChartData.datasets[1].data = new Array(data.length).fill(referencePressure);
  
          // Average Pressure Data
          const averagePressure = this.calculateAverage(data);
          this.averagePressureData.datasets[0].data = [averagePressure];
          this.averagePressureData.labels = ['FSR Ortalama Basıncı'];
        } else {
          console.error('Beklenen veri formatı alınamadı:', response);
        }
      });
  }
  
  calculateAverage(data: number[]): number {
    if (data.length === 0) return 0; 
    return data.reduce((sum, value) => sum + value, 0) / data.length;
  }
  
}