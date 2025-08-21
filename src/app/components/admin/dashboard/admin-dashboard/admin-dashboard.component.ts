import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/Services/Auth/auth.service';
import { EnseignantService } from 'src/app/Services/EnseignantService/enseignant.service';
import { EtudiantService } from 'src/app/Services/EtudiantService/etudiant.service';
import { forkJoin } from 'rxjs';
import { Chart, registerables } from 'chart.js';

// Register Chart.js components
Chart.register(...registerables);

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

  // Chart configuration
  public barChartData: any = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Nombre d\'étudiants',
        backgroundColor: [],
        borderColor: [],
        borderWidth: 2,
        hoverBackgroundColor: [],
        hoverBorderColor: []
      }
    ]
  };

  public barChartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        title: {
          display: true,
          text: 'Parcours',
          color: '#ffffff',
          font: { size: 16 }
        },
        ticks: { color: '#ffffff' },
        grid: { color: 'var(--border-color)', drawOnChartArea: false }
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Nombre d\'étudiants',
          color: '#ffffff',
          font: { size: 14 }
        },
        ticks: { color: 'var(--text-secondary)', stepSize: 1 },
        grid: { color: 'var(--border-color)' }
      }
    },
    plugins: {
      legend: {
        labels: { color: '#ffffff', font: { size: 14 } }
      },
      tooltip: {
        backgroundColor: 'var(--bg-secondary)',
        titleColor: '#ffffff',
        bodyColor: 'var(--primary-gradient)',
        borderColor: 'var(--primary-gradient)',
        borderWidth: 1,
        caretPadding: 10,
        bodyFont: { size: 12 }
      }
    },
    hover: { animationDuration: 200 }
  };

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

        // Update chart data
        this.barChartData.labels = this.parcourStats.map(stat => stat.parcourNom);
        this.barChartData.datasets[0].data = this.parcourStats.map(stat => stat.studentCount);

        // Assign dynamic colors
        const gradients = [
          'var(--primary-gradient)',
          'var(--success-gradient)',
          'var(--danger-gradient)',
          'var(--warning-gradient)'
        ];
        this.barChartData.datasets[0].backgroundColor = this.barChartData.labels.map((_: any, index: number) =>
          `linear-gradient(45deg, ${gradients[index % gradients.length]})`
        );
        this.barChartData.datasets[0].borderColor = this.barChartData.datasets[0].backgroundColor.map((color: string) =>
          color.replace('0.7', '1')
        );
        this.barChartData.datasets[0].hoverBackgroundColor = this.barChartData.datasets[0].backgroundColor.map((color: string) =>
          color.replace('0.7', '0.9')
        );
        this.barChartData.datasets[0].hoverBorderColor = this.barChartData.datasets[0].borderColor.map((color: string) =>
          color.replace('1', '1.2')
        );

        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching counts:', err);
        this.enseignantCount = 0;
        this.etudiantCount = 0;
        this.parcourStats = [];
        this.barChartData.labels = [];
        this.barChartData.datasets[0].data = [];
        this.isLoading = false;
      }
    });
  }
}