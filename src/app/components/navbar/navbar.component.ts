import { Component } from '@angular/core';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent {
  currentLang: string = 'AR';

  toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
  }

  switchLanguage() {
    this.currentLang = this.currentLang === 'AR' ? 'EN' : 'AR';
    // تقدر تضيف i18n أو ngx-translate هنا لاحقًا
  }
}
