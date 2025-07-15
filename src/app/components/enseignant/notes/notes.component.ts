import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin, of, switchMap, catchError, map, Observable } from 'rxjs';

import { NoteDto, TypeNote } from 'src/app/models/NoteDto';
import { ParcourDto } from 'src/app/models/ParcourDto';
import { MatiereDto } from 'src/app/models/MatiereDto';
import { EtudiantDto } from 'src/app/models/EtudiantDto';
import { SemestreDto } from 'src/app/models/SemestreDto';

import { ParcourService } from 'src/app/Services/ParcourService/parcour.service';
import { MatiereService } from 'src/app/Services/MatierService/matiere.service';
import { NoteService } from 'src/app/Services/NoteService/note.service';
import { SemestreService } from 'src/app/Services/SemestreService/semestre.service';

@Component({
  selector: 'app-notes',
  templateUrl: './notes.component.html',
  styleUrls: ['./notes.component.css']
})
export class NotesComponent implements OnInit {
  matieres: (MatiereDto & {
    parcours: (ParcourDto & {
      etudiants: EtudiantDto[];
    })[];
  })[] = [];
  semestres: SemestreDto[] = [];
  selectedSemestreId: number | null = null;
  typeNote: TypeNote | '' = '';
  errorMessage: string = '';
  notesMap: { [key: string]: (number | undefined)[] } = {};
  isLoading: boolean = true;
  currentDate: Date = new Date();
  matiereExpanded: { [key: number]: boolean } = {};

  constructor(
    private matiereService: MatiereService,
    private parcourService: ParcourService,
    private noteService: NoteService,
    private semestreService: SemestreService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadSemestres();

    this.matiereService.getMatieresByEnseignant().pipe(
      switchMap(matieres => {
        if (!matieres || matieres.length === 0) {
          this.errorMessage = 'Aucune matière trouvée pour l\'enseignant.';
          this.isLoading = false;
          return of([]);
        }
        this.matiereExpanded = matieres.reduce((acc, _, index) => ({ ...acc, [index]: true }), {});
        const matiereObservables = matieres.map(matiere => 
          this.loadParcoursAndEtudiantsForMatiere(matiere)
        );
        return forkJoin(matiereObservables);
      }),
      catchError(err => {
        this.handleError(err, 'Erreur lors du chargement des matières');
        this.isLoading = false;
        return of([]);
      })
    ).subscribe(matieresAvecParcours => {
      this.matieres = matieresAvecParcours;
      this.isLoading = false;
      if (this.matieres.every(matiere => matiere.parcours.every(parcour => parcour.etudiants.length === 0))) {
        this.errorMessage = 'Aucun étudiant trouvé pour les matières et parcours associés.';
      }
    });
  }

  loadSemestres(): void {
    this.semestreService.getAllSemestres().pipe(
      catchError(err => {
        this.handleError(err, 'Erreur lors du chargement des semestres');
        return of([]);
      })
    ).subscribe(semestres => {
      this.semestres = semestres || [];
      this.isLoading = false;
    });
  }

  loadParcoursAndEtudiantsForMatiere(matiere: MatiereDto) {
    if (!matiere.id) {
      console.error('Matiere ID is undefined:', matiere);
      return of({ ...matiere, parcours: [] });
    }
    return this.parcourService.getParcoursByMatiereId(matiere.id).pipe(
      catchError(err => {
        console.error(`Error fetching parcours for matiere ${matiere.id}:`, err);
        return of([]);
      }),
      switchMap((parcours: ParcourDto[]) => {
        console.log(`Fetched ${parcours.length} parcours for matiere ${matiere.id}:`, parcours);
        if (parcours.length === 0) {
          return of([]);
        }
        const parcoursObservables = parcours.map(parcour => {
          if (!parcour.id) {
            console.error('Parcour ID is undefined:', parcour);
            return of({ ...parcour, etudiants: [] });
          }
          return this.parcourService.getEtudiantsByParcourId(parcour.id).pipe(
            catchError(err => {
              console.error(`Error fetching etudiants for parcour ${parcour.id}:`, err);
              this.handleError(err, `Erreur lors du chargement des étudiants pour le parcours ${parcour.nom}`);
              return of([]);
            }),
            map((etudiants: EtudiantDto[]) => {
              console.log(`Fetched ${etudiants.length} etudiants for parcour ${parcour.id}:`, etudiants);
              return { ...parcour, etudiants: etudiants || [] };
            })
          );
        });
        return forkJoin(parcoursObservables);
      }),
      map(parcoursAvecEtudiants => {
        console.log(`Final parcours with etudiants for matiere ${matiere.id}:`, parcoursAvecEtudiants);
        return { ...matiere, parcours: parcoursAvecEtudiants };
      }),
      catchError(err => {
        console.error(`Error processing matiere ${matiere.id}:`, err);
        return of({ ...matiere, parcours: [] });
      })
    );
  }

