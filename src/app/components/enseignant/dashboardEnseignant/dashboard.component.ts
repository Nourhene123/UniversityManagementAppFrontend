import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin, of, switchMap, catchError, tap, map } from 'rxjs';

import { NoteDto, TypeNote } from 'src/app/models/NoteDto';
import { ParcourDto } from 'src/app/models/ParcourDto';
import { MatiereDto } from 'src/app/models/MatiereDto';
import { EtudiantDto } from 'src/app/models/EtudiantDto';
import { PanierDto } from 'src/app/models/PanierDto';
import { NoteService } from 'src/app/Services/NoteService/note.service';
import { MatiereService } from 'src/app/Services/MatierService/matiere.service';
import { ParcourService } from 'src/app/Services/ParcourService/parcour.service';
import { PanierService } from 'src/app/Services/PanierService/panier.service';

interface MatiereWithAverages extends MatiereDto {
  averages: { etudiantId: number; etudiantNom: string; moyenne: number; numeroInscription: string }[];
}

interface PanierWithMatieres extends PanierDto {
  matieres: MatiereWithAverages[];
}

interface ParcourWithPaniers extends ParcourDto {
  paniers: PanierWithMatieres[];
  etudiants: EtudiantDto[];
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardEnsignantComponent implements OnInit {
  parcours: ParcourWithPaniers[] = [];
  isLoading: boolean = true;
  errorMessage: string = '';
  successMessage: string = '';
  currentDate: Date = new Date();
  parcourExpanded: { [key: number]: boolean } = {};

  constructor(
    private matiereService: MatiereService,
    private parcourService: ParcourService,
    private noteService: NoteService,
    private panierService: PanierService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.matiereService.getMatieresByEnseignant().pipe(
      switchMap(matieres => {
        if (!matieres || matieres.length === 0) {
          this.errorMessage = 'Aucune matière assignée à cet enseignant.';
          this.isLoading = false;
          return of([]);
        }
        console.log('Matieres fetched:', matieres);
        const matiereIds = matieres.map(m => m.id!); // Extract IDs of matieres assigned to the enseignant
        const panierIds = matieres.map(m => m.panierId || 0); // Extract panierIds from matieres
        return forkJoin([
          this.parcourService.getStudentsGroupedByParcour(),
          this.panierService.getPaniersByTeacher().pipe(
            map(paniers => paniers.filter(panier => panierIds.includes(panier.id!)))
          ),
          this.noteService.getMatiereAverages()
        ]).pipe(
          map(([parcoursWithStudents, paniers, averages]) => {
            console.log('Data fetched:', { parcoursWithStudents, paniers, averages });
            return parcoursWithStudents.map(pws => {
              const panierMap = new Map<number, PanierWithMatieres>();

              // Add all paniers linked to the enseignant's matieres
              paniers.forEach(panier => {
                panierMap.set(panier.id!, { ...panier, matieres: [] });
              });

              // Add "Sans Panier" only if no assigned paniers and unassigned matieres exist
              if (paniers.length === 0 && matieres.some(m => !m.panierId)) {
                panierMap.set(0, { id: 0, nom: 'Sans Panier', coefficientTotal: 0, matieres: [] });
              }

              matieres.forEach(matiere => {
                const panierId = matiere.panierId || 0;
                if (panierMap.has(panierId)) {
                  const matiereWithAverages: MatiereWithAverages = {
                    ...matiere,
                    averages: averages
                      .filter(avg => avg.matiereId === matiere.id)
                      .map(avg => ({
                        etudiantId: avg.etudiantId,
                        etudiantNom: avg.etudiantNom || 'Inconnu',
                        moyenne: avg.moyenne,
                        numeroInscription: pws.etudiants.find(e => e.id === avg.etudiantId)?.numeroInscription || 'N/A'
                      }))
                  };
                  panierMap.get(panierId)!.matieres.push(matiereWithAverages);
                }
              });

              const validPaniers = Array.from(panierMap.values()).filter(panier => panier.matieres.length > 0 || panier.id === 0);
              console.log(`Valid paniers for ${pws.parcourNom}:`, validPaniers);

              return {
                id: pws.parcourId,
                nom: pws.parcourNom,
                annee: pws.parcourNom.split('-')[1] || 'N/A',
                libelle: pws.parcourNom,
                etudiants: pws.etudiants || [],
                paniers: validPaniers
              } as ParcourWithPaniers;
            });
          }),
          tap(parcours => {
            this.parcours = parcours.filter(p => p.etudiants.length > 0);
            this.parcourExpanded = this.parcours.reduce((acc, _, index) => ({ ...acc, [index]: true }), {});
            console.log('Processed parcours:', this.parcours);
            if (this.parcours.length > 0) {
              this.successMessage = 'Données du tableau de bord chargées avec succès !';
            }
          }),
          catchError(err => {
            this.handleError(err, 'Erreur lors du chargement des données du tableau de bord');
            this.isLoading = false;
            return of([]);
          })
        );
      }),
      catchError(err => {
        this.handleError(err, 'Erreur lors du chargement des matières');
        this.isLoading = false;
        return of([]);
      })
    ).subscribe(() => {
      this.isLoading = false;
      if (this.parcours.length === 0 && !this.errorMessage) {
        this.errorMessage = 'Aucun étudiant ou matière trouvé pour les parcours associés.';
        console.log('No data found for parcours');
      }
    });
  }

  calculatePanierAverage(panier: PanierWithMatieres, etudiantId: number): number | undefined {
    const validAverages = panier.matieres
      .map(m => ({
        moyenne: m.averages.find(avg => avg.etudiantId === etudiantId)?.moyenne,
        coefficient: m.coefficient
      }))
      .filter(avg => avg.moyenne !== undefined && avg.coefficient > 0);
    if (validAverages.length === 0) return undefined;
    const totalWeighted = validAverages.reduce((sum, avg) => sum + (avg.moyenne! * avg.coefficient), 0);
    const totalCoefficient = validAverages.reduce((sum, avg) => sum + avg.coefficient, 0);
    return totalCoefficient > 0 ? totalWeighted / totalCoefficient : undefined;
  }

  calculateParcourAverage(parcour: ParcourWithPaniers, etudiantId: number): number | undefined {
    const validAverages = parcour.paniers
      .flatMap(panier => panier.matieres.map(m => ({
        moyenne: m.averages.find(avg => avg.etudiantId === etudiantId)?.moyenne,
        coefficient: m.coefficient
      })))
      .filter(avg => avg.moyenne !== undefined && avg.coefficient > 0);
    if (validAverages.length === 0) return undefined;
    const totalWeighted = validAverages.reduce((sum, avg) => sum + (avg.moyenne! * avg.coefficient), 0);
    const totalCoefficient = validAverages.reduce((sum, avg) => sum + avg.coefficient, 0);
    return totalCoefficient > 0 ? totalWeighted / totalCoefficient : undefined;
  }

  getTotalStudents(): number {
    return this.parcours.reduce((total, parcour) => total + (parcour.etudiants?.length || 0), 0);
  }

  getTotalPaniers(): number {
    return this.parcours.reduce((total, parcour) => total + parcour.paniers.length, 0);
  }

  getOverallAverage(): number | undefined {
    if (!this.parcours.length) return undefined;
    const allAverages = this.parcours.flatMap(parcour =>
      parcour.etudiants.map(etudiant =>
        this.calculateParcourAverage(parcour, etudiant.id!)
      ).filter((avg): avg is number => avg !== undefined)
    ).filter((avg): avg is number => avg !== undefined);
    if (allAverages.length === 0) return undefined;
    return allAverages.reduce((sum, avg) => sum + avg, 0) / allAverages.length;
  }

  toggleParcour(index: number): void {
    this.parcourExpanded[index] = !this.parcourExpanded[index];
  }

  handleError(err: any, message: string): void {
    if (err.status === 403) {
      this.errorMessage = 'Accès refusé. Veuillez vérifier vos permissions ou vous reconnecter.';
      console.error('403 Forbidden:', err);
      setTimeout(() => this.router.navigate(['/login']), 2000);
    } else {
      this.errorMessage = message;
      console.error(message, err);
    }
  }
}