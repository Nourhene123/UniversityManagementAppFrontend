import { Component, ElementRef, ViewChild, OnInit, AfterViewInit, Input } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/Services/Auth/auth.service';
import { trigger, state, style, transition, animate } from '@angular/animations';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
  animations: [
    trigger('submenuAnimation', [
      state('void', style({
        height: '0',
        opacity: '0'
      })),
      state('*', style({
        height: '*',
        opacity: '1'
      })),
      transition('void <=> *', animate('300ms cubic-bezier(0.4, 0, 0.2, 1)'))
    ])
  ]
})
export class SidebarComponent implements OnInit, AfterViewInit {
  @Input() isSidebarOpen: boolean = false; // Controlled by LayoutComponent
  currentUser: any = { nom: '', prenom: '', role: '' };
  isLoading = true;
  isAnimated = false;
  isDarkTheme = false;
  isMinimized: boolean = false; // New state for minimization

  private adminMenuItems = [
    {
      label: 'Dashboard',
      icon: 'fas fa-chart-line',
      route: 'dashboard',
      exact: true
    },
    {
      label: 'Parcours',
      icon: 'fas fa-graduation-cap',
      route: 'Parcour',
      exact: true
    },
    {
      label: 'Semestre',
      icon: 'fas fa-calendar-alt',
      route: 'Semestre',
      exact: true
    },
    {
      label: 'Paniers',
      icon: 'fas fa-shopping-basket',
      route: 'Panier',
      exact: true
    },
    {
      label: 'Matières',
      icon: 'fas fa-book-open',
      route: 'Matier',
      exact: true
    },
    {
      label: 'Enseignants',
      icon: 'fas fa-chalkboard-teacher',
      route: 'Enseignants',
      exact: true
    },
    {
      label: 'Étudiants',
      icon: 'fas fa-graduation-cap',
      route: 'Etudiant',
      exact: true
    }
    ,  {
      label: 'Classes',
      icon: "fas fa-chalkboard",
      route: 'classe',
      exact: true
    }
  ];

  private enseignantMenuItems = [
    {
      label: 'Dashboard',
      icon: 'fas fa-chart-line',
      route: 'dashboard',
      exact: true
    },
   
    {
      label: 'Notes',
      icon: 'fas fa-clipboard-list',
      route: 'notes',
      exact: true
    },
   
  ];

  menuItems: any[] = [];

  @ViewChild('sidebar') sidebar!: ElementRef;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.isLoading = true;
    this.loadUserData();
    this.loadThemePreference();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.isAnimated = true;
    }, 50);
  }

   private loadUserData(): void {
    this.authService.getCurrentUser().subscribe({
      next: (user) => {
        this.currentUser = user;
        console.log('User loaded:', JSON.stringify(user, null, 2));
        if (this.currentUser?.role === 'Administrateur') {
          this.menuItems = this.adminMenuItems;
        } else if (this.currentUser?.role === 'Enseignant') {
          this.menuItems = this.enseignantMenuItems;
        } else {
          this.menuItems = [];
          console.warn('Unknown role:', this.currentUser?.role);
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error fetching user data:', {
          status: error.status,
          statusText: error.statusText,
          message: error.message,
          url: error.url
        });
        if (error.status === 401 || error.status === 403) {
          console.warn('Unauthorized/Forbidden: Redirecting to login');
          this.router.navigate(['/login']);
        } else {
          console.error('Unexpected error:', error.message);
        }
        this.isLoading = false;
      }
    });
  }
  private loadThemePreference(): void {
    const savedTheme = localStorage.getItem('theme');
    this.isDarkTheme = savedTheme === 'dark';
  }

  toggleSidebar(): void {
    if (this.isMinimized) {
      this.isMinimized = false; // Expand to full state
    } else {
      this.isMinimized = true; // Minimize to icon only
    }
    this.isSidebarOpen = !this.isMinimized; // Sync with LayoutComponent
  }

  toggleSubMenu(index: number): void {
    this.menuItems[index].expanded = !this.menuItems[index].expanded;
  }

  toggleTheme(): void {
    this.isDarkTheme = !this.isDarkTheme;
    localStorage.setItem('theme', this.isDarkTheme ? 'dark' : 'light');
  }

  getUserInitials(): string {
    const prenomInitial = this.currentUser.prenom ? this.currentUser.prenom.charAt(0) : '';
    const nomInitial = this.currentUser.nom ? this.currentUser.nom.charAt(0) : '';
    const initials = (prenomInitial + nomInitial).toUpperCase();
    return initials || 'FN';
  }

  logout(): void {
    this.isLoading = true;
    setTimeout(() => {
      this.authService.logout();
      this.router.navigate(['/login']);
    }, 300);
  }
}