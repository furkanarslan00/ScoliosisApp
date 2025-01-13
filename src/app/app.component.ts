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
  referencePressure = 500;
  dataLoaded = false;

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

  public lineChartLegend = true;

  // 2. Average Pressure Bar Chart
  public averageChartData: ChartData<'bar'> = {
    labels: ['Average Pressure'],
    datasets: [{
      data: [],
      label: 'Average Pressure',
      backgroundColor: '#4CAF50',
    }]
  };

  // 3. Min/Max Range Chart
  public rangeChartData: ChartData<'bar'> = {
    labels: ['Pressure Range'],
    datasets: [
      {
        data: [],
        label: 'Minimum',
        backgroundColor: '#FF9800',
      },
      {
        data: [],
        label: 'Maximum',
        backgroundColor: '#F44336',
      }
    ]
  };

  // 4. Pressure Distribution Chart
  public distributionChartData: ChartData<'pie'> = {
    labels: ['Low', 'Medium', 'High'],
    datasets: [{
      data: [],
      backgroundColor: ['#81C784', '#FFB74D', '#E57373'],
    }]
  };

  // 5. Hourly Trend Chart
  public trendChartData: ChartData<'line'> = {
    labels: [],
    datasets: [{
      data: [],
      label: 'Hourly Average',
      borderColor: '#9C27B0',
      fill: false,
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
          text: 'Pressure (N)'
        }
      }
    }
  };

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
      this.fetchData(); // Fetch data immediately on init
      // Uncomment the following line if you want to fetch data every 5 seconds
      // setInterval(() => this.fetchData(), 5000);
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
    const below = values.filter(v => v < 400).length;
    const within = values.filter(v => v >= 400 && v <= 600).length;
    const above = values.filter(v => v > 600).length;

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
          if (response && response[0] && response[0].values) {
            const sensorData = response[0].values;
            const values = sensorData.map(point => point.value);
            const timestamps = sensorData.map(point =>
              new Date(point.timestamp).toLocaleTimeString()
            );

            // Create reference pressure array with the same length as values
            const referenceValues = new Array(values.length).fill(this.referencePressure);

            // Update realtime chart data with both datasets
            this.realtimeChartData = {
              labels: timestamps,
              datasets: [
                {
                  data: values,
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
                  borderWidth: 2,
                  fill: false,
                }
              ]
            };

            // Calculate statistics
            const stats = this.calculateStats(values);

            // Update average chart
            this.averageChartData = {
              ...this.averageChartData,
              datasets: [{
                ...this.averageChartData.datasets[0],
                data: [stats.avg]
              }]
            };

            // Update range chart
            this.rangeChartData = {
              ...this.rangeChartData,
              datasets: [
                {
                  ...this.rangeChartData.datasets[0],
                  data: [stats.min]
                },
                {
                  ...this.rangeChartData.datasets[1],
                  data: [stats.max]
                }
              ]
            };

            // Update distribution chart
            this.distributionChartData = {
              ...this.distributionChartData,
              datasets: [{
                ...this.distributionChartData.datasets[0],
                data: [stats.low, stats.medium, stats.high]
              }]
            };

            // Update hourly trend
            const trend = this.calculateHourlyTrend(sensorData);
            this.trendChartData = {
              ...this.trendChartData,
              labels: trend.hours.map(h => `${h}:00`),
              datasets: [{
                ...this.trendChartData.datasets[0],
                data: trend.averages
              }]
            };

            // Update threshold comparison
            this.thresholdChartData = {
              ...this.thresholdChartData,
              datasets: [{
                ...this.thresholdChartData.datasets[0],
                data: [stats.below, stats.within, stats.above]
              }]
            };

            this.dataLoaded = true;
            this.cdr.detectChanges();
          }
        },
        error: (error) => {
          console.error('Error fetching sensor data:', error);
        }
      });
  }
}