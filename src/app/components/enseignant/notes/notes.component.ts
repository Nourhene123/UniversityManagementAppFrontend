import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin, of, switchMap, catchError, map, Observable, tap } from 'rxjs';

import { NoteDto, TypeNote } from 'src/app/models/NoteDto';
import { ParcourDto } from 'src/app/models/ParcourDto';
import { MatiereDto } from 'src/app/models/MatiereDto';
import { EtudiantDto } from 'src/app/models/EtudiantDto';
import { ParcourWithStudents } from 'src/app/models/ParcourWithStudents';
import { TypeNoteCoefficientDto } from 'src/app/models/TypeNoteCoefficientDto';

import { ParcourService } from 'src/app/Services/ParcourService/parcour.service';
import { MatiereService } from 'src/app/Services/MatierService/matiere.service';
import { NoteService } from 'src/app/Services/NoteService/note.service';

@Component({
  selector: 'app-notes',
  templateUrl: './notes.component.html',
  styleUrls: ['./notes.component.css']
})
export class NotesComponent implements OnInit {
  matieres: (MatiereDto & { parcours: (ParcourDto & { etudiants: EtudiantDto[] })[] })[] = [];
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
    private router: Router
  ) {}

  ngOnInit(): void {
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
    });
  }

  loadMatieres(): void {
    this.isLoading = true;
    this.matiereService.getMatieresByEnseignant().pipe(
      switchMap(matieres => {
        if (!matieres || matieres.length === 0) {
          this.errorMessage = 'Aucune matière assignée à cet enseignant.';
          this.isLoading = false;
          return of([]);
        }
        console.log('Matieres fetched:', matieres);
        this.matiereExpanded = matieres.reduce((acc, _, index) => ({ ...acc, [index]: true }), {});
        return this.parcourService.getStudentsGroupedByParcour().pipe(
          switchMap(parcoursWithStudents => {
            console.log('Parcours with students fetched:', parcoursWithStudents);
            const parcourObservables = matieres.map(matiere =>
              this.parcourService.getParcoursByMatiereId(matiere.id!).pipe(
                map(parcours => {
                  console.log(`Parcours for matiere ${matiere.nom} (ID: ${matiere.id}):`, parcours);
                  const parcoursWithEtudiants = parcours.map(parcour => {
                    const pws = parcoursWithStudents.find(p => p.parcourNom.toLowerCase() === parcour.nom.toLowerCase());
                    return {
                      ...parcour,
                      etudiants: pws ? pws.etudiants || [] : []
                    } as ParcourDto & { etudiants: EtudiantDto[] };
                  });
                  console.log(`Parcours with etudiants for matiere ${matiere.nom}:`, parcoursWithEtudiants);
                  return {
                    ...matiere,
                    parcours: parcoursWithEtudiants
                  } as MatiereDto & { parcours: (ParcourDto & { etudiants: EtudiantDto[] })[] };
                }),
                catchError(err => {
                  console.error(`Erreur lors du chargement des parcours pour la matière ${matiere.nom}`, err);
                  this.errorMessage = `Erreur lors du chargement des parcours pour ${matiere.nom}`;
                  return of({ ...matiere, parcours: [] } as MatiereDto & { parcours: (ParcourDto & { etudiants: EtudiantDto[] })[] });
                })
              )
            );
            return forkJoin(parcourObservables);
          }),
          catchError(err => {
            console.error('Erreur lors du chargement des parcours avec étudiants', err);
            this.errorMessage = 'Erreur lors du chargement des parcours avec étudiants';
            this.isLoading = false;
            return of([]);
          })
        );
      }),
      tap(matieresAvecParcours => console.log('Final matieres with parcours and etudiants:', matieresAvecParcours)),
      catchError(err => {
        this.handleError(err, 'Erreur lors du chargement des matières');
        this.isLoading = false;
        return of([]);
      })
    ).subscribe(matieresAvecParcours => {
      this.matieres = matieresAvecParcours;
      this.isLoading = false;
      if (this.matieres.every(matiere => (matiere.parcours as unknown as (ParcourDto & { etudiants: EtudiantDto[] })[]).every(parcour => parcour.etudiants.length === 0))) {
        this.errorMessage = 'Aucun étudiant trouvé pour les matières et parcours associés.';
        console.log('No students found for any parcours');
      }
    });
  }

  toggleMatiere(index: number): void {
    this.matiereExpanded[index] = !this.matiereExpanded[index];
  }

  toggleCoefficientSection(): void {
    this.coefficientSectionExpanded = !this.coefficientSectionExpanded;
  }

  getNoteIndices(matiereId: number, etudiantId: number): number[] {
    const key = `${matiereId}_${etudiantId}`;
    if (!this.notesMap[key]) {
      this.notesMap[key] = [undefined];
    }
    return Array(this.notesMap[key].length).fill(0).map((_, i) => i);
  }

  addNote(matiereId: number, etudiantId: number, index: number = -1, value: number | null = null): void {
    const key = `${matiereId}_${etudiantId}`;
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

  removeNote(matiereId: number, etudiantId: number, index: number): void {
    const key = `${matiereId}_${etudiantId}`;
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

  onTypeNoteChange(): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.coefficientMap = {};
    this.coefficientSectionExpanded = true;
    this.loadNotesAndCoefficients();
  }

  loadNotesAndCoefficients(): void {
    if (this.typeNote) {
      this.isLoading = true;
      forkJoin([
        this.noteService.getNotesByType(this.typeNote).pipe(
          catchError(err => {
            this.handleError(err, 'Erreur lors du chargement des notes existantes');
            return of([]);
          })
        ),
        forkJoin(
          this.matieres.map(matiere =>
            this.noteService.getCoefficientsByMatiere(matiere.id!).pipe(
              catchError(err => {
                console.error(`Erreur lors du chargement des coefficients pour la matière ${matiere.nom}`, err);
                return of([]);
              })
            )
          )
        ).pipe(
          catchError(err => {
            this.handleError(err, 'Erreur lors du chargement des coefficients');
            return of([]);
          })
        )
      ]).subscribe(([notes, coefficientsByMatiere]) => {
        // Process notes
        const existingNotesMap = new Map<string, number[]>();
        notes.forEach(note => {
          const key = `${note.matiereId}_${note.etudiantId}`;
          if (!existingNotesMap.has(key)) {
            existingNotesMap.set(key, []);
          }
          if (note.valeur !== undefined) {
            existingNotesMap.get(key)!.push(note.valeur);
          }
        });

        const currentNotesMap = { ...this.notesMap };
        this.notesMap = {};
        this.matieres.forEach(matiere => {
          (matiere.parcours as unknown as (ParcourDto & { etudiants: EtudiantDto[] })[]).forEach(parcour => {
            parcour.etudiants.forEach((etudiant: EtudiantDto) => {
              const key = `${matiere.id}_${etudiant.id}`;
              this.notesMap[key] = currentNotesMap[key] || existingNotesMap.get(key) || [undefined];
            });
          });
        });

        // Process coefficients
        this.coefficientMap = {};
        coefficientsByMatiere.forEach((coefficients, index) => {
          const matiere = this.matieres[index];
          const coefficient = coefficients.find(c => c.typeNote === this.typeNote);
          const key = `${matiere.id}_${this.typeNote}`;
          this.coefficientMap[key] = coefficient ? coefficient.coefficient : undefined;
        });

        this.isLoading = false;
        console.log('Updated notesMap:', this.notesMap);
        console.log('Updated coefficientMap:', this.coefficientMap);
      });
    } else {
      this.notesMap = {};
      this.coefficientMap = {};
      this.isLoading = false;
    }
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

  submitAllNotes(): void {
    console.log('submitAllNotes called with:', {
      typeNote: this.typeNote,
      notesMap: this.notesMap
    });

    if (!this.typeNote) {
      this.errorMessage = 'Veuillez sélectionner un type de note.';
      console.log('Validation failed: Missing typeNote');
      return;
    }

    this.noteService.getNotesByType(this.typeNote).pipe(
      switchMap((existingNotes: NoteDto[]) => {
        const noteObservables: Observable<NoteDto | null>[] = [];
        const existingNotesMap = new Map<string, NoteDto[]>();
        existingNotes.forEach(note => {
          const key = `${note.matiereId}_${note.etudiantId}_${note.typeNote}`;
          if (!existingNotesMap.has(key)) {
            existingNotesMap.set(key, []);
          }
          existingNotesMap.get(key)!.push(note);
        });

        for (let matiere of this.matieres) {
          for (let parcour of (matiere.parcours as unknown as (ParcourDto & { etudiants: EtudiantDto[] })[])) {
            for (let etudiant of parcour.etudiants) {
              const key = `${matiere.id}_${etudiant.id}`;
              const notes = this.notesMap[key] || [];
              console.log(`Processing notes for ${key}:`, notes);
              notes.forEach((valeur, index) => {
                if (valeur !== undefined && valeur >= 0 && valeur <= 20) {
                  console.log(`Valid note found for ${key}:`, valeur);
                  const noteKey = `${matiere.id}_${etudiant.id}_${this.typeNote}`;
                  const existingNotes = existingNotesMap.get(noteKey) || [];
                  const existingNote = existingNotes[index];
                  const noteDto = {
                    etudiantId: etudiant.id!,
                    matiereId: matiere.id!,
                    typeNote: this.typeNote as TypeNote,
                    valeur
                  };

                  if (existingNote) {
                    noteObservables.push(
                      this.noteService.updateNote(existingNote.id!, noteDto).pipe(
                        tap(updatedNote => console.log(`Note updated for ${key}:`, updatedNote)),
                        catchError(err => {
                          console.error(`Error updating note for ${key}:`, err);
                          this.handleError(err, `Erreur pour ${etudiant.nom} ${etudiant.prenom}, note ${index + 1}`);
                          return of(null);
                        })
                      )
                    );
                  } else {
                    noteObservables.push(
                      this.noteService.createNote(noteDto).pipe(
                        tap(savedNote => console.log(`Note saved for ${key}:`, savedNote)),
                        catchError(err => {
                          console.error(`Error saving note for ${key}:`, err);
                          this.handleError(err, `Erreur pour ${etudiant.nom} ${etudiant.prenom}, note ${index + 1}`);
                          return of(null);
                        })
                      )
                    );
                  }
                } else {
                  console.log(`Invalid or missing note for ${key}:`, valeur);
                }
              });
            }
          }
        }

        if (noteObservables.length === 0) {
          this.errorMessage = 'Aucune note valide à enregistrer.';
          console.log('No valid notes to save');
          return of([]);
        }

        this.isLoading = true;
        return forkJoin(noteObservables);
      }),
      tap(results => console.log('All notes save results:', results)),
      catchError(err => {
        console.error('Error in forkJoin:', err);
        this.isLoading = false;
        this.errorMessage = 'Une erreur est survenue lors de l\'enregistrement des notes.';
        return of([]);
      })
    ).subscribe(() => {
      this.errorMessage = '';
      this.isLoading = false;
      this.successMessage = 'Notes enregistrées avec succès !';
      this.loadNotesAndCoefficients();
    });
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