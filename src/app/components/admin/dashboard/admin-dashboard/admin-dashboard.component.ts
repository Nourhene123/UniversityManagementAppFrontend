import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/Services/Auth/auth.service';
import { EnseignantService } from 'src/app/Services/EnseignantService/enseignant.service';
import { EtudiantService } from 'src/app/Services/EtudiantService/etudiant.service';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {
  user: any = null;
  enseignantCount: number = 0;
  etudiantCount: number = 0;
  parcourCount: number = 0;
  isLoading: boolean = true;

  constructor(
    private authService: AuthService,
    private router: Router,
    private enseignantService: EnseignantService,
    private etudiantService: EtudiantService,
  ) {}

  ngOnInit() {
    this.loadUserData();
    this.loadCounts();
  }

  private loadUserData(): void {
    this.authService.getCurrentUser().subscribe({
      next: (user) => this.user = user,
      error: () => this.router.navigate(['/login'])
    });
  }

  private loadCounts(): void {
  this.isLoading = true;
  this.enseignantService.getEnseignantCount().subscribe({
    next: count => this.enseignantCount = count,
    error: err => {
      console.error('Error fetching enseignant count:', err);
      this.enseignantCount = 0; 
    }
  });
  this.etudiantService.getEtudiantCount().subscribe({
    next: count => this.etudiantCount = count,
    error: err => {
      console.error('Error fetching etudiant count:', err);
      this.etudiantCount = 0;
    }
  });
  
}

}