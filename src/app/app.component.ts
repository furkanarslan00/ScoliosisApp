import { Component, Inject, PLATFORM_ID, ChangeDetectorRef, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { ChartData, ChartOptions } from 'chart.js';

interface SensorValue {
  timestamp: string;
  value: number;
}

interface SensorData {
  name: string;
  values: SensorValue[];
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'scoliosisapp';
  isBrowser: boolean;
  referencePressure = 96;
  dataLoaded = false;
  selectedSensor: string = 'FSR1'; 
  selectedGraph: string = 'all'; 


  public lineChartLegend = true;

  // 1. Real-time Line Chart
  public realtimeChartData: ChartData<'line'> = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Real Time Pressure',
        fill: true,
        borderColor: 'blue',
        backgroundColor: 'rgba(75,192,192,0.2)',
        tension: 0.4,
      },
      {
        data: [],
        label: 'Reference Pressure',
        borderColor: 'red',
        borderDash: [10, 5],
        pointRadius: 0,
        borderWidth: 2,
        fill: false,
      }
    ],
  };

   // 2. Daily Trend Chart
  public dailyTrendChartData: ChartData<'line'> = {
    labels: [], 
    datasets: [{
      data: [], 
      label: 'Daily Average',
      borderColor: '#FF5722',
      fill: false,
    }]
  };

   // 3. Hourly Trend Chart
   public trendChartData: ChartData<'line'> = {
    labels: [],
    datasets: [{
      data: [],
      label: 'Hourly Average',
      borderColor: '#9C27B0',
      fill: false,
    }]
  };
  

  // 4. Pressure Distribution Chart
  public distributionChartData: ChartData<'pie'> = {
    labels: ['Low', 'Medium', 'High'],
    datasets: [{
      data: [],
      backgroundColor: ['#81C784', '#FFB74D', '#E57373'],
    }]
  };

  // 5. Average Pressure Bar Chart
  public averageChartData: ChartData<'bar'> = {
    labels: ['Average Pressure'],
    datasets: [{
      data: [],
      label: 'Average Pressure',
      backgroundColor: '#4CAF50',
    }]
  };


  // 6. Threshold Comparison Chart
  public thresholdChartData: ChartData<'bar'> = {
    labels: ['Below', 'Within', 'Above'],
    datasets: [{
      data: [],
      label: 'Readings vs Threshold',
      backgroundColor: ['#90CAF9', '#81C784', '#E57373'],
    }]
  };

  // Chart Options
  public lineChartOptions: ChartOptions<'line'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Real-time Pressure Readings'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 250,
        title: {
          display: true,
          text: 'Pressure (N)'
        }
      }
    }
  };

  public lineChartOptions2: ChartOptions<'line'> = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: 'top',
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Pressure (N)'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Time'
        }
      }
    }
  };

  updateCharts() {
    console.log('Sensor selected:', this.selectedSensor);
    this.fetchData();
  }

  public barChartOptionsforTresh: ChartOptions<'bar'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Readings'
        }
      }
    }
  };

  public barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Pressure(N)'
        }
      }
    }
  };

  private calculateDailyTrend(data: SensorValue[]): { labels: string[]; averages: number[] } {
    const dailyData = new Map<string, number[]>();
  
    // Verileri günlere göre grupla
    data.forEach(reading => {
      const date = new Date(reading.timestamp);
      const day = `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;  
      if (!dailyData.has(day)) {
        dailyData.set(day, []);
      }
      dailyData.get(day)?.push(reading.value);
    });
  
    // Ortalama değerleri hesapla
    const labels: string[] = [];
    const averages: number[] = [];
  
    dailyData.forEach((values, day) => {
      labels.push(day);
      averages.push(values.reduce((a, b) => a + b, 0) / values.length);  
    });
  
    return { labels, averages };
  }

  

  public pieChartOptions: ChartOptions<'pie'> = {
    responsive: true,
    aspectRatio: 1.6,
    plugins: {
      legend: {
        position: 'top',
      }
    }
  };

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: object,
    private cdr: ChangeDetectorRef
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit() {
    if (this.isBrowser) {
      this.fetchData(); 
    }
  }

  private calculateStats(values: number[]): {
    avg: number;
    min: number;
    max: number;
    low: number;
    medium: number;
    high: number;
    below: number;
    within: number;
    above: number;
  } {
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);

    // Calculate distribution
    const low = values.filter(v => v < avg * 0.7).length;
    const medium = values.filter(v => v >= avg * 0.7 && v <= avg * 1.3).length;
    const high = values.filter(v => v > avg * 1.3).length;

    // Calculate threshold comparison
    const below = values.filter(v => v < 96).length;
    const within = values.filter(v => v >= 96 && v <= 192).length;
    const above = values.filter(v => v > 192).length;

    return { avg, min, max, low, medium, high, below, within, above };
  }

  private calculateHourlyTrend(data: SensorValue[]): { hours: number[]; averages: number[] } {
    const hourlyData = new Map<number, number[]>();

    data.forEach(reading => {
      const hour = new Date(reading.timestamp).getHours();
      if (!hourlyData.has(hour)) {
        hourlyData.set(hour, []);
      }
      hourlyData.get(hour)?.push(reading.value);
    });

    const hours: number[] = [];
    const averages: number[] = [];

    hourlyData.forEach((values, hour) => {
      hours.push(hour);
      averages.push(values.reduce((a, b) => a + b, 0) / values.length);
    });

    return { hours, averages };
  }

  fetchData() {
    this.http
      .get<SensorData[]>(
        'https://scolisensemvpserver-azhpd3hchqgsc8bm.germanywestcentral-01.azurewebsites.net/api/sensor'
      )
      .subscribe({
        next: (response) => {
          if (response && response.length > 0) {
            const selectedSensorData = response.find(sensor => sensor.name === this.selectedSensor);
  
            if (selectedSensorData && selectedSensorData.values) {
              let sensorData = selectedSensorData.values;
              const values = sensorData.map(point => point.value);
              const timestamps = sensorData.map(point =>
                new Date(point.timestamp).toLocaleTimeString()
              );
  
              // **Real-time Pressure Readings** için son 50 veriyi alıyoruz
              const realTimeValues = values.length > 100 ? values.slice(-100) : values;
              const realTimeTimestamps = timestamps.length > 100 ? timestamps.slice(-100) : timestamps;
  
              // Referans basıncıyla aynı uzunlukta bir dizi oluşturuyoruz
              const referenceValues = new Array(realTimeValues.length).fill(this.referencePressure);
  
              // **Real-time Pressure Readings** grafiğini güncelle
              this.realtimeChartData = {
                labels: realTimeTimestamps,
                datasets: [
                  {
                    data: realTimeValues,
                    label: 'Real Time Pressure',
                    fill: true,
                    borderColor: 'blue',
                    backgroundColor: 'rgba(75,192,192,0.2)',
                    tension: 0.4,
                  },
                  {
                    data: referenceValues,
                    label: 'Reference Pressure',
                    borderColor: 'red',
                    borderDash: [10, 5],
                    pointRadius: 0,
                    borderWidth: 1,
                    fill: false,
                  }
                ]
              };
  
           
              const stats = this.calculateStats(values);
  
              this.averageChartData = {
                ...this.averageChartData,
                datasets: [{
                  ...this.averageChartData.datasets[0],
                  data: [stats.avg]
                }]
              };


              const lowRange = '< 120'; 
              const mediumRange = '120 - 180'; 
              const highRange = '> 180'; 
  
              this.distributionChartData = {
                labels: [`Low (${lowRange})`, `Medium (${mediumRange})`, `High (${highRange})`], // Updated labels with ranges
                datasets: [{
                  ...this.distributionChartData.datasets[0],
                  data: [stats.low, stats.medium, stats.high]
                }]
              };
  
              const trend = this.calculateHourlyTrend(sensorData);
              this.trendChartData = {
                ...this.trendChartData,
                labels: trend.hours.map(h => `${h}:00`),
                datasets: [{
                  ...this.trendChartData.datasets[0],
                  data: trend.averages
                }]
              };
  
              const dailyTrend = this.calculateDailyTrend(sensorData);
              this.dailyTrendChartData = {
                labels: dailyTrend.labels,
                datasets: [{
                  data: dailyTrend.averages,
                  label: 'Daily Average',
                  borderColor: '#FF5722',
                  fill: false,
                }]
              };
  
              this.thresholdChartData = {
                ...this.thresholdChartData,
                labels: ['Below (< 96)', 'Within (96 - 192)', 'Above (> 192)'], 
                datasets: [{
                  ...this.thresholdChartData.datasets[0],
                  data: [stats.below, stats.within, stats.above]
                }]
              };
              
  
              this.dataLoaded = true;
              this.cdr.detectChanges();
            }
          }
        },
        error: (error) => {
          console.error('Error fetching sensor data:', error);
        }
      });
  }
  
  
}