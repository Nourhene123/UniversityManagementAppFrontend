import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin, of, switchMap, catchError, map, Observable, tap, finalize } from 'rxjs';
import { NoteDto, TypeNote } from 'src/app/models/NoteDto';
import { ParcourDto, ParcourDtoWithEtudiants } from 'src/app/models/ParcourDto';
import { MatiereDto } from 'src/app/models/MatiereDto';
import { EtudiantDto } from 'src/app/models/EtudiantDto';
import { TypeNoteCoefficientDto } from 'src/app/models/TypeNoteCoefficientDto';
import { ParcourService } from 'src/app/Services/ParcourService/parcour.service';
import { MatiereService } from 'src/app/Services/MatierService/matiere.service';
import { NoteService } from 'src/app/Services/NoteService/note.service';
import { EtudiantService } from 'src/app/Services/EtudiantService/etudiant.service';

@Component({
  selector: 'app-notes',
  templateUrl: './notes.component.html',
  styleUrls: ['./notes.component.css']
})
export class NotesComponent implements OnInit {
  matieres: (MatiereDto & { parcours: ParcourDtoWithEtudiants[] })[] = [];
  typeNote: TypeNote | '' = '';
  noteTypes: TypeNote[] = [];
  errorMessage: string = '';
  successMessage: string = '';
  notesMap: { [key: string]: (number | undefined)[] } = {};
  coefficientMap: { [key: string]: number | undefined } = {};
  coefficientSectionExpanded: boolean = true;
  isLoading: boolean = true;
  currentDate: Date = new Date();
  matiereExpanded: { [key: number]: boolean } = {};

  constructor(
    private matiereService: MatiereService,
    private parcourService: ParcourService,
    private noteService: NoteService,
    private etudiantService: EtudiantService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (!localStorage.getItem('token')) {
      this.errorMessage = 'Session expirée. Veuillez vous reconnecter.';
      setTimeout(() => this.router.navigate(['/login']), 2000);
      return;
    }
    this.loadNoteTypes();
    this.loadMatieres();
  }

  loadNoteTypes(): void {
    this.isLoading = true;
    this.noteService.getNoteTypes().pipe(
      tap(types => console.log('Loaded note types:', types)),
      catchError(err => {
        this.handleError(err, 'Erreur lors du chargement des types de notes');
        this.isLoading = false;
        return of([] as TypeNote[]);
      })
    ).subscribe(types => {
      this.noteTypes = types;
      this.isLoading = false;
      this.loadNotesAndCoefficients();
    });
  }

  loadMatieres(): void {
    this.isLoading = true;
    this.matiereService.getMatieresByEnseignant().pipe(
      switchMap(matieres => {
        if (!matieres || matieres.length === 0) {
          this.errorMessage = 'Aucune matière assignée à cet enseignant.';
          this.isLoading = false;
          return of([] as (MatiereDto & { parcours: ParcourDtoWithEtudiants[] })[]);
        }
        console.log('Matieres fetched:', matieres);
        this.matiereExpanded = matieres.reduce((acc, _, index) => ({ ...acc, [index]: true }), {});
        const matiereObservables = matieres.map(matiere =>
          this.parcourService.getParcoursByMatiereId(matiere.id!).pipe(
            switchMap(parcours => {
              console.log(`Parcours for matiere ${matiere.nom} (ID: ${matiere.id}):`, parcours);
              const etudiantObservables = parcours.map(parcour =>
                this.etudiantService.getEtudiantsByParcour(parcour.id!).pipe(
                  map(etudiants => ({
                    ...parcour,
                    etudiants: etudiants || []
                  } as ParcourDtoWithEtudiants)),
                  catchError(err => {
                    if (err.message === 'Session expired. Please log in again.') {
                      this.errorMessage = 'Session expirée. Veuillez vous reconnecter.';
                      setTimeout(() => this.router.navigate(['/login']), 2000);
                      return of({ ...parcour, etudiants: [] } as ParcourDtoWithEtudiants);
                    }
                    console.error(`Erreur lors du chargement des étudiants pour le parcours ${parcour.nom}:`, err);
                    return of({ ...parcour, etudiants: [] } as ParcourDtoWithEtudiants);
                  })
                )
              );
              return forkJoin(
                etudiantObservables.length > 0
                  ? etudiantObservables
                  : [of({ id: 0, nom: 'Unknown', annee: 'N/A', libelle: 'Unknown', etudiants: [] } as ParcourDtoWithEtudiants)]
              ).pipe(
                map(parcoursWithEtudiants => ({
                  ...matiere,
                  parcours: parcoursWithEtudiants
                } as MatiereDto & { parcours: ParcourDtoWithEtudiants[] }))
              );
            }),
            catchError(err => {
              if (err.message === 'Session expired. Please log in again.') {
                this.errorMessage = 'Session expirée. Veuillez vous reconnecter.';
                setTimeout(() => this.router.navigate(['/login']), 2000);
                return of({ ...matiere, parcours: [] } as MatiereDto & { parcours: ParcourDtoWithEtudiants[] });
              }
              console.error(`Erreur lors du chargement des parcours pour la matière ${matiere.nom}:`, err);
              this.errorMessage = `Erreur lors du chargement des parcours pour ${matiere.nom}`;
              return of({ ...matiere, parcours: [] } as MatiereDto & { parcours: ParcourDtoWithEtudiants[] });
            })
          )
        );
        return forkJoin(
          matiereObservables.length > 0
            ? matiereObservables
            : [of({ id: 0, nom: 'Aucune matière', parcours: [] } as MatiereDto & { parcours: ParcourDtoWithEtudiants[] })]
        );
      }),
      tap(matieresAvecParcours => {
        console.log('Final matieres with parcours and etudiants:', matieresAvecParcours);
        this.matieres = matieresAvecParcours;
        if (this.matieres.every(matiere => matiere.parcours.every((parcour: ParcourDtoWithEtudiants) => parcour.etudiants.length === 0))) {
          this.errorMessage = 'Aucun étudiant trouvé pour les matières et parcours associés.';
          console.log('No students found for any parcours');
        }
      }),
      catchError(err => {
        this.handleError(err, 'Erreur lors du chargement des matières');
        this.isLoading = false;
        return of([] as (MatiereDto & { parcours: ParcourDtoWithEtudiants[] })[]);
      })
    ).subscribe(() => {
      this.isLoading = false;
    });
  }

