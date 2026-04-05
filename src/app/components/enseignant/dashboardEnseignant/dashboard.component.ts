import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin, of, switchMap, catchError, tap, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Chart, ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { MatiereDto } from 'src/app/models/MatiereDto';
import { ParcourDto, ParcourDtoWithEtudiants } from 'src/app/models/ParcourDto';
import { EtudiantDto } from 'src/app/models/EtudiantDto';
import { MatiereAverageDto } from 'src/app/models/MatiereAverageDto';
import { MatiereService } from 'src/app/Services/MatierService/matiere.service';
import { ParcourService } from 'src/app/Services/ParcourService/parcour.service';
import { EtudiantService } from 'src/app/Services/EtudiantService/etudiant.service';
import { ClasseDto } from 'src/app/models/ClasseDto';
import { ClasseService } from 'src/app/Services/Classe/classe.service';
import { AuthService } from 'src/app/Services/Auth/auth.service';
import { UserResponse } from 'src/app/models/UserResponse';
import { ClasseWithMatieresDto } from 'src/app/models/ClasseWithMatieresDto';

interface MatiereWithAverages extends MatiereDto {
  averages: MatiereAverageDto[];
}

interface ClasseWithEtudiants extends ClasseDto {
  etudiants: EtudiantDto[];
  matieres: MatiereWithAverages[];
}

interface ParcourWithClasses extends ParcourDto {
  etudiants: EtudiantDto[];
  classes: ClasseWithEtudiants[];
}

interface StudentPerformance {
  nom: string;
  average: number;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  parcours: ParcourWithClasses[] = [];
  isLoading: boolean = true;
  errorMessage: string = '';
  successMessage: string = '';
  currentDate: Date = new Date();
  parcourExpanded: { [key: number]: boolean } = {};
  classExpanded: { [key: string]: boolean } = {};
  
  // New tabbed interface properties
  selectedParcourIndex: number = 0;
  get selectedParcour(): ParcourWithClasses | null {
    return this.parcours[this.selectedParcourIndex] || null;
  }
  
  // Filter properties
  studentFilter: 'all' | 'at-risk' | 'good' | 'excellent' = 'all';
  showAtRiskOnly: boolean = false;
  
  // New enhancement properties
  lastExportDate: Date | null = null;
  showTrendChart: boolean = true;
  showClassComparison: boolean = false;
  isGeneratingReport: boolean = false;
  
