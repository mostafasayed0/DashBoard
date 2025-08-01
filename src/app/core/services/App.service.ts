import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environment/environment';
import { AppEvent } from '../interfaces/event';
import { User } from '../interfaces/user';
import { Tickets, EventTicketStats } from '../interfaces/tickets';
import { jwtDecode } from 'jwt-decode';

@Injectable({
  providedIn: 'root',
})
export class AppService {
  constructor(private _HttpClient: HttpClient) {}
  getusers(): Observable<any> {
    return this._HttpClient.get(`${environment.BASE_URL}/users`);
  }

  login(adminData: object): Observable<any> {
    return this._HttpClient.post(`http://localhost:5000/auth/login`, adminData);
  }

  saveUserData(): void {
    if (localStorage.getItem('userToken') !== null) {
      // ! ده هنا حل عشان اضمنله ان فى داتا جاية
      // رغم انى متاكد انى ف داتا عشان االكوندشن بس الباكج عايزة تطمن
      jwtDecode(localStorage.getItem('userToken')!);
    }
  }

  getevents(): Observable<any> {
    return this._HttpClient.get(`${environment.BASE_URL}/events`);
  }

  getTickets(): Observable<any> {
    return this._HttpClient.get(`${environment.BASE_URL}/tickets`);
  }

  geteventById(id: string): Observable<any> {
    return this._HttpClient.get(`${environment.BASE_URL}/events/${id}`);
  }

  updateEvent(event: AppEvent, id: string): Observable<any> {
    return this._HttpClient.patch(
      `${environment.BASE_URL}/events/${id}`,
      event
    );
  }

  deletEvent(id: string): Observable<any> {
    return this._HttpClient.delete(`${environment.BASE_URL}/events/${id}`);
  }

  getEventTicketStats(): Observable<EventTicketStats[]> {
    return new Observable((observer) => {
      // Get all data
      this.getevents().subscribe((events) => {
        this.getTickets().subscribe((tickets) => {
          this.getusers().subscribe((users) => {
            const stats = this.calculateTicketStats(events, tickets, users);
            observer.next(stats);
            observer.complete();
          });
        });
      });
    });
  }

  private calculateTicketStats(
    events: AppEvent[],
    tickets: Tickets[],
    users: User[]
  ): EventTicketStats[] {
    return events.map((event) => {
      const eventTickets = tickets.filter(
        (ticket) => ticket.eventId === parseInt(event.id)
      );
      const confirmedTickets = eventTickets.filter(
        (ticket) => ticket.status === 'confirmed'
      ).length;
      const pendingTickets = eventTickets.filter(
        (ticket) => ticket.status === 'pending'
      ).length;
      const reservedTickets = confirmedTickets + pendingTickets;
      const availableTickets = event.tickets - reservedTickets;

      const reservedPercentage =
        event.tickets > 0
          ? Math.round((reservedTickets / event.tickets) * 100)
          : 0;
      const availablePercentage = 100 - reservedPercentage;

      return {
        eventId: parseInt(event.id),
        eventName: event.name,
        eventDate: event.date,
        eventLocation: event.location,
        totalTickets: event.tickets,
        reservedTickets: reservedTickets,
        availableTickets: Math.max(0, availableTickets), // Ensure non-negative
        reservedPercentage: reservedPercentage,
        availablePercentage: availablePercentage,
      };
    });
  }
}
