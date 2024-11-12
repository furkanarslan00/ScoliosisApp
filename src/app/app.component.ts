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
  public lineChartData: ChartData<'line'> = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'FSR Basınç Değeri',
        fill: true,
        borderColor: 'blue',
        backgroundColor: 'rgba(75,192,192,0.2)',
        tension: 0.4
      }
    ]
  };

  public lineChartOptions: ChartOptions<'line'> = {
    responsive: true,
  };

  public lineChartLegend = true;
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

          const labels = sensorData.map((dataPoint: any) => {
            const date = new Date(dataPoint.timestamp);
            return date.toLocaleTimeString(); 
          });

          const data = sensorData.map((dataPoint: any) => dataPoint.value);

          this.lineChartData.labels = labels;
          this.lineChartData.datasets[0].data = data;
        } else {
          console.error('Beklenen veri formatı alınamadı:', response);
        }
      });
  }
}