  toggleMatiere(index: number): void {
    this.matiereExpanded[index] = !this.matiereExpanded[index];
  }

  toggleCoefficientSection(): void {
    this.coefficientSectionExpanded = !this.coefficientSectionExpanded;
  }

  getNoteIndices(matiereId: number, etudiantId: number, noteType: TypeNote): number[] {
    const key = `${matiereId}_${etudiantId}_${noteType}`;
    if (!this.notesMap[key]) {
      this.notesMap[key] = [undefined];
    }
    return Array(this.notesMap[key].length).fill(0).map((_, i) => i);
  }

  addNote(matiereId: number, etudiantId: number, index: number = -1, value: number | null = null, noteType?: TypeNote): void {
    if (!noteType) {
      this.errorMessage = 'Type de note requis pour ajouter une note.';
      return;
    }
    const key = `${matiereId}_${etudiantId}_${noteType}`;
    if (!this.notesMap[key]) {
      this.notesMap[key] = [undefined];
    }
    if (index === -1 && this.notesMap[key].length < 3) {
      this.notesMap[key].push(undefined);
    } else if (index >= 0 && value !== null) {
      if (!isNaN(value) && value >= 0 && value <= 20) {
        this.notesMap[key][index] = value;
      } else {
        this.notesMap[key][index] = undefined;
        this.errorMessage = `La note pour ${key} doit être entre 0 et 20.`;
      }
    }
    console.log(`Updated notesMap[${key}]:`, this.notesMap[key]);
  }

  removeNote(matiereId: number, etudiantId: number, index: number, noteType: TypeNote): void {
    const key = `${matiereId}_${etudiantId}_${noteType}`;
    if (this.notesMap[key] && this.notesMap[key].length > 1) {
      this.notesMap[key].splice(index, 1);
    }
    console.log(`Removed note from notesMap[${key}]:`, this.notesMap[key]);
  }

  hasValidNotes(): boolean {
    for (const key in this.notesMap) {
      const notes = this.notesMap[key];
      if (notes.some(note => note !== undefined && note >= 0 && note <= 20)) {
        return true;
      }
    }
    return false;
  }

  isInvalidCoefficient(matiereId: number): boolean {
    if (this.typeNote) {
      const key = `${matiereId}_${this.typeNote}`;
      const coefficient = this.coefficientMap[key];
      return coefficient !== undefined && coefficient <= 0;
    }
    return false;
  }

  isInvalidNote(matiereId: number, etudiantId: number, noteType: TypeNote, index: number): boolean {
    const key = `${matiereId}_${etudiantId}_${noteType}`;
    const note = this.notesMap[key]?.[index];
    return note != null && (note < 0 || note > 20);
  }

  onTypeNoteChange(): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.coefficientMap = {};
    this.coefficientSectionExpanded = true;
    this.loadNotesAndCoefficients();
  }

  loadNotesAndCoefficients(): void {
    this.isLoading = true;
    forkJoin(
      this.noteTypes.map(noteType =>
        this.noteService.getNotesByType(noteType).pipe(
          catchError(err => {
            this.handleError(err, `Erreur lors du chargement des notes pour ${noteType}`);
            return of([]);
          })
        )
      )
    ).pipe(
      switchMap(notesByType => {
        const existingNotesMap = new Map<string, number[]>();
        notesByType.forEach((notes, index) => {
          const noteType = this.noteTypes[index];
          notes.forEach(note => {
            const key = `${note.matiereId}_${note.etudiantId}_${noteType}`;
            if (!existingNotesMap.has(key)) {
              existingNotesMap.set(key, []);
            }
            if (note.valeur !== undefined) {
              existingNotesMap.get(key)!.push(note.valeur);
            }
          });
        });

        const currentNotesMap = { ...this.notesMap };
        this.notesMap = {};
        this.matieres.forEach(matiere => {
          matiere.parcours.forEach((parcour: ParcourDtoWithEtudiants) => {
            parcour.etudiants.forEach((etudiant: EtudiantDto) => {
              this.noteTypes.forEach(noteType => {
                const key = `${matiere.id}_${etudiant.id}_${noteType}`;
                this.notesMap[key] = currentNotesMap[key] || existingNotesMap.get(key) || [undefined];
              });
            });
          });
        });

        if (this.typeNote) {
          return forkJoin(
            this.matieres.map(matiere =>
              this.noteService.getCoefficientsByMatiere(matiere.id!).pipe(
                catchError(err => {
                  console.error(`Erreur lors du chargement des coefficients pour la matière ${matiere.nom}`, err);
                  return of([]);
                })
              )
            )
          ).pipe(
            map(coefficientsByMatiere => ({ notesByType, coefficientsByMatiere }))
          );
        }
        return of({ notesByType, coefficientsByMatiere: [] });
      }),
      tap(({ notesByType, coefficientsByMatiere }) => {
        this.coefficientMap = {};
        coefficientsByMatiere.forEach((coefficients, index) => {
          const matiere = this.matieres[index];
          const coefficient = coefficients.find(c => c.typeNote === this.typeNote);
          const key = `${matiere.id}_${this.typeNote}`;
          this.coefficientMap[key] = coefficient ? coefficient.coefficient : undefined;
        });

        console.log('Updated notesMap:', this.notesMap);
        console.log('Updated coefficientMap:', this.coefficientMap);
      }),
      catchError(err => {
        this.handleError(err, 'Erreur lors du chargement des notes ou coefficients');
        return of({ notesByType: [], coefficientsByMatiere: [] });
      })
    ).subscribe(() => {
      this.isLoading = false;
    });
  }

  updateCoefficient(matiereId: number, value: number | undefined): void {
    if (!this.typeNote || !matiereId) {
      this.errorMessage = 'Veuillez sélectionner un type de note.';
      return;
    }
    const key = `${matiereId}_${this.typeNote}`;
    if (value !== undefined && value > 0) {
      this.isLoading = true;
      const coefficientDto: TypeNoteCoefficientDto = {
        typeNote: this.typeNote as TypeNote,
        coefficient: value,
        matiereId: matiereId
      };
      this.noteService.getCoefficientsByMatiere(matiereId).pipe(
        switchMap(coefficients => {
          const existing = coefficients.find(c => c.typeNote === this.typeNote);
          if (existing) {
            return this.noteService.updateCoefficient(existing.id!, coefficientDto);
          } else {
            return this.noteService.createCoefficient(coefficientDto);
          }
        }),
        tap(savedCoefficient => {
          this.coefficientMap[key] = savedCoefficient.coefficient;
          this.successMessage = `Coefficient pour ${this.matieres.find(m => m.id === matiereId)?.nom} enregistré avec succès !`;
          console.log(`Saved coefficient for ${key}:`, savedCoefficient);
        }),
        catchError(err => {
          this.handleError(err, 'Erreur lors de l\'enregistrement du coefficient');
          return of(null);
        })
      ).subscribe(() => {
        this.isLoading = false;
      });
    } else {
      this.coefficientMap[key] = undefined;
      this.errorMessage = 'Le coefficient doit être positif.';
    }
  }

  clearCoefficient(matiereId: number): void {
    if (!this.typeNote) {
      this.errorMessage = 'Veuillez sélectionner un type de note.';
      return;
    }
    const key = `${matiereId}_${this.typeNote}`;
    this.isLoading = true;
    this.noteService.getCoefficientsByMatiere(matiereId).pipe(
      switchMap(coefficients => {
        const existing = coefficients.find(c => c.typeNote === this.typeNote);
        if (existing) {
          return this.noteService.deleteCoefficient(existing.id!).pipe(
            tap(() => {
              this.coefficientMap[key] = undefined;
              this.successMessage = `Coefficient pour ${this.matieres.find(m => m.id === matiereId)?.nom} supprimé avec succès !`;
              console.log(`Deleted coefficient for ${key}`);
            })
          );
        }
        return of(null);
      }),
      catchError(err => {
        this.handleError(err, 'Erreur lors de la suppression du coefficient');
        return of(null);
      })
    ).subscribe(() => {
      this.isLoading = false;
    });
  }

  submitAllNotes(): Observable<void> {
    console.log('submitAllNotes called with:', {
      notesMap: this.notesMap
    });

    const noteObservables: Observable<NoteDto | null>[] = [];

    for (let matiere of this.matieres) {
      for (let parcour of matiere.parcours as ParcourDtoWithEtudiants[]) {
        for (let etudiant of parcour.etudiants) {
          this.noteTypes.forEach(noteType => {
            const key = `${matiere.id}_${etudiant.id}_${noteType}`;
            const notes = this.notesMap[key] || [];
            console.log(`Processing notes for ${key}:`, notes);

            notes.forEach((valeur, index) => {
              if (valeur !== undefined && valeur >= 0 && valeur <= 20) {
                console.log(`Valid note found for ${key}:`, valeur);
                const noteDto = {
                  etudiantId: etudiant.id!,
                  matiereId: matiere.id!,
                  typeNote: noteType,
                  valeur
                };

                noteObservables.push(
                  this.noteService.getNotesByType(noteType).pipe(
                    map(existingNotes => {
                      const existingNotesMap = new Map<string, NoteDto[]>();
                      existingNotes.forEach(note => {
                        const existingKey = `${note.matiereId}_${note.etudiantId}_${note.typeNote}`;
                        if (!existingNotesMap.has(existingKey)) {
                          existingNotesMap.set(existingKey, []);
                        }
                        existingNotesMap.get(existingKey)!.push(note);
                      });

                      const existingKey = `${matiere.id}_${etudiant.id}_${noteType}`;
                      const existingNotesForKey = existingNotesMap.get(existingKey) || [];
                      const existingNote = existingNotesForKey[index];

                      if (existingNote) {
                        return this.noteService.updateNote(existingNote.id!, noteDto).pipe(
                          tap(updatedNote => console.log(`Note updated for ${key}:`, updatedNote)),
                          catchError(err => {
                            console.error(`Error updating note for ${key}:`, err);
                            this.handleError(err, `Erreur pour ${etudiant.nom} ${etudiant.prenom}, note ${index + 1}`);
                            return of(null);
                          })
                        );
                      } else {
                        return this.noteService.createNote(noteDto).pipe(
                          tap(savedNote => console.log(`Note saved for ${key}:`, savedNote)),
                          catchError(err => {
                            console.error(`Error saving note for ${key}:`, err);
                            this.handleError(err, `Erreur pour ${etudiant.nom} ${etudiant.prenom}, note ${index + 1}`);
                            return of(null);
                          })
                        );
                      }
                    }),
                    switchMap(observable => observable)
                  )
                );
              } else {
                console.log(`Invalid or missing note for ${key}:`, valeur);
              }
            });
          });
        }
      }
    }

    if (noteObservables.length === 0) {
      this.errorMessage = 'Aucune note valide à enregistrer.';
      console.log('No valid notes to save');
      return of(undefined);
    }

    return forkJoin(noteObservables).pipe(map(() => undefined));
  }

  submitAllNotesForAllTypes(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const saveObservables = this.noteTypes.map(noteType => {
      this.typeNote = noteType;
      return this.submitAllNotes();
    });

    forkJoin(saveObservables).pipe(
      finalize(() => {
        this.isLoading = false;
        if (!this.errorMessage) {
          this.successMessage = 'Toutes les notes pour tous les types ont été enregistrées avec succès !';
        }
        this.loadNotesAndCoefficients();
      })
    ).subscribe({
      error: err => {
        this.handleError(err, 'Erreur lors de l\'enregistrement des notes pour tous les types');
      }
    });
  }

  handleError(err: any, message: string): void {
    if (err.status === 403 || err.message === 'Session expired. Please log in again.') {
      this.errorMessage = 'Accès refusé. Veuillez vous reconnecter.';
      console.error('Authentication error:', err);
      localStorage.removeItem('token');
      setTimeout(() => this.router.navigate(['/login']), 2000);
    } else {
      this.errorMessage = message;
      console.error(message, err);
    }
  }
}