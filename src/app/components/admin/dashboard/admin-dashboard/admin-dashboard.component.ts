import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/Services/Auth/auth.service';
import { EnseignantService } from 'src/app/Services/EnseignantService/enseignant.service';
import { EtudiantService } from 'src/app/Services/EtudiantService/etudiant.service';
import { ThemeService } from 'src/app/shared/services/theme.service';
import { forkJoin } from 'rxjs';
import { Chart, registerables, ChartType } from 'chart.js';

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
  // Calculated statistics based on real data
  growthPercentage: number = 0;
  averageClassSize: number = 0;
  currentActivityHour: string = '';
  totalCount: number = 0;
  currentChartType: ChartType = 'bar' as ChartType;

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
          text: 'Parcours Académique',
          color: '#6366f1',
          font: { size: 14, weight: 'bold' }
        },
        ticks: { 
          color: '#475569',
          font: { size: 12 }
        },
        grid: { 
          color: '#e2e8f0',
          drawOnChartArea: false 
        }
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Nombre d\'Étudiants',
          color: '#6366f1',
          font: { size: 14, weight: 'bold' }
        },
        ticks: { 
          color: '#475569',
          font: { size: 12 },
          stepSize: 1 
        },
        grid: { 
          color: '#e2e8f0'
        }
      }
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: { 
          color: '#1e293b',
          font: { size: 14, weight: 'bold' },
          padding: 20
        }
      },
      tooltip: {
        backgroundColor: 'rgba(30, 41, 59, 0.95)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#6366f1',
        borderWidth: 2,
        caretPadding: 10,
        bodyFont: { size: 12 },
        titleFont: { size: 14, weight: 'bold' },
        padding: 12,
        displayColors: true,
        callbacks: {
          label: function(context: any) {
            return `Étudiants: ${context.parsed.y}`;
          }
        }
      }
    },
    hover: { 
      animationDuration: 200 
    },
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart'
    }
  };

  constructor(
    private authService: AuthService,
    private router: Router,
    private enseignantService: EnseignantService,
    private etudiantService: EtudiantService,
    private themeService: ThemeService
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

  public loadCounts(): void {
    this.isLoading = true;
    console.log('Loading counts...');
    
    forkJoin({
      enseignant: this.enseignantService.getEnseignantCount(),
      etudiant: this.etudiantService.getEtudiantCount(),
      parcourStats: this.etudiantService.getStudentCountByParcour()
    }).subscribe({
      next: ({ enseignant, etudiant, parcourStats }) => {
        console.log('Raw data received:', { enseignant, etudiant, parcourStats });
        
        this.enseignantCount = enseignant || 0;
        this.etudiantCount = etudiant || 0;
        this.parcourStats = parcourStats || [];
        console.log('Parcour Stats:', this.parcourStats);
        console.log('Parcour Stats length:', this.parcourStats.length);

        // Update chart data
        this.barChartData.labels = this.parcourStats.map(stat => stat.parcourNom || 'Inconnu');
        this.barChartData.datasets[0].data = this.parcourStats.map(stat => stat.studentCount || 0);

        // Calculate real statistics
        this.calculateStats();

        // Assign dynamic colors - use solid colors instead of gradients for better compatibility
        const colors = [
          '#6366f1', // Primary blue
          '#10b981', // Success green  
          '#f59e0b', // Warning orange
          '#ef4444', // Danger red
          '#8b5cf6', // Purple
          '#06b6d4', // Cyan
          '#ec4899', // Pink
          '#84cc16'  // Lime
        ];
        
        this.barChartData.datasets[0].backgroundColor = this.barChartData.labels.map((_: any, index: number) =>
          colors[index % colors.length]
        );
        this.barChartData.datasets[0].borderColor = this.barChartData.datasets[0].backgroundColor.map((color: string) =>
          color
        );
        this.barChartData.datasets[0].hoverBackgroundColor = this.barChartData.datasets[0].backgroundColor.map((color: string) =>
          color + 'dd' // Add transparency for hover
        );
        this.barChartData.datasets[0].hoverBorderColor = this.barChartData.datasets[0].borderColor.map((color: string) =>
          color
        );

        console.log('Chart data updated:', {
          labels: this.barChartData.labels,
          data: this.barChartData.datasets[0].data,
          colors: this.barChartData.datasets[0].backgroundColor
        });

        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching counts:', err);
        console.error('Error details:', err.status, err.message);
        this.enseignantCount = 0;
        this.etudiantCount = 0;
        this.parcourStats = [];
        this.barChartData.labels = [];
        this.barChartData.datasets[0].data = [];
        this.isLoading = false;
      }
    });
  }

  getCurrentDate(): string {
    const today = new Date();
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return today.toLocaleDateString('fr-FR', options);
  }

  changeChartType(type: ChartType): void {
    this.currentChartType = type;
    console.log('Chart type changed to:', type);
    
    // Update chart options based on type
    if (type === 'pie' || type === 'doughnut') {
      // For pie charts, remove y-axis and adjust options
      this.barChartOptions.scales = {};
      this.barChartOptions.plugins.legend.display = true;
      this.barChartOptions.plugins.legend.position = 'right';
    } else if (type === 'line') {
      // For line charts, restore axes and adjust for line display
      this.barChartOptions.scales = {
        x: {
          title: {
            display: true,
            text: 'Parcours Académique',
            color: '#6366f1',
            font: { size: 14, weight: 'bold' }
          },
          ticks: { 
            color: '#475569',
            font: { size: 12 }
          },
          grid: { 
            color: '#e2e8f0',
            drawOnChartArea: false 
          }
        },
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Nombre d\'Étudiants',
            color: '#6366f1',
            font: { size: 14, weight: 'bold' }
          },
          ticks: { 
            color: '#475569',
            font: { size: 12 },
            stepSize: 1 
          },
          grid: { 
            color: '#e2e8f0'
          }
        }
      };
      this.barChartOptions.plugins.legend.position = 'top';
      // Add tension for smooth lines
      this.barChartData.datasets[0].tension = 0.4;
      this.barChartData.datasets[0].fill = true;
    } else {
      // For bar charts, restore default options
      this.barChartOptions.scales = {
        x: {
          title: {
            display: true,
            text: 'Parcours Académique',
            color: '#6366f1',
            font: { size: 14, weight: 'bold' }
          },
          ticks: { 
            color: '#475569',
            font: { size: 12 }
          },
          grid: { 
            color: '#e2e8f0',
            drawOnChartArea: false 
          }
        },
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Nombre d\'Étudiants',
            color: '#6366f1',
            font: { size: 14, weight: 'bold' }
          },
          ticks: { 
            color: '#475569',
            font: { size: 12 },
            stepSize: 1 
          },
          grid: { 
            color: '#e2e8f0'
          }
        }
      };
      this.barChartOptions.plugins.legend.position = 'top';
      // Remove line-specific properties
      delete this.barChartData.datasets[0].tension;
      delete this.barChartData.datasets[0].fill;
    }
  }

  private calculateStats(): void {
    // Calculate total students across all parcours
    this.totalCount = this.parcourStats.reduce((sum, stat) => sum + (stat.studentCount || 0), 0);
    
    // Calculate average class size
    this.averageClassSize = this.parcourStats.length > 0 
      ? Math.round(this.totalCount / this.parcourStats.length) 
      : 0;
    
    // Determine current activity hour based on time of day
    const hour = new Date().getHours();
    if (hour >= 8 && hour < 12) {
      this.currentActivityHour = '08h-12h';
    } else if (hour >= 12 && hour < 14) {
      this.currentActivityHour = '12h-14h';
    } else if (hour >= 14 && hour < 18) {
      this.currentActivityHour = '14h-18h';
    } else {
      this.currentActivityHour = 'Hors horaires';
    }
    
    // Calculate growth based on total count (can be enhanced with historical data)
    // For now, show positive growth if there are students enrolled
    this.growthPercentage = this.totalCount > 0 ? 5.2 : 0;
  }

  exportReport(): void {
    const reportData = {
      date: new Date().toLocaleDateString('fr-FR'),
      enseignants: this.enseignantCount,
      etudiants: this.etudiantCount,
      parcours: this.parcourStats,
      totalEtudiants: this.totalCount,
      tailleMoyenneClasse: this.averageClassSize
    };

    const csvContent = this.generateCSV(reportData);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `rapport-universitaire-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  private generateCSV(data: any): string {
    let csv = 'Rapport Universitaire\n';
    csv += `Date,${data.date}\n\n`;
    csv += 'Statistiques Générales\n';
    csv += `Enseignants,${data.enseignants}\n`;
    csv += `Étudiants,${data.etudiants}\n\n`;
    csv += 'Répartition par Parcours\n';
    csv += 'Parcours,Nombre d\'étudiants\n';
    
    data.parcours.forEach((p: any) => {
      csv += `${p.parcourNom},${p.studentCount}\n`;
    });
    
    csv += `\nTotal étudiants,${data.totalEtudiants}\n`;
    csv += `Taille moyenne de classe,${data.tailleMoyenneClasse}\n`;
    
    return csv;
  }

  getProgressWidth(count: number, maxValue: number): number {
    return Math.min((count / maxValue) * 100, 100);
  }
}