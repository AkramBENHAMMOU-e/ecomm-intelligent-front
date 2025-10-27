import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AspectData {
  topicName: string;
  positiveCount: number;
  negativeCount: number;
  totalMentions: number;
}

@Injectable({
  providedIn: 'root'
})
export class AspectDataService {
  private baseUrl = 'http://localhost:8080/stat';

  constructor(private http: HttpClient) { }

  getAspectData(productId: number): Observable<AspectData[]> {
    return this.http.get<AspectData[]>(`${this.baseUrl}/${productId}/aspect-summary`);
  }
}