  // Trend Chart (Evolution over time)
  trendChartData: ChartData<'line'> = { labels: [], datasets: [] };
  trendChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: { display: true, labels: { color: '#fff' } },
      title: { display: true, text: 'Évolution des Moyennes par Semestre', color: '#fff', font: { size: 16 } }
    },
    scales: {
      y: { beginAtZero: true, max: 20, title: { display: true, text: 'Moyenne', color: '#fff' }, ticks: { color: '#fff' } },
      x: { title: { display: true, text: 'Période', color: '#fff' }, ticks: { color: '#fff' } }
    }
  };
  
  // Class Comparison Chart
  classComparisonChartData: ChartData<'radar'> = { labels: [], datasets: [] };
  classComparisonChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: { display: true, labels: { color: '#fff' } },
      title: { display: true, text: 'Comparaison entre Classes', color: '#fff', font: { size: 16 } }
    },
    scales: {
      r: {
        min: 0,
        max: 20,
        ticks: { color: 'rgba(255, 255, 255, 0.7)', backdropColor: 'transparent' },
        pointLabels: { color: 'rgba(255, 255, 255, 0.9)' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' }
      }
    }
  };
  
  successRateChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  successRateChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: true, text: 'Taux de Réussite par Parcours (%)', color: '#fff', font: { size: 16 } }
    },
    scales: {
      y: { beginAtZero: true, max: 100, title: { display: true, text: 'Taux de Réussite (%)', color: '#fff' }, ticks: { color: '#fff' } },
      x: { title: { display: true, text: 'Parcours', color: '#fff' }, ticks: { color: '#fff' } }
    }
  };

  @ViewChild('topBottomChart') topBottomChart!: ElementRef;
  private topBottomChartInstance: Chart | undefined;
  topBottomChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  topBottomChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: { display: false }
    },
    scales: {
      y: { beginAtZero: true, max: 20, title: { display: true, text: 'Moyenne (0-20)', color: '#fff' }, ticks: { color: '#fff' } },
      x: { title: { display: true, text: 'Étudiants', color: '#fff' }, ticks: { color: '#fff' } }
    }
  };

  constructor(
    private matiereService: MatiereService,
    private parcourService: ParcourService,
    private etudiantService: EtudiantService,
    private classeService: ClasseService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  ngAfterViewInit(): void {
    if (this.topBottomChart) {
      this.initializeTopBottomChart();
    } else {
      console.error('topBottomChart canvas is not available');
    }
  }

  ngOnDestroy(): void {
    if (this.topBottomChartInstance) {
      this.topBottomChartInstance.destroy();
    }
  }

  loadDashboardData(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.getCurrentUser().pipe(
      switchMap((user: UserResponse | null) => {
        if (!user || !user.id) {
          console.error('No authenticated user found or invalid user ID');
          this.errorMessage = 'Utilisateur non authentifié. Veuillez vous reconnecter.';
          this.router.navigate(['/login']);
          throw new Error('No authenticated user');
        }

        const enseignantId = Number(user.id);
        console.log('Loading dashboard data for connected enseignantId:', enseignantId);

        return this.classeService.getClassesByEnseignantId(enseignantId).pipe(
          tap(classes => console.log('Classes by enseignantId', enseignantId, ':', classes)),
          switchMap((classes: ClasseWithMatieresDto[]) => {
            if (classes.length === 0) {
              console.warn('No classes found for the current teacher.');
              this.errorMessage = 'Aucune classe trouvée pour cet enseignant.';
              return of([]);
            }

            const parcoursMap = new Map<number, ParcourWithClasses>();
            classes.forEach(classe => {
              if (!classe.parcourId) return;
              if (!parcoursMap.has(classe.parcourId)) {
                parcoursMap.set(classe.parcourId, {
                  id: classe.parcourId,
                  nom: 'Unknown',
                  annee: 'N/A',
                  libelle: 'Unknown',
                  etudiants: [],
                  classes: []
                });
              }
              const parcour = parcoursMap.get(classe.parcourId)!;
              parcour.classes.push({
                ...classe,
                etudiants: [],
                matieres: classe.matieres ? classe.matieres.map(matiere => ({ ...matiere, averages: [] } as MatiereWithAverages)) : []
              });
            });

            const parcourObservables = Array.from(parcoursMap.entries()).map(([parcourId, parcour]) => {
              return forkJoin({
                parcourDetails: this.parcourService.getParcourById(parcourId).pipe(
                  catchError(err => {
                    console.error(`Failed to load parcour ${parcourId}:`, err);
                    return of({ id: parcourId, nom: 'Unknown', annee: 'N/A', libelle: 'Unknown' } as ParcourDto);
                  })
                ),
                classesWithEtudiants: forkJoin(
                  parcour.classes.map(classe =>
                    forkJoin({
                      etudiants: this.classeService.getEtudiantsByClasseId(classe.id!).pipe(
                        map(etudiants => etudiants || []),
                        catchError(err => {
                          console.error(`Failed to load etudiants for classe ${classe.nom}:`, err);
                          return of([]);
                        })
                      ),
                      matieresWithAverages: classe.matieres.length > 0 ? forkJoin(
                        classe.matieres.map(matiere =>
                          this.matiereService.getMatiereAverages(matiere.id!).pipe(
                            map(averages => ({ ...matiere, averages } as MatiereWithAverages)),
                            catchError(err => {
                              console.error(`Failed to load averages for matiere ${matiere.nom}:`, err);
                              return of({ ...matiere, averages: [] } as MatiereWithAverages);
                            })
                          )
                        )
                      ) : of([] as MatiereWithAverages[])
                    }).pipe(
                      map(({ etudiants, matieresWithAverages }) => ({
                        ...classe,
                        etudiants,
                        matieres: matieresWithAverages
                      } as ClasseWithEtudiants))
                    )
                  )
                )
              }).pipe(
                map(({ parcourDetails, classesWithEtudiants }) => ({
                  ...parcour,
                  id: parcourDetails.id,
                  nom: parcourDetails.nom || 'Unknown',
                  annee: parcourDetails.annee || 'N/A',
                  libelle: parcourDetails.libelle || parcourDetails.nom || 'Unknown',
                  classes: classesWithEtudiants,
                  etudiants: classesWithEtudiants.flatMap(c => c.etudiants)
                } as ParcourWithClasses))
              );
            });

            return forkJoin(parcourObservables.length > 0 ? parcourObservables : [of({
              id: 0,
              nom: 'Unknown',
              annee: 'N/A',
              libelle: 'Unknown',
              etudiants: [],
              classes: []
            } as ParcourWithClasses)]);
          })
        );
      }),
      tap((parcours: ParcourWithClasses[]) => {
        this.parcours = parcours.filter(p => p.classes.length > 0);
        this.parcourExpanded = this.parcours.reduce((acc, _, index) => ({ ...acc, [index]: true }), {});
        this.classExpanded = {};
        this.parcours.forEach((p, pi) => {
          p.classes.forEach((_, ci) => {
            this.classExpanded[`${pi}-${ci}`] = true;
          });
        });
        this.updateSuccessRateChart();
        this.updateTopBottomChart();
        if (this.parcours.length > 0) {
          this.successMessage = 'Données du tableau de bord chargées avec succès !';
        } else {
          this.errorMessage = 'Aucune classe ou matière trouvée pour cet enseignant.';
        }
        this.isLoading = false;
      }),
      catchError(err => {
        this.handleError(err, 'Erreur lors du chargement des données du tableau de bord');
        this.isLoading = false;
        return of([]);
      })
    ).subscribe();
  }

  getMatiereAverage(matiere: MatiereWithAverages, etudiantId: number): number | undefined {
    return matiere.averages.find(avg => avg.etudiantId === etudiantId)?.moyenne;
  }

  getStudentAverage(classe: ClasseWithEtudiants, etudiantId: number): number | undefined {
    const averages = classe.matieres
      .map(m => this.getMatiereAverage(m, etudiantId))
      .filter((avg): avg is number => avg !== undefined);
    return averages.length > 0 ? averages.reduce((sum, avg) => sum + avg, 0) / averages.length : undefined;
  }

  getTotalStudents(): number {
    return this.parcours.reduce((total, p) => total + p.classes.reduce((sub, c) => sub + c.etudiants.length, 0), 0);
  }

  getTotalMatieres(): number {
    const uniqueMatieres = new Set<number>();
    this.parcours.forEach(parcour => {
      parcour.classes.forEach(classe => {
        classe.matieres.forEach(matiere => {
          if (matiere.id) {
            uniqueMatieres.add(matiere.id);
          }
        });
      });
    });
    return uniqueMatieres.size;
  }

  getOverallAverage(): number {
    const allAverages = this.parcours.flatMap(parcour =>
      parcour.classes.flatMap(classe => classe.etudiants
        .map(etudiant => this.getStudentAverage(classe, etudiant.id!))
        .filter((avg): avg is number => avg !== undefined)
      )
    );
    return allAverages.length > 0 ? allAverages.reduce((sum, avg) => sum + avg, 0) / allAverages.length : 0;
  }

  getStudentsAboveThreshold(threshold: number = 10): number {
    const validStudents = this.parcours.flatMap(parcour =>
      parcour.classes.flatMap(classe => classe.etudiants.filter(etudiant => {
        const studentAverage = this.getStudentAverage(classe, etudiant.id!);
        return studentAverage !== undefined && studentAverage >= threshold;
      }))
    );
    return validStudents.length;
  }

  getTopBottomStudents(): { top?: StudentPerformance; bottom?: StudentPerformance } {
    const studentAverages = this.parcours.flatMap(parcour =>
      parcour.classes.flatMap(classe => classe.etudiants.map(etudiant => {
        const average = this.getStudentAverage(classe, etudiant.id!) || 0;
        return { nom: `${etudiant.nom} ${etudiant.prenom}`, average };
      }))
    );

    if (studentAverages.length === 0) return { top: undefined, bottom: undefined };

    const top = studentAverages.reduce((max, current) => (max.average > current.average ? max : current));
    const bottom = studentAverages.reduce((min, current) => (min.average < current.average ? min : current));

    return { top, bottom };
  }

  private initializeTopBottomChart(): void {
    if (this.topBottomChartInstance) {
      this.topBottomChartInstance.destroy();
      this.topBottomChartInstance = undefined;
    }
    if (this.topBottomChart && this.topBottomChart.nativeElement) {
      this.topBottomChartInstance = new Chart(this.topBottomChart.nativeElement, {
        type: 'bar' as ChartType,
        data: this.topBottomChartData,
        options: this.topBottomChartOptions as ChartConfiguration['options']
      });
    }
  }

  private updateTopBottomChart(): void {
    const { top, bottom } = this.getTopBottomStudents();
    this.topBottomChartData = {
      labels: [top?.nom || 'N/A', bottom?.nom || 'N/A'],
      datasets: [{
        label: 'Moyenne',
        data: [top?.average || 0, bottom?.average || 0],
        backgroundColor: ['rgba(75, 192, 192, 0.6)', 'rgba(255, 99, 132, 0.6)'],
        borderColor: ['rgba(75, 192, 192, 1)', 'rgba(255, 99, 132, 1)'],
        borderWidth: 1
      }]
    };
    if (this.topBottomChartInstance) {
      this.topBottomChartInstance.data = this.topBottomChartData;
      this.topBottomChartInstance.update();
    } else if (this.topBottomChart) {
      this.initializeTopBottomChart();
    }
  }

  toggleParcour(index: number): void {
    this.parcourExpanded[index] = !this.parcourExpanded[index];
  }

  toggleClass(parcourIndex: number, classIndex: number): void {
    const key = `${parcourIndex}-${classIndex}`;
    this.classExpanded[key] = !this.classExpanded[key];
  }

  handleError(err: any, message: string): void {
    if (err.status === 403) {
      this.errorMessage = 'Accès refusé. Veuillez vérifier vos permissions ou vous reconnecter.';
      setTimeout(() => this.router.navigate(['/login']), 2000);
    } else {
      this.errorMessage = message;
    }
  }

  updateSuccessRateChart(): void {
    const labels = this.parcours.map(p => `${p.nom} (${p.annee})`);
    const successRates = this.parcours.map(parcour => {
      const validStudents = parcour.classes.flatMap(classe => classe.etudiants.filter(e => {
        const totalAverage = this.getStudentAverage(classe, e.id!);
        return totalAverage !== undefined && totalAverage >= 10;
      }));
      const totalStudents = parcour.classes.reduce((t, c) => t + c.etudiants.length, 0) || 1;
      return (validStudents.length / totalStudents) * 100;
    });

    this.successRateChartData = {
      labels,
      datasets: [{
        label: 'Taux de Réussite',
        data: successRates,
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1
      }]
    };
  }

  exportData(): void {
    const data = this.parcours.map(parcour => ({
      parcour: `${parcour.nom} (${parcour.annee})`,
      classes: parcour.classes.map(classe => ({
        nom: classe.nom,
        section: classe.section,
        etudiants: classe.etudiants.map(etudiant => ({
          nom: `${etudiant.nom} ${etudiant.prenom}`,
          numeroInscription: etudiant.numeroInscription,
          moyenne: this.getStudentAverage(classe, etudiant.id!)
        }))
      }))
    }));

    const csvContent = this.convertToCSV(data);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `donnees_enseignant_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Track last export
    this.lastExportDate = new Date();
    
    this.successMessage = 'Données exportées avec succès !';
    setTimeout(() => this.successMessage = '', 3000);
  }

  // Generate PDF Report
  generatePDFReport(): void {
    this.isGeneratingReport = true;
    this.successMessage = 'Génération du rapport PDF en cours...';
    
    // Simulate PDF generation (in real app, use a library like jsPDF or html2canvas)
    setTimeout(() => {
      const reportData = {
        title: 'Rapport de Performance - Enseignant',
        date: new Date().toLocaleDateString('fr-FR'),
        parcours: this.parcours.map(p => ({
          nom: p.nom,
          annee: p.annee,
          totalStudents: this.getParcourStudentCount(p),
          successRate: this.getParcourSuccessRate(p),
          average: this.getParcourAverage(p)
        })),
        overallStats: {
          totalStudents: this.getTotalStudents(),
          totalMatieres: this.getTotalMatieres(),
          overallAverage: this.getOverallAverage(),
          studentsAbove10: this.getStudentsAboveThreshold(10)
        }
      };
      
      console.log('PDF Report generated:', reportData);
      
      // Create a printable HTML version
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(this.generateReportHTML(reportData));
        printWindow.document.close();
        printWindow.print();
      }
      
      this.isGeneratingReport = false;
      this.successMessage = 'Rapport généré avec succès !';
      setTimeout(() => this.successMessage = '', 3000);
    }, 1500);
  }

  private generateReportHTML(reportData: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${reportData.title}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          h1 { color: #333; border-bottom: 3px solid #8b5cf6; padding-bottom: 10px; }
          h2 { color: #666; margin-top: 30px; }
          .stat-box { background: #f5f5f5; padding: 15px; margin: 10px 0; border-radius: 8px; }
          .stat-label { font-weight: bold; color: #888; }
          .stat-value { font-size: 24px; color: #333; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background: #8b5cf6; color: white; }
          .success-rate { font-weight: bold; }
          .high { color: #22c55e; }
          .medium { color: #eab308; }
          .low { color: #ef4444; }
        </style>
      </head>
      <body>
        <h1>${reportData.title}</h1>
        <p><strong>Date:</strong> ${reportData.date}</p>
        
        <h2>Statistiques Globales</h2>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;">
          <div class="stat-box">
            <div class="stat-label">Total Étudiants</div>
            <div class="stat-value">${reportData.overallStats.totalStudents}</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">Moyenne Générale</div>
            <div class="stat-value">${reportData.overallStats.overallAverage.toFixed(2)}/20</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">Matières Enseignées</div>
            <div class="stat-value">${reportData.overallStats.totalMatieres}</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">Étudiants Réussis (≥10)</div>
            <div class="stat-value">${reportData.overallStats.studentsAbove10}</div>
          </div>
        </div>
        
        <h2>Performance par Parcours</h2>
        <table>
          <thead>
            <tr>
              <th>Parcours</th>
              <th>Année</th>
              <th>Étudiants</th>
              <th>Taux de Réussite</th>
              <th>Moyenne</th>
            </tr>
          </thead>
          <tbody>
            ${reportData.parcours.map((p: any) => `
              <tr>
                <td>${p.nom}</td>
                <td>${p.annee}</td>
                <td>${p.totalStudents}</td>
                <td class="success-rate ${p.successRate >= 70 ? 'high' : p.successRate >= 50 ? 'medium' : 'low'}">${p.successRate}%</td>
                <td>${p.average.toFixed(2)}/20</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <footer style="margin-top: 40px; text-align: center; color: #888; font-size: 12px;">
          Généré par la Plateforme Universitaire - © ${new Date().getFullYear()}
        </footer>
      </body>
      </html>
    `;
  }

  // Notify At-Risk Students
  notifyAtRiskStudents(): void {
    if (!this.selectedParcour) return;
    
    const atRiskStudents = this.getAtRiskStudents(this.selectedParcour);
    if (atRiskStudents.length === 0) {
      this.successMessage = 'Aucun étudiant en difficulté à notifier.';
      setTimeout(() => this.successMessage = '', 3000);
      return;
    }
    
    // Simulate notification sending
    this.successMessage = `Envoi de notifications à ${atRiskStudents.length} étudiant(s)...`;
    
    setTimeout(() => {
      console.log('Notifications sent to at-risk students:', atRiskStudents.map(s => ({
        etudiant: `${s.etudiant.nom} ${s.etudiant.prenom}`,
        email: s.etudiant.email,
        average: s.average
      })));
      
      this.successMessage = `${atRiskStudents.length} notification(s) envoyée(s) avec succès !`;
      setTimeout(() => this.successMessage = '', 4000);
    }, 2000);
  }

  // Toggle Chart Visibility
  toggleTrendChart(): void {
    this.showTrendChart = !this.showTrendChart;
    if (this.showTrendChart) {
      this.updateTrendChart();
    }
  }

  toggleClassComparison(): void {
    this.showClassComparison = !this.showClassComparison;
    if (this.showClassComparison) {
      this.updateClassComparisonChart();
    }
  }

  // Update Trend Chart (Simulated data - in real app, fetch historical data)
  updateTrendChart(): void {
    // Simulated semester data
    const semesters = ['S1 2023', 'S2 2023', 'S1 2024', 'S2 2024'];
    
    this.trendChartData = {
      labels: semesters,
      datasets: this.parcours.map((parcour, index) => ({
        label: parcour.nom,
        data: semesters.map(() => {
          // Simulated trend data based on current average with some variation
          const baseAvg = this.getParcourAverage(parcour);
          return Math.max(0, Math.min(20, baseAvg + (Math.random() - 0.5) * 4));
        }),
        borderColor: this.getChartColor(index),
        backgroundColor: this.getChartColor(index, 0.2),
        tension: 0.4,
        fill: false
      }))
    };
  }

  // Update Class Comparison Chart
  updateClassComparisonChart(): void {
    if (!this.selectedParcour || this.selectedParcour.classes.length === 0) return;
    
    // Get all unique matieres across classes
    const allMatieres = new Set<string>();
    this.selectedParcour.classes.forEach(classe => {
      classe.matieres.forEach(m => allMatieres.add(m.nom));
    });
    
    const matiereLabels = Array.from(allMatieres);
    
    this.classComparisonChartData = {
      labels: matiereLabels,
      datasets: this.selectedParcour.classes.map((classe, index) => ({
        label: classe.nom,
        data: matiereLabels.map(matiereName => {
          const matiere = classe.matieres.find(m => m.nom === matiereName);
          if (!matiere) return 0;
          
          // Calculate average for this matiere in this class
          const averages = classe.etudiants
            .map(e => this.getMatiereAverage(matiere, e.id!))
            .filter((avg): avg is number => avg !== undefined);
          
          return averages.length > 0 
            ? averages.reduce((sum, avg) => sum + avg, 0) / averages.length 
            : 0;
        }),
        borderColor: this.getChartColor(index),
        backgroundColor: this.getChartColor(index, 0.2),
        borderWidth: 2
      }))
    };
  }

  private getChartColor(index: number, alpha: number = 1): string {
    const colors = [
      `rgba(139, 92, 246, ${alpha})`,   // Purple
      `rgba(59, 130, 246, ${alpha})`,  // Blue
      `rgba(34, 197, 94, ${alpha})`,    // Green
      `rgba(234, 179, 8, ${alpha})`,   // Yellow
      `rgba(239, 68, 68, ${alpha})`,   // Red
      `rgba(236, 72, 153, ${alpha})`   // Pink
    ];
    return colors[index % colors.length];
  }

  // Get Last Export Text
  getLastExportText(): string {
    if (!this.lastExportDate) return 'Aucun export récent';
    
    const now = new Date();
    const diff = now.getTime() - this.lastExportDate.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Exporté à l\'instant';
    if (minutes < 60) return `Exporté il y a ${minutes} min`;
    if (hours < 24) return `Exporté il y a ${hours}h`;
    return `Exporté il y a ${days} jour(s)`;
  }

  private convertToCSV(data: any[]): string {
    const headers = ['Parcours', 'Classe', 'Section', 'Étudiant', 'N° Inscription', 'Moyenne'];
    const rows: string[] = [headers.join(',')];

    data.forEach(parcour => {
      parcour.classes.forEach((classe: any) => {
        classe.etudiants.forEach((etudiant: any) => {
          rows.push([
            parcour.parcour,
            classe.nom,
            classe.section,
            etudiant.nom,
            etudiant.numeroInscription || 'N/A',
            etudiant.moyenne?.toFixed(2) || 'N/A'
          ].join(','));
        });
      });
    });

    return rows.join('\n');
  }

  refreshData(): void {
    this.loadDashboardData();
    this.successMessage = 'Données actualisées !';
    setTimeout(() => this.successMessage = '', 2000);
  }

  // New tabbed interface methods
  selectParcour(index: number): void {
    this.selectedParcourIndex = index;
  }

  getParcourStudentCount(parcour: ParcourWithClasses): number {
    return parcour.classes.reduce((total, classe) => total + (classe.etudiants?.length || 0), 0);
  }

  getParcourSuccessRate(parcour: ParcourWithClasses): number {
    const validStudents = parcour.classes.flatMap(classe => 
      classe.etudiants.filter(e => {
        const avg = this.getStudentAverage(classe, e.id!);
        return avg !== undefined && avg >= 10;
      })
    );
    const totalStudents = this.getParcourStudentCount(parcour) || 1;
    return Math.round((validStudents.length / totalStudents) * 100);
  }

  getParcourAverage(parcour: ParcourWithClasses): number {
    const allAverages = parcour.classes.flatMap(classe =>
      classe.etudiants
        .map(e => this.getStudentAverage(classe, e.id!))
        .filter((avg): avg is number => avg !== undefined)
    );
    return allAverages.length > 0 
      ? allAverages.reduce((sum, avg) => sum + avg, 0) / allAverages.length 
      : 0;
  }

  getInitials(nom: string, prenom: string): string {
    const firstInitial = prenom?.charAt(0)?.toUpperCase() || '';
    const lastInitial = nom?.charAt(0)?.toUpperCase() || '';
    return firstInitial + lastInitial;
  }

  // Filter and At-Risk Student Methods
  getAtRiskStudents(parcour: ParcourWithClasses): { classe: ClasseWithEtudiants, etudiant: EtudiantDto, average: number }[] {
    const atRisk: { classe: ClasseWithEtudiants, etudiant: EtudiantDto, average: number }[] = [];
    parcour.classes.forEach(classe => {
      classe.etudiants.forEach(etudiant => {
        const avg = this.getStudentAverage(classe, etudiant.id!);
        if (avg !== undefined && avg < 10) {
          atRisk.push({ classe, etudiant, average: avg });
        }
      });
    });
    return atRisk.sort((a, b) => a.average - b.average);
  }

  isAtRisk(classe: ClasseWithEtudiants, etudiant: EtudiantDto): boolean {
    const avg = this.getStudentAverage(classe, etudiant.id!);
    return avg !== undefined && avg < 10;
  }

  isGood(classe: ClasseWithEtudiants, etudiant: EtudiantDto): boolean {
    const avg = this.getStudentAverage(classe, etudiant.id!);
    return avg !== undefined && avg >= 10 && avg < 14;
  }

  isExcellent(classe: ClasseWithEtudiants, etudiant: EtudiantDto): boolean {
    const avg = this.getStudentAverage(classe, etudiant.id!);
    return avg !== undefined && avg >= 14;
  }

  getFilteredStudents(classe: ClasseWithEtudiants): EtudiantDto[] {
    // If showAtRiskOnly is toggled, override filter
    if (this.showAtRiskOnly) {
      return classe.etudiants.filter(e => this.isAtRisk(classe, e));
    }

    switch (this.studentFilter) {
      case 'at-risk':
        return classe.etudiants.filter(e => this.isAtRisk(classe, e));
      case 'good':
        return classe.etudiants.filter(e => this.isGood(classe, e));
      case 'excellent':
        return classe.etudiants.filter(e => this.isExcellent(classe, e));
      default:
        return classe.etudiants;
    }
  }

  getFilteredStudentCount(parcour: ParcourWithClasses): number {
    let count = 0;
    parcour.classes.forEach(classe => {
      count += this.getFilteredStudents(classe).length;
    });
    return count;
  }
}