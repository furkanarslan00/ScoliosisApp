import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SensorDataService {
  private apiUrl = 'https://scolisensemvpserver-azhpd3hchqgsc8bm.germanywestcentral-01.azurewebsites.net/api/sensor';

  constructor(private http: HttpClient) { }

  getSensorData(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }
}
