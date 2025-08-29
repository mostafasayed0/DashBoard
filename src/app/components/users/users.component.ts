import { Component, inject, OnInit } from '@angular/core';
import { User } from '../../core/interfaces/user';
import { AppService } from '../../core/services/App.service';
import { AppEvent } from '../../core/interfaces/event';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [FormsModule, TranslateModule],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss',
})
export class UsersComponent implements OnInit {
  Users!: User[];
  usersOnly: User[] = [];
  organizersOnly: User[] = [];

  filteredUsers: User[] = [];
  filteredOrganizers: {
    id: string;
    firstName: string;
    email: string;
    organizationName?: string;
    eventNames: string[];
    eventsCount: number;
  }[] = [];



  searchTerm: string = '';
  showUsers: boolean = true;
  showOrganizers: boolean = true;

  private _AppService = inject(AppService);
  private spinner = inject(NgxSpinnerService);

  ngOnInit(): void {
    this.spinner.show();
    setTimeout(() => this.spinner.hide(), 1000);

    this._AppService.getusers().subscribe({
      next: (data: User[]) => {
        console.log('Users data:', data);

        this.Users = data.map((user) => ({
          ...user,
          tickets: user.ticketsBooked || [],
        }));

        this.usersOnly = this.Users.filter((user) => user.role === 'user');
        this.organizersOnly = this.Users.filter(
          (user) => user.role === 'organizer'
        );

        console.log('Users only:', this.usersOnly.length);
        console.log('Organizers only:', this.organizersOnly.length);
        console.log('Organizers data:', this.organizersOnly);

        // إذا لم يكن هناك منظمين، نعرض رسالة
        if (this.organizersOnly.length === 0) {
          console.warn('No organizers found in the data');
        }

        this.filteredUsers = [...this.usersOnly];

        this._AppService.getevents().subscribe({
          next: (events: AppEvent[]) => {
            console.log('Events data:', events);
            console.log(
              'Events with organizers:',
              events.filter((e) => e.organizer)
            );


            // تحديث المنظمين المعروضين
            console.log('Filtered organizers:', this.filteredOrganizers);

            // إذا لم يكن هناك منظمين مع أحداث، نعرض المنظمين بدون أحداث
            if (
              this.organizersOnly.length > 0
            ) {
              console.log(
                'No organizers with events found, showing all organizers'
              );


            }
          },
          error: (err) => {
            console.error('Error fetching events:', err);
          },
        });
      },
      error: (err) => {
        console.error('Error fetching users:', err);
        this.spinner.hide();
      },
    });
  }

  filterUsers() {
    if (!this.searchTerm.trim()) {
      this.filteredUsers = [...this.usersOnly];
    } else {
      const searchLower = this.searchTerm.toLowerCase();

      this.filteredUsers = this.usersOnly.filter(
        (user) =>
          user.name?.toLowerCase().includes(searchLower) ||
          user.userName?.toLowerCase().includes(searchLower) ||
          user.username?.toLowerCase().includes(searchLower) ||
          user.email?.toLowerCase().includes(searchLower)
      );

      // this.filteredOrganizers = this.organizersOnly.filter(
      //   (org) =>
      //     org.firstName?.toLowerCase().includes(searchLower) ||
      //     org.email?.toLowerCase().includes(searchLower)
      // );
    }
  }

  // تبديل عرض المستخدمين
  showUsersOnly() {
    this.showUsers = true;
    this.showOrganizers = false;
  }

  // تبديل عرض المنظمين
  showOrganizersOnly() {
    this.showUsers = false;
    this.showOrganizers = true;
  }

  // عرض الكل
  showAll() {
    this.showUsers = true;
    this.showOrganizers = true;
  }
}
