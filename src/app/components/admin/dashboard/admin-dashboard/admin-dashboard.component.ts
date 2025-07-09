// src/app/admin-dashboard/admin-dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/Services/Auth/auth.service';
import { EnseignantService } from 'src/app/Services/EnseignantService/enseignant.service';
import { EtudiantService } from 'src/app/Services/EtudiantService/etudiant.service';
import { forkJoin } from 'rxjs';

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
  parcourStats: { parcourNom: string, studentCount: number }[] = [];

  constructor(
    private authService: AuthService,
    private router: Router,
    private enseignantService: EnseignantService,
    private etudiantService: EtudiantService
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
    forkJoin({
      enseignant: this.enseignantService.getEnseignantCount(),
      etudiant: this.etudiantService.getEtudiantCount(),
      parcourStats: this.etudiantService.getStudentCountByParcour()
    }).subscribe({
      next: ({ enseignant, etudiant, parcourStats }) => {
        this.enseignantCount = enseignant || 0;
        this.etudiantCount = etudiant || 0;
        this.parcourStats = parcourStats || [];
        console.log('Parcour Stats:', this.parcourStats);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching counts:', err);
        this.enseignantCount = 0;
        this.etudiantCount = 0;
        this.parcourStats = [];
        this.isLoading = false;
      }
    });
  }
}