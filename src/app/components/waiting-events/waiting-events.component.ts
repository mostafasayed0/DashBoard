import { Component, OnInit, inject } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { AppService } from '../../core/services/App.service';
import { AppEvent } from '../../core/interfaces/event';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-waiting-events',
  templateUrl: './waiting-events.component.html',
  imports: [DatePipe],
  styleUrls: ['./waiting-events.component.scss'],
  standalone: true,
})
export class WaitingEventsComponent implements OnInit {
  notifications: any[] = [];

  private spinner = inject(NgxSpinnerService);

  constructor(private _AppService: AppService) {}

  ngOnInit(): void {
    this.getNotifications();
    this.spinner.show();
    setTimeout(() => this.spinner.hide(), 1000);
  }

  getNotifications() {
    this._AppService.getnotfigation().subscribe({
      next: (data) => {
        console.log('Notifications:', data);
        this.notifications = data;
      },
      error: (err) => console.error('Error fetching notifications:', err),
    });
  }

  onApprove(event:any) {
    this._AppService.approveEvent(event._id, 'true').subscribe({
      next: (res: any) => {
        console.log('Approved:', res);

        // 1️⃣ شيل الحدث من قائمة النوتفكيشن
        this.notifications = this.notifications.filter(
          (n) => n.data?.eventId !== event._id
        );

        // 2️⃣ ضيف الحدث الموافق عليه للـ EventsComponent عبر BehaviorSubject
        const approvedEvent: AppEvent = res.event;
        const currentApproved = this._AppService.approvedEvents$.value;
        this._AppService.approvedEvents$.next([
          ...currentApproved,
          approvedEvent,
        ]);
      },
      error: (err) => console.error('Approval error:', err),
    });
  }

  onReject(eventId: string) {
    this._AppService.approveEvent(eventId, 'false').subscribe({
      next: (res) => {
        console.log('Rejected:', res);

        // شيل الحدث من قائمة النوتفكيشن
        this.notifications = this.notifications.filter(
          (n) => n.data?.eventId !== eventId
        );
      },
      error: (err) => console.error('Rejection error:', err),
    });
  }
}
