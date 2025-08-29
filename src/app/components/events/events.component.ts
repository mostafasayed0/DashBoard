import { Component, OnInit } from '@angular/core';
import { AppService } from '../../core/services/App.service';
import { AppEvent } from '../../core/interfaces/event';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [DatePipe, RouterLink, FormsModule, TranslateModule],
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.scss'],
})
export class EventsComponent implements OnInit {
  events: AppEvent[] = [];
  filteredEvents: AppEvent[] = [];
  searchTerm: string = '';
  selectedCategory: string = '';
  selectedStatus: string = '';
  selectedUpcoming: string = '';
  
  categories: string[] = [];
  statuses: string[] = [];
  
  private subscription: Subscription = new Subscription();

  constructor(
    private _AppService: AppService
  ) {}

  ngOnInit(): void {
    console.log('Events component initialized');

    // جلب الأحداث الموجودة مسبقًا
    this.subscription.add(
      this._AppService.getevents().subscribe({
        next: (data: any) => {
          console.log('Fetched events:', data);
          
          if (data.events) {
            this.events = data.events;
            this.filteredEvents = [...data.events];
            this.extractFilterOptions();
          } else if (data && Array.isArray(data)) {
            this.events = data;
            this.filteredEvents = [...data];
            this.extractFilterOptions();
          } else {
            // Load demo data if no events found
            console.log('No events data found, loading demo data');
            this.loadDemoData();
          }
        },
        error: (err) => {
          console.log('Error fetching events:', err);
          // Load demo data on error
          console.log('Loading demo data due to error');
          this.loadDemoData();
        },
      })
    );

    // الاشتراك في الـ approvedEvents$ لمتابعة أي حدث جديد تم الموافقة عليه
    this.subscription.add(
      this._AppService.approvedEvents$.subscribe((newApprovedEvents) => {
        // ضيف أي حدث جديد لم يكن موجود مسبقًا
        newApprovedEvents.forEach((evt) => {
          if (!this.events.some((e) => e._id === evt._id)) {
            this.events.push(evt);
            this.filteredEvents.push(evt);
          }
        });
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private extractFilterOptions() {
    try {
      // استخراج الفئات والأنواع المتاحة للفلترة
      this.categories = [...new Set(this.events.map(event => event.category))];
      this.statuses = [...new Set(this.events.map(event => event.status))];
      console.log('Filter options extracted:', { categories: this.categories, statuses: this.statuses });
    } catch (error) {
      console.error('Error extracting filter options:', error);
      this.categories = [];
      this.statuses = [];
    }
  }

  // Search and filter functionality
  filterEvents() {
    try {
      let filtered = this.events || [];

      // Filter by search term
      if (this.searchTerm?.trim()) {
        const term = this.searchTerm.trim().toLowerCase();
        filtered = filtered.filter(
          (event) =>
            event.title?.toLowerCase().includes(term) ||
            event.description?.toLowerCase().includes(term) ||
            event.location?.venue?.toLowerCase().includes(term) ||
            event.location?.city?.toLowerCase().includes(term)
        );
      }

      // Filter by category
      if (this.selectedCategory) {
        filtered = filtered.filter(event => event.category === this.selectedCategory);
      }

      // Filter by status
      if (this.selectedStatus) {
        filtered = filtered.filter(event => event.status === this.selectedStatus);
      }

      // Filter by upcoming status
      if (this.selectedUpcoming === 'upcoming') {
        filtered = filtered.filter(event => event.upcoming === true);
      } else if (this.selectedUpcoming === 'past') {
        filtered = filtered.filter(event => event.upcoming === false);
      }

      this.filteredEvents = filtered;
      console.log('Filtered events:', this.filteredEvents.length);
    } catch (error) {
      console.error('Error filtering events:', error);
      this.filteredEvents = this.events || [];
    }
  }

  clearFilters() {
    this.searchTerm = '';
    this.selectedCategory = '';
    this.selectedStatus = '';
    this.selectedUpcoming = '';
    this.filteredEvents = [...this.events];
  }

  getEventStatus(date: string): string {
    const eventDate = new Date(date);
    const now = new Date();
    const diffTime = eventDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'past';
    else if (diffDays <= 7) return 'ongoing';
    else return 'upcoming';
  }

  getEventStatusText(date: string): string {
    const eventDate = new Date(date);
    const now = new Date();
    const diffTime = eventDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Past';
    else if (diffDays <= 7) return 'Soon';
    else return 'Upcoming';
  }

  getEventStatusClass(event: AppEvent): string {
    if (event.upcoming) return 'upcoming';
    if (event.isSoldOut) return 'sold-out';
    if (event.currentAttendees > 0) return 'ongoing';
    return 'new';
  }

  getEventStatusDisplayText(event: AppEvent): string {
    if (event.upcoming) return 'Upcoming';
    if (event.isSoldOut) return 'Sold Out';
    if (event.currentAttendees > 0) return 'Active';
    return 'New';
  }

  sortByDateDesc() {
    this.filteredEvents.sort(
      (a, b) =>
        new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    );
  }

  sortByDateAsc() {
    this.filteredEvents.sort(
      (a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );
  }

  sortByAttendees() {
    this.filteredEvents.sort((a, b) => b.currentAttendees - a.currentAttendees);
  }

  sortByAvailableSpots() {
    this.filteredEvents.sort((a, b) => b.availableSpots - a.availableSpots);
  }

  deleteEvent(event: AppEvent) {
    const id: string = event._id;
    this._AppService.deleteEvent(id).subscribe({
      next: (data) => {
        console.log('deleted', data);
        this.events = this.events.filter((e) => e._id !== id);
        this.filterEvents(); // Re-filter after deletion
      },
    });
  }

  getAttendancePercentage(event: AppEvent): number {
    if (event.maxAttendees === 0) return 0;
    return Math.round((event.currentAttendees / event.maxAttendees) * 100);
  }

  getGoogleMapsUrl(event: AppEvent): string {
    if (event.location?.coordinates?.lat && event.location?.coordinates?.lng) {
      return `https://www.google.com/maps/search/?api=1&query=${event.location.coordinates.lat},${event.location.coordinates.lng}`;
    }
    // Fallback to venue search if no coordinates
    const searchQuery = encodeURIComponent(`${event.location?.venue}, ${event.location?.city}`);
    return `https://www.google.com/maps/search/?api=1&query=${searchQuery}`;
  }

  private loadDemoData() {
    try {
      console.log('Loading demo data...');
      // Demo data based on the provided structure
      this.events = [
      {
        location: {
          coordinates: {
            lat: 30.0444,
            lng: 31.2357
          },
          venue: "cairo",
          address: "cairo",
          city: "cairo"
        },
        upcoming: false,
        _id: "6884bdcb6136ebcabb283e52",
        title: "test title event",
        description: "test description event",
        category: "music",
        startDate: "2025-08-01T00:00:00.000Z",
        endDate: "2025-08-02T00:00:00.000Z",
        time: "05:15",
        organizer: {
          _id: "68821a722763877ffe54de65",
          email: "admin@admin.com"
        },
        images: [
          "https://res.cloudinary.com/dpdidbatc/image/upload/v1753529802/tazkarti/eventsImages/adfwreyejpc0hzsw1hzt.png"
        ],
        trailerVideo: null,
        status: "approved",
        approved: true,
        maxAttendees: 100,
        currentAttendees: 0,
        tags: [],
        tickets: [
          "6884c1f91f2d49f40f7527ef",
          "6884ccb68c5d58ba7d17cdfb",
          "6884e73dff25836094135d8f",
          "6884e7a9ff25836094135d95",
          "6884eec4590076fd888cab0d",
          "6884f075183cdd672099c48f",
          "6884f13d183cdd672099c492"
        ],
        isActive: true,
        createdAt: "2025-07-26T11:36:43.331Z",
        updatedAt: "2025-08-22T13:25:06.119Z",
        __v: 0,
        isSoldOut: false,
        availableSpots: 100,
        id: "6884bdcb6136ebcabb283e52"
      },
      {
        location: {
          venue: "cairo stadium",
          address: "cairo stadium",
          city: "cairo"
        },
        _id: "68a88244b34ff55813905fc2",
        title: "football match",
        description: "football match",
        category: "sports",
        startDate: "2025-08-24T00:00:00.000Z",
        endDate: "2025-08-30T00:00:00.000Z",
        time: "21:00",
        organizer: undefined,
        images: [
          "https://res.cloudinary.com/dpdidbatc/image/upload/v1755873860/tazkarti/eventsImages/knw00eygnx6vnae2yqlt.webp"
        ],
        trailerVideo: null,
        status: "published",
        approved: true,
        upcoming: false,
        maxAttendees: 100,
        currentAttendees: 0,
        tags: ["[]"],
        tickets: [],
        isActive: true,
        createdAt: "2025-08-22T14:44:20.533Z",
        updatedAt: "2025-08-22T14:44:20.533Z",
        __v: 0,
        isSoldOut: false,
        availableSpots: 100,
        id: "68a88244b34ff55813905fc2"
      },
      {
        location: {
          venue: "sohag unveristy",
          address: "sohag unveristy",
          city: "sohag"
        },
        _id: "68a8b95492f4851f69d80d9a",
        title: "cloud workshop",
        description: "cloud workshop",
        category: "workshop",
        startDate: "2025-08-25T00:00:00.000Z",
        endDate: "2025-08-30T00:00:00.000Z",
        time: "12:00",
        organizer: {
          _id: "68a8b89092f4851f69d80d84",
          email: "mariamhamouda24@gmail.com"
        },
        images: [
          "https://res.cloudinary.com/dpdidbatc/image/upload/v1755887957/tazkarti/eventsImages/chhprwpqtbsrgdmxcrvx.jpg"
        ],
        trailerVideo: null,
        status: "published",
        approved: true,
        upcoming: true,
        maxAttendees: 100,
        currentAttendees: 0,
        tags: ["[]"],
        tickets: [],
        isActive: true,
        createdAt: "2025-08-22T18:39:16.616Z",
        updatedAt: "2025-08-22T18:39:16.616Z",
        __v: 0,
        isSoldOut: false,
        availableSpots: 100,
        id: "68a8b95492f4851f69d80d9a"
      },
      {
        location: {
          coordinates: {
            lat: 30.0428,
            lng: 31.2243
          },
          venue: "Cairo Opera House",
          address: "Opera Square, Zamalek",
          city: "Cairo"
        },
        trailerVideo: "",
        tickets: [],
        _id: "68a17849cc29f5089455f95d",
        title: "Summer Music Festival 2025",
        description: "A full-day festival featuring top local and international bands with food trucks and merchandise.",
        category: "music",
        startDate: "2025-09-15T18:00:00.000Z",
        endDate: "2025-09-15T23:00:00.000Z",
        time: "18:00",
        organizer: undefined,
        images: [
          "https://res.cloudinary.com/demo/image/upload/v1723800000/music1.jpg"
        ],
        status: "published",
        approved: true,
        upcoming: true,
        maxAttendees: 500,
        currentAttendees: 120,
        tags: [
          "festival",
          "music",
          "live"
        ],
        isActive: true,
        isSoldOut: false,
        availableSpots: 380,
        id: "68a17849cc29f5089455f95d",
        createdAt: "2025-08-22T10:00:00.000Z",
        updatedAt: "2025-08-22T10:00:00.000Z",
        __v: 0
      },
      {
        location: {
          coordinates: {
            lat: 30.0131,
            lng: 31.2089
          },
          venue: "Tech Hub",
          address: "789 Innovation Blvd",
          city: "Giza"
        },
        upcoming: false,
        _id: "68943c25e09e5876f7170ebe",
        title: "AI & Machine Learning Workshop",
        description: "Hands-on workshop exploring the basics of AI and ML with real-world projects.",
        category: "workshop",
        startDate: "2025-11-20T09:00:00.000Z",
        endDate: "2025-11-20T17:00:00.000Z",
        time: "09:00",
        organizer: undefined,
        images: [
          "aiworkshop.jpg"
        ],
        trailerVideo: "",
        status: "published",
        approved: true,
        maxAttendees: 80,
        currentAttendees: 50,
        tags: [
          "ai",
          "tech",
          "ml",
          "coding"
        ],
        tickets: [],
        isActive: true,
        isSoldOut: false,
        availableSpots: 30,
        id: "68943c25e09e5876f7170ebe",
        createdAt: "2025-08-22T10:00:00.000Z",
        updatedAt: "2025-08-22T10:00:00.000Z",
        __v: 0
      }
    ];
    
    this.filteredEvents = [...this.events];
    this.extractFilterOptions();
    console.log('Demo data loaded successfully:', this.events.length, 'events');
    } catch (error) {
      console.error('Error loading demo data:', error);
      this.events = [];
      this.filteredEvents = [];
    }
  }
}
