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

interface MatiereWithAverages extends MatiereDto {
  averages: MatiereAverageDto[];
}

interface ParcourWithMatieres extends ParcourDto {
  matieres: MatiereWithAverages[];
  etudiants: EtudiantDto[];
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
  parcours: ParcourWithMatieres[] = [];
  isLoading: boolean = true;
  errorMessage: string = '';
  successMessage: string = '';
  currentDate: Date = new Date();
  parcourExpanded: { [key: number]: boolean } = {};
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

    const enseignantId = Number(localStorage.getItem('enseignantId')) || 1;

    this.matiereService.getMatieresByEnseignant().pipe(
      switchMap((matieres: MatiereDto[]) => {
        if (matieres.length === 0) {
          console.warn('No matieres found for the current teacher.');
          this.errorMessage = 'Aucune matière trouvée pour cet enseignant.';
          return of([]);
        }
        const matiereWithAverages = matieres.map(matiere =>
          this.matiereService.getMatiereAverages(matiere.id!).pipe(
            map(averages => ({ matiere, averages })),
            catchError(err => {
              console.error(`Failed to load averages for matiere ${matiere.nom}:`, err);
              return of({ matiere, averages: [] });
            })
          )
        );
        return forkJoin(matiereWithAverages.length > 0 ? matiereWithAverages : [of({ matiere: { id: 0, nom: '', volumeHoraire: 0, coefficient: 0, averages: [], parcours: [] } as MatiereWithAverages, averages: [] })]);
      }),
      switchMap((matiereWithAverages: { matiere: MatiereDto; averages: MatiereAverageDto[] }[]) => {
        const matiereObservables: Observable<{ matiere: MatiereWithAverages; parcours: ParcourDtoWithEtudiants[] }>[] = matiereWithAverages.map(({ matiere, averages }) =>
          this.parcourService.getParcoursByMatiereId(matiere.id!).pipe(
            switchMap(parcours => {
              const etudiantObservables = parcours.map(p =>
                this.etudiantService.getEtudiantsByParcour(p.id!).pipe(
                  map(etudiants => ({ ...p, etudiants: etudiants || [] } as ParcourDtoWithEtudiants)),
                  catchError(err => {
                    console.error(`Erreur lors du chargement des étudiants pour le parcours ${p.nom}:`, err);
                    return of({ ...p, etudiants: [] } as ParcourDtoWithEtudiants);
                  })
                )
              );
              return forkJoin(etudiantObservables.length > 0 ? etudiantObservables : [of({ id: 0, nom: 'Unknown', annee: 'N/A', libelle: 'Unknown', etudiants: [] } as ParcourDtoWithEtudiants)]).pipe(
                map(parcoursWithEtudiants => ({ matiere: { ...matiere, averages } as MatiereWithAverages, parcours: parcoursWithEtudiants }))
              );
            }),
            catchError(err => {
              console.error(`Erreur lors du chargement des parcours pour la matière ${matiere.nom}:`, err);
              this.errorMessage = `Erreur lors du chargement des parcours pour ${matiere.nom}`;
              return of({ matiere: { ...matiere, averages: [] } as MatiereWithAverages, parcours: [] });
            })
          )
        );
        return forkJoin(matiereObservables.length > 0 ? matiereObservables : [of({ matiere: { id: 0, nom: '', volumeHoraire: 0, coefficient: 0, averages: [], parcours: [] } as MatiereWithAverages, parcours: [] })]);
      }),
      map(matiereParcours => {
        const parcoursMap = new Map<number, ParcourWithMatieres>();
        matiereParcours.forEach(({ matiere, parcours }: { matiere: MatiereWithAverages; parcours: ParcourDtoWithEtudiants[] }) => {
          parcours.forEach((p: ParcourDtoWithEtudiants) => {
            if (!p.id) return;
            if (!parcoursMap.has(p.id)) {
              parcoursMap.set(p.id, {
                id: p.id,
                nom: p.nom || 'Unknown',
                annee: p.annee || 'N/A',
                libelle: p.libelle || p.nom || 'Unknown',
                etudiants: p.etudiants || [],
                matieres: []
              });
            }
            const existingParcour = parcoursMap.get(p.id)!;
            existingParcour.matieres.push(matiere);
          });
        });
        return Array.from(parcoursMap.values()).filter(p => p.etudiants.length > 0 || p.matieres.length > 0);
      }),
      tap((parcours: ParcourWithMatieres[]) => {
        this.parcours = parcours;
        this.parcourExpanded = this.parcours.reduce((acc, _, index) => ({ ...acc, [index]: true }), {});
        this.updateSuccessRateChart();
        this.updateTopBottomChart();
        if (this.parcours.length > 0) {
          this.successMessage = 'Données du tableau de bord chargées avec succès !';
        } else {
          this.errorMessage = 'Aucun parcours avec étudiants ou matières trouvé.';
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

  getTotalStudents(): number {
    return this.parcours.reduce((total, parcour) => total + (parcour.etudiants?.length || 0), 0);
  }

  getTotalMatieres(): number {
    return this.parcours.reduce((total, parcour) => total + parcour.matieres.length, 0);
  }

  getOverallAverage(): number {
    const allAverages = this.parcours.flatMap(parcour =>
      parcour.etudiants.flatMap(etudiant =>
        parcour.matieres
          .map(m => this.getMatiereAverage(m, etudiant.id!))
          .filter((avg): avg is number => avg !== undefined)
      )
    );
    return allAverages.length > 0 ? allAverages.reduce((sum, avg) => sum + avg, 0) / allAverages.length : 0;
  }

  getStudentsAboveThreshold(threshold: number = 10): number {
    const validStudents = this.parcours.flatMap(parcour =>
      parcour.etudiants.filter(etudiant => {
        const averages = parcour.matieres
          .map(m => this.getMatiereAverage(m, etudiant.id!))
          .filter((avg): avg is number => avg !== undefined);
        if (averages.length === 0) return false;
        const studentAverage = averages.reduce((sum, avg) => sum + avg, 0) / averages.length;
        return studentAverage >= threshold;
      })
    );
    return validStudents.length;
  }

  getTopBottomStudents(): { top?: StudentPerformance; bottom?: StudentPerformance } {
    const studentAverages = this.parcours.flatMap(parcour =>
      parcour.etudiants.map(etudiant => {
        const averages = parcour.matieres
          .map(m => this.getMatiereAverage(m, etudiant.id!))
          .filter((avg): avg is number => avg !== undefined);
        const average = averages.length > 0 ? averages.reduce((sum, avg) => sum + avg, 0) / averages.length : 0;
        return { nom: `${etudiant.nom} ${etudiant.prenom}`, average };
      })
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
      const validStudents = parcour.etudiants.filter(e => {
        const averages = parcour.matieres
          .map(m => this.getMatiereAverage(m, e.id!))
          .filter((avg): avg is number => avg !== undefined);
        if (averages.length === 0) return false;
        const totalAverage = averages.reduce((sum, avg) => sum + avg, 0) / averages.length;
        return totalAverage >= 10;
      });
      return (validStudents.length / (parcour.etudiants.length || 1)) * 100;
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
}