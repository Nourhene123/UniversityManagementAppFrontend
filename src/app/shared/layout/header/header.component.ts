import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/Services/Auth/auth.service';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { Subject, debounceTime } from 'rxjs';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
  animations: [
    trigger('dropdownAnimation', [
      state('void', style({
        opacity: 0,
        transform: 'translateY(-10px)'
      })),
      state('*', style({
        opacity: 1,
        transform: 'translateY(0)'
      })),
      transition('void <=> *', animate('200ms ease-in-out'))
    ]),
    trigger('suggestionsAnimation', [
      state('void', style({
        opacity: 0,
        transform: 'scaleY(0.8)'
      })),
      state('*', style({
        opacity: 1,
        transform: 'scaleY(1)'
      })),
      transition('void <=> *', animate('200ms ease-in-out'))
    ])
  ]
})
export class HeaderComponent implements OnInit, OnDestroy {
  currentUser: any = { nom: '', prenom: '', role: '' };
  currentPageTitle = 'Dashboard';
  isDarkTheme = false;
  isMobile = false;
  searchQuery = '';
  showSuggestions = false;
  searchSuggestions: string[] = [];
  showNotifications = false;
  showUserMenu = false;
  notificationsCount = 3;
  notifications = [
    { text: 'New course added', time: new Date() },
    { text: 'Student submission received', time: new Date() },
    { text: 'System update available', time: new Date() }
  ];

  private searchSubject = new Subject<string>();
  private destroyed$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadThemePreference();
    this.checkMobileView();
    this.setupSearchDebounce();
    window.addEventListener('resize', this.checkMobileView.bind(this));
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
    window.removeEventListener('resize', this.checkMobileView.bind(this));
  }

 

  private loadThemePreference(): void {
    this.isDarkTheme = localStorage.getItem('theme') === 'dark';
  }

  private checkMobileView(): void {
    this.isMobile = window.innerWidth <= 768;
  }

  private setupSearchDebounce(): void {
    this.searchSubject.pipe(
      debounceTime(300)
    ).subscribe(query => {
      this.updateSearchSuggestions(query);
    });
  }

  toggleMobileMenu(): void {
    // Emit event to parent component or service to toggle sidebar
    // This would typically interact with the sidebar component
  }

  toggleTheme(): void {
    this.isDarkTheme = !this.isDarkTheme;
    localStorage.setItem('theme', this.isDarkTheme ? 'dark' : 'light');
  }

  onSearchInput(): void {
    this.searchSubject.next(this.searchQuery);
  }

  onSearchFocus(event: Event): void {
    if (this.searchQuery) {
      this.showSuggestions = true;
    }
  }

  onSearchBlur(event: Event): void {
    // Delay to allow click on suggestions
    setTimeout(() => {
      this.showSuggestions = false;
    }, 200);
  }

  updateSearchSuggestions(query: string): void {
    // Mock search suggestions - replace with actual API call
    if (query.length > 2) {
      this.searchSuggestions = [
        `${query} - Course`,
        `${query} - Student`,
        `${query} - Teacher`
      ];
      this.showSuggestions = true;
    } else {
      this.searchSuggestions = [];
      this.showSuggestions = false;
    }
  }

  selectSuggestion(suggestion: string): void {
    this.searchQuery = suggestion;
    this.showSuggestions = false;
    // Implement search navigation logic here
  }

  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
    this.showUserMenu = false;
  }

  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
    this.showNotifications = false;
  }

  navigateToProfile(): void {
    this.router.navigate(['/profile']);
    this.showUserMenu = false;
  }

  navigateToSettings(): void {
    this.router.navigate(['/settings']);
    this.showUserMenu = false;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }


  closeSearchSuggestions(): void {
    this.showSuggestions = false;
  }
}