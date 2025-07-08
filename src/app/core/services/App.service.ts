import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environment/environment';
import { AppEvent } from '../interfaces/event';

@Injectable({
  providedIn: 'root',
})
export class AppService {
  constructor(private _HttpClient: HttpClient) {}

  getusers(): Observable<any> {
    return this._HttpClient.get(`${environment.BASE_URL}/users`);
  }

  getevents(): Observable<any> {
    return this._HttpClient.get(`${environment.BASE_URL}/events`);
  }

  geteventById(id:string):Observable<any>{
    return this._HttpClient.get(`${environment.BASE_URL}/events/${id}`)
  }

  updateEvent(event:AppEvent , id:string):Observable<any>{
    return this._HttpClient.patch(`${environment.BASE_URL}/events/${id}` , event);
  }

  deletEvent(id:string):Observable<any>{
    return this._HttpClient.delete(`${environment.BASE_URL}/events/${id}`);
  }
}