  toggleMatiere(index: number): void {
    this.matiereExpanded[index] = !this.matiereExpanded[index];
  }

  getNoteIndices(matiereId: number, etudiantId: number): number[] {
    const key = `${matiereId}_${etudiantId}`;
    if (!this.notesMap[key]) {
      this.notesMap[key] = [undefined];
    }
    return Array(this.notesMap[key].length).fill(0).map((_, i) => i);
  }

  addNote(matiereId: number, etudiantId: number): void {
    const key = `${matiereId}_${etudiantId}`;
    if (!this.notesMap[key]) {
      this.notesMap[key] = [undefined];
    }
    if (this.notesMap[key].length < 3) {
      this.notesMap[key].push(undefined);
    }
  }

  removeNote(matiereId: number, etudiantId: number, index: number): void {
    const key = `${matiereId}_${etudiantId}`;
    if (this.notesMap[key] && this.notesMap[key].length > 1) {
      this.notesMap[key].splice(index, 1);
    }
  }

  onTypeNoteChange(): void {
    this.errorMessage = '';
    this.loadNotesForSelection();
  }

  onSemestreChange(): void {
    this.errorMessage = '';
    this.loadNotesForSelection();
  }

  loadNotesForSelection(): void {
    if (this.selectedSemestreId && this.typeNote) {
      this.isLoading = true;
      this.noteService.getNotesBySemestreAndType(this.selectedSemestreId, this.typeNote).pipe(
        catchError(err => {
          this.handleError(err, 'Erreur lors du chargement des notes existantes');
          return of([]);
        })
      ).subscribe((notes: NoteDto[]) => {
        console.log('Fetched notes:', notes);
        this.notesMap = {};
        notes.forEach(note => {
          const key = `${note.matiereId}_${note.etudiantId}`;
          if (!this.notesMap[key]) {
            this.notesMap[key] = [];
          }
          if (note.valeur !== undefined) {
            this.notesMap[key].push(note.valeur);
          }
        });
        this.matieres.forEach(matiere => {
          matiere.parcours.forEach(parcour => {
            parcour.etudiants.forEach(etudiant => {
              const key = `${matiere.id}_${etudiant.id}`;
              if (!this.notesMap[key]) {
                this.notesMap[key] = [undefined];
              }
            });
          });
        });
        this.isLoading = false;
      });
    }
  }

  submitAllNotes(): void {
    if (!this.selectedSemestreId || !this.typeNote) {
      this.errorMessage = 'Veuillez sélectionner un semestre et un type de note.';
      return;
    }

    const noteObservables: Observable<NoteDto | null>[] = [];
    for (let matiere of this.matieres) {
      for (let parcour of matiere.parcours) {
        for (let etudiant of parcour.etudiants) {
          const key = `${matiere.id}_${etudiant.id}`;
          const notes = this.notesMap[key] || [];
          notes.forEach((valeur, index) => {
            if (valeur !== undefined && valeur >= 0 && valeur <= 20) {
              noteObservables.push(
                this.noteService.createNote({
                  etudiantId: etudiant.id!,
                  matiereId: matiere.id!,
                  semestreId: this.selectedSemestreId!,
                  typeNote: this.typeNote as TypeNote,
                  valeur
                }).pipe(
                  catchError(err => {
                    this.handleError(err, `Erreur pour ${etudiant.nom} ${etudiant.prenom}, note ${index + 1}`);
                    return of(null);
                  })
                )
              );
            }
          });
        }
      }
    }

    if (noteObservables.length === 0) {
      this.errorMessage = 'Aucune note valide à enregistrer.';
      return;
    }

    this.isLoading = true;
    forkJoin(noteObservables).subscribe({
      next: () => {
        this.errorMessage = '';
        this.isLoading = false;
        this.showSuccessMessage('Notes enregistrées avec succès !');
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'Une erreur est survenue lors de l\'enregistrement des notes.';
      }
    });
  }

  showSuccessMessage(message: string): void {
    this.errorMessage = '';
    alert(message); // Replace with ngx-toastr or similar in production
  }

  handleError(err: any, message: string): void {
    if (err.status === 403) {
      this.errorMessage = 'Accès refusé. Redirection en cours...';
      setTimeout(() => this.router.navigate(['/login']), 2000);
    } else {
      this.errorMessage = message;
    }
    console.error(message, err);
  }
}