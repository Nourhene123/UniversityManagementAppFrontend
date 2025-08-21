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
}