import { Component, EventEmitter, Input, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { forkJoin, of, switchMap, catchError, Observable, Subject, finalize } from 'rxjs';
import { map, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ClasseDto } from 'src/app/models/ClasseDto';
import { EtudiantDto } from 'src/app/models/EtudiantDto';
import { ParcourDto } from 'src/app/models/ParcourDto';
import { PanierDto } from 'src/app/models/PanierDto';
import { MatiereDto } from 'src/app/models/MatiereDto';
import { EnseignantDto } from 'src/app/models/EnseignantDto';
import { ClasseService } from 'src/app/Services/Classe/classe.service';
import { EtudiantService } from 'src/app/Services/EtudiantService/etudiant.service';
import { ParcourService } from 'src/app/Services/ParcourService/parcour.service';
import { MatiereService } from 'src/app/Services/MatierService/matiere.service';
import { EnseignantService } from 'src/app/Services/EnseignantService/enseignant.service';
import { PanierService } from 'src/app/Services/PanierService/panier.service';
import { Router } from '@angular/router';
import * as jsPDFModule from 'jspdf';
const jsPDF = jsPDFModule.jsPDF;
import html2canvas from 'html2canvas';

import { PageEvent } from '@angular/material/paginator';
import { ChatService } from 'src/app/Services/ChatService';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-classe',
  templateUrl: './classe.component.html',
  styleUrls: ['./classe.component.css']
})
export class ClasseComponent implements OnInit {
  classeForm: FormGroup;
  assignStudentsForm: FormGroup;
  classes: ClasseDto[] = [];
  filteredClasses: ClasseDto[] = [];
  parcours: ParcourDto[] = [];
  etudiants: EtudiantDto[] = [];
  filteredEtudiants: EtudiantDto[] = [];
  enseignants: EnseignantDto[] = [];
  paniers: PanierDto[] = [];
  matieres: MatiereDto[] = [];
  paniersByClasse: { [key: number]: PanierDto[] } = {};
  matieresByClasse: { [key: number]: MatiereDto[] } = {};
  etudiantsByClasse: { [key: number]: EtudiantDto[] } = {};
  loading = false;
  errorMessage: string = '';
  successMessage: string = '';
  showForm = false;
  showAssignModal = false;
  selectedClasse: ClasseDto | null = null;
  editingClassId: number | null = null;
  expandedClassId: number | null = null;
  today: Date = new Date();
  searchTerm: string = '';
  isAdmin: boolean = false;
  pagedClasses: any[] = [];   

  // Pagination state
  pageSize = 6;
  pageIndex = 0;
  pageSizeOptions = [3, 6, 9, 12];
  private searchSubject = new Subject<string>();

  @Input() showAddFormOnly: boolean = false;
  @Input() parcoursInput: ParcourDto[] = [];
  @Input() etudiantsInput: EtudiantDto[] = [];
  @Output() classeAdded = new EventEmitter<ClasseDto>();

  constructor(
    private fb: FormBuilder,
    private classeService: ClasseService,
    private parcourService: ParcourService,
    private etudiantService: EtudiantService,
    private matiereService: MatiereService,
    private enseignantService: EnseignantService,
    private panierService: PanierService,
    private router: Router,
    private snackBar: MatSnackBar,
    private chatService: ChatService
  ) {
    this.classeForm = this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(3)]],
      section: ['', [Validators.required, Validators.minLength(2)]],
      parcourId: ['', [Validators.required, Validators.min(1)]],
      etudiantIds: [[]]
    });
    this.assignStudentsForm = this.fb.group({
      etudiantIds: [[], Validators.required]
    });
  }

  ngOnInit(): void {
    if (!this.showAddFormOnly) {
      this.loadInitialData();
      this.setupSearch();
    } else {
      this.showForm = true;
      this.parcours = this.parcoursInput.length > 0 ? this.parcoursInput : [];
      this.etudiants = this.etudiantsInput.length > 0 ? this.etudiantsInput : [];
      this.updateFilteredEtudiants(this.classeForm.get('parcourId')?.value);
      if (this.parcours.length === 0 || this.etudiants.length === 0) {
        this.loadInitialData();
      }
    }

    this.classeForm.get('parcourId')?.valueChanges.subscribe(parcourId => {
      console.log('parcourId changed:', parcourId);
      this.updateFilteredEtudiants(parcourId);
      this.classeForm.get('etudiantIds')?.setValue([]);
    });
    this.updatePagedClasses();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['parcoursInput'] && changes['parcoursInput'].currentValue) {
      this.parcours = this.parcoursInput;
    }
    if (changes['etudiantsInput'] && changes['etudiantsInput'].currentValue) {
      this.etudiants = this.etudiantsInput;
      this.updateFilteredEtudiants(this.classeForm.get('parcourId')?.value);
    }
  }

  loadInitialData(): void {
    this.loading = true;
    forkJoin({
      parcours: this.parcourService.getAllParcours().pipe(
        catchError(err => {
          console.error('Error loading parcours:', err);
          this.errorMessage = 'Failed to load parcours';
          this.snackBar.open(this.errorMessage, 'Close', { duration: 3000 });
          return of([]);
        })
      ),
      etudiants: this.etudiantService.getAllEtudiants().pipe(
        catchError(err => {
          console.error('Error loading etudiants:', err);
          this.errorMessage = 'Failed to load students';
          this.snackBar.open(this.errorMessage, 'Close', { duration: 3000 });
          return of([]);
        })
      ),
      enseignants: this.enseignantService.getAllEnseignants().pipe(
        catchError(err => {
          console.error('Error loading enseignants:', err);
          this.errorMessage = 'Failed to load teachers';
          this.snackBar.open(this.errorMessage, 'Close', { duration: 3000 });
          return of([]);
        })
      ),
      paniers: this.panierService.getAllPaniers().pipe(
        catchError(err => {
          console.error('Error loading paniers:', err);
          this.errorMessage = 'Failed to load paniers';
          this.snackBar.open(this.errorMessage, 'Close', { duration: 3000 });
          return of([]);
        })
      ),
      matieres: this.matiereService.getAllMatieres().pipe(
        catchError(err => {
          console.error('Error loading matieres:', err);
          this.errorMessage = 'Failed to load matieres';
          this.snackBar.open(this.errorMessage, 'Close', { duration: 3000 });
          return of([]);
        })
      )
    }).pipe(
      switchMap(({ parcours, etudiants, enseignants, paniers, matieres }) => {
        this.parcours = parcours || [];
        this.etudiants = etudiants || [];
        this.enseignants = enseignants || [];
        this.paniers = paniers || [];
        this.matieres = matieres || [];
        console.log('Loaded parcours:', this.parcours);
        console.log('Loaded etudiants:', this.etudiants);
        console.log('Loaded enseignants:', this.enseignants);
        console.log('Loaded paniers:', this.paniers);
        console.log('Loaded matieres:', this.matieres);
        return this.loadClasses();
      }),
      finalize(() => this.loading = false)
    ).subscribe();
  }

  loadClasses(): Observable<void> {
    this.loading = true;
    this.etudiantsByClasse = {};
    this.paniersByClasse = {};
    this.matieresByClasse = {};

    return this.classeService.getAllClasses().pipe(
      switchMap(classes => {
        this.classes = classes.filter(classe => {
          if (!this.parcours.some(p => p.id === classe.parcourId)) {
            console.warn(`Invalid parcourId ${classe.parcourId} for class ${classe.nom} (ID: ${classe.id})`);
            return false;
          }
          return true;
        });
        this.filteredClasses = this.classes;
        console.log('Loaded classes:', this.classes);

        const classObservables = this.classes
          .filter(classe => classe.id !== undefined)
          .map(classe => {
            const parcour = this.parcours.find(p => p.id === classe.parcourId);
            const panierIds = parcour?.panierIds || [];
            if (!panierIds.length) {
              console.warn(`No panierIds for parcour ${parcour?.nom} (ID: ${classe.parcourId})`);
            }
            const paniers = this.paniers.filter(p => p.id !== undefined && panierIds.includes(p.id));
            const matiereIds = paniers
              .filter(p => p.matiereIds !== undefined)
              .flatMap(p => p.matiereIds!);
            if (!matiereIds.length) {
              console.warn(`No matiereIds for paniers of class ${classe.nom} (ID: ${classe.id})`);
            }
            const matieres = this.matieres.filter((m: MatiereDto) => m.id !== undefined && matiereIds.includes(m.id));

            return forkJoin({
              etudiants: this.classeService.getEtudiantsByClasseId(classe.id!).pipe(
                catchError(err => {
                  console.error(`Error loading students for class ${classe.nom} (ID: ${classe.id}):`, err);
                  return of([]);
                })
              ),
              paniers: of(paniers),
              matieres: of(matieres)
            }).pipe(
              map(({ etudiants, paniers, matieres }) => {
                if (classe.id !== undefined) {
                  this.etudiantsByClasse[classe.id] = etudiants || [];
                  this.paniersByClasse[classe.id] = paniers || [];
                  this.matieresByClasse[classe.id] = matieres || [];
                  console.log(`Class ${classe.nom} (ID: ${classe.id}) - Stored:`, {
                    etudiants: etudiants.length,
                    paniers: paniers.map((p: PanierDto) => ({ id: p.id, nom: p.nom })),
                    matieres: matieres.map((m: MatiereDto) => ({ id: m.id, nom: m.nom, enseignantId: m.enseignantId }))
                  });
                }
                return classe;
              })
            );
          });

        return forkJoin(classObservables.length > 0 ? classObservables : [of(null)]).pipe(
          map(() => undefined)
        );
      }),
      catchError(err => {
        console.error('Error loading classes:', err);
        this.errorMessage = err.message || 'Failed to load classes';
        this.snackBar.open(this.errorMessage, 'Close', { duration: 3000 });
        return of(undefined);
      }),
      finalize(() => this.loading = false)
    );
  }

  updateFilteredEtudiants(parcourId: number | null): void {
    if (!parcourId) {
      this.filteredEtudiants = this.etudiants;
      console.log('No parcourId provided, showing all students:', this.filteredEtudiants);
      return;
    }
    this.parcourService.getEtudiantsByParcourId(parcourId).subscribe({
      next: (data) => {
        this.filteredEtudiants = data || [];
        console.log('Fetched students for parcourId', parcourId, ':', this.filteredEtudiants);
        const currentEtudiantIds = this.classeForm.get('etudiantIds')?.value || [];
        const validEtudiantIds = currentEtudiantIds.filter((id: number) =>
          this.filteredEtudiants.some(e => e.id === id)
        );
        if (validEtudiantIds.length !== currentEtudiantIds.length) {
          console.warn('Invalid student IDs removed:', currentEtudiantIds, 'Valid:', validEtudiantIds);
          this.classeForm.get('etudiantIds')?.setValue(validEtudiantIds);
        }
      },
      error: (err) => {
        console.error('Error fetching students for parcour:', err);
        this.filteredEtudiants = this.etudiants.filter(
          etudiant => etudiant.parcourId === parcourId
        );
        console.log('Fallback filtered etudiants for parcourId', parcourId, ':', this.filteredEtudiants);
        const currentEtudiantIds = this.classeForm.get('etudiantIds')?.value || [];
        const validEtudiantIds = currentEtudiantIds.filter((id: number) =>
          this.filteredEtudiants.some(e => e.id === id)
        );
        this.classeForm.get('etudiantIds')?.setValue(validEtudiantIds);
        this.errorMessage = 'Failed to fetch students for parcour, showing available students';
        this.snackBar.open(this.errorMessage, 'Close', { duration: 3000 });
      }
    });
  }

  createClasse(): void {
    if (this.classeForm.valid) {
      this.loading = true;
      const classeData: ClasseDto = {
        ...this.classeForm.value,
        etudiantIds: this.classeForm.get('etudiantIds')?.value.filter((id: number) =>
          this.filteredEtudiants.some(e => e.id === id)
        )
      };
      console.log('Creating classe:', classeData);
      this.classeService.createClasse(classeData).pipe(
        switchMap((response: ClasseDto) => {
          if (!response.id) {
            console.error('Backend returned ClasseDto without id:', response);
            throw new Error('Invalid class ID from backend');
          }
          console.log('Backend response ClasseDto:', response);
          return this.classeService.getEtudiantsByClasseId(response.id).pipe(
            map((etudiants: EtudiantDto[]) => {
              if (response.id !== undefined) {
                this.etudiantsByClasse[response.id] = etudiants || [];
              }
              return response;
            }),
            catchError(err => {
              console.error('Error fetching students for class:', err);
              this.etudiantsByClasse[response.id!] = [];
              return of(response);
            })
          );
        })
      ).subscribe({
        next: (response: ClasseDto) => {
          this.successMessage = 'Classe created successfully!';
          this.loading = false;
          this.classeForm.reset();
          this.filteredEtudiants = [];
          this.classeForm.get('etudiantIds')?.setValue([]);
          if (!this.showAddFormOnly) {
            this.loadClasses().subscribe();
            this.expandedClassId = response.id || null;
          }
          this.classeAdded.emit(response);
          this.chatService.sendClasse(response);
          this.snackBar.open(this.successMessage, 'Close', { duration: 3000 });
          setTimeout(() => {
            this.successMessage = '';
            if (this.showAddFormOnly) {
              this.showForm = false;
            }
          }, 2000);
        },
        error: (err) => {
          console.error('Error creating class:', err);
          this.errorMessage = err.error?.message || 'Failed to create class';
          this.snackBar.open(this.errorMessage, 'Close', { duration: 3000 });
          this.loading = false;
        }
      });
    } else {
      this.errorMessage = 'Please fill all required fields correctly';
      this.snackBar.open(this.errorMessage, 'Close', { duration: 3000 });
      console.warn('Invalid form submission:', this.classeForm.errors);
    }
  }

  onSubmit(): void {
    if (this.editingClassId) {
      this.updateClasse();
    } else {
      this.createClasse();
    }
  }

  updateClasse(): void {
    if (this.classeForm.valid && this.editingClassId) {
      this.loading = true;
      const classeData: ClasseDto = {
        ...this.classeForm.value,
        id: this.editingClassId,
        etudiantIds: this.classeForm.get('etudiantIds')?.value.filter((id: number) =>
          this.filteredEtudiants.some(e => e.id === id)
        )
      };
      console.log('Updating classe:', classeData);
      this.classeService.updateClasse(this.editingClassId, classeData).pipe(
        switchMap((response: ClasseDto) => {
          if (!response.id) {
            console.error('Backend returned ClasseDto without id:', response);
            throw new Error('Invalid class ID from backend');
          }
          console.log('Backend response ClasseDto:', response);
          return this.classeService.getEtudiantsByClasseId(response.id).pipe(
            map((etudiants: EtudiantDto[]) => {
              if (response.id !== undefined) {
                this.etudiantsByClasse[response.id] = etudiants || [];
              }
              return response;
            }),
            catchError(err => {
              console.error('Error fetching students for class:', err);
              this.etudiantsByClasse[response.id!] = [];
              return of(response);
            })
          );
        })
      ).subscribe({
        next: (response: ClasseDto) => {
          this.successMessage = 'Classe updated successfully!';
          this.loading = false;
          this.classeForm.reset();
          this.editingClassId = null;
          this.filteredEtudiants = [];
          this.classeForm.get('etudiantIds')?.setValue([]);
          if (!this.showAddFormOnly) {
            this.loadClasses().subscribe();
            this.expandedClassId = response.id || null;
          }
          this.classeAdded.emit(response);
          this.chatService.sendClasse(response);
          this.snackBar.open(this.successMessage, 'Close', { duration: 3000 });
          setTimeout(() => {
            this.successMessage = '';
            if (this.showAddFormOnly) {
              this.showForm = false;
            }
          }, 2000);
        },
        error: (err) => {
          console.error('Error updating class:', err);
          this.errorMessage = err.error?.message || 'Failed to update class';
          this.snackBar.open(this.errorMessage, 'Close', { duration: 3000 });
          this.loading = false;
        }
      });
    } else {
      this.errorMessage = 'Please fill all required fields correctly';
      this.snackBar.open(this.errorMessage, 'Close', { duration: 3000 });
      console.warn('Invalid form submission:', this.classeForm.errors);
    }
  }

  setupSearch(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      map(term => term.trim().toLowerCase())
    ).subscribe(term => {
      this.searchTerm = term;
      this.filteredClasses = this.classes.filter(classe =>
        classe.nom.toLowerCase().includes(term) ||
        classe.section.toLowerCase().includes(term)
      );
    });
  }

  onSearchChange(term: string): void {
    this.searchSubject.next(term);
       this.pageIndex = 0; 
    this.updatePagedClasses();
  }
   updatePagedClasses() {
    const start = this.pageIndex * this.pageSize;
    const end = start + this.pageSize;
    this.pagedClasses = this.filteredClasses.slice(start, end);
  }

  getParcourNom(parcourId: number): string {
    if (!parcourId) {
      console.warn('Invalid parcourId provided:', parcourId);
      return 'N/A';
    }
    const parcour = this.parcours.find(p => p.id === parcourId);
    if (!parcour) {
      console.warn(`Parcour not found for ID: ${parcourId}`);
      return 'N/A';
    }
    return parcour.nom;
  }

  getPanierNames(classeId: number): string {
    const paniers = this.paniersByClasse[classeId] || [];
    if (!paniers.length) {
      console.warn(`No paniers found for class ID: ${classeId}`);
      return 'Aucun';
    }
    return paniers.map(p => p.nom).join(', ') || 'Aucun';
  }

  getEnseignantNames(classeId: number): string {
    const matieres = this.matieresByClasse[classeId] || [];
    if (!matieres.length) {
      console.warn(`No matières found for class ID: ${classeId}`);
      return 'Aucun';
    }
    const enseignantIds = new Set<number>();
    matieres.forEach(matiere => {
      if (matiere.enseignantId) {
        enseignantIds.add(matiere.enseignantId);
      }
    });
    if (enseignantIds.size === 0) {
      console.warn(`No enseignants assigned to matières for class ID: ${classeId}`);
      return 'Aucun';
    }
    return Array.from(enseignantIds)
      .map(id => {
        const enseignant = this.enseignants.find(e => e.id === id);
        if (!enseignant) {
          console.warn(`Enseignant not found for ID: ${id}`);
          return null;
        }
        return `${enseignant.nom} ${enseignant.prenom}`;
      })
      .filter((name): name is string => !!name)
      .join(', ') || 'Aucun';
  }

  getEtudiantNamesForClasse(classe: ClasseDto): string {
    if (!classe.id || !this.etudiantsByClasse[classe.id]) {
      console.warn(`No students found for class ID: ${classe.id}`);
      return 'Aucun';
    }
    const etudiantIds = this.etudiantsByClasse[classe.id]
      .map(e => e.id)
      .filter((id): id is number => id !== undefined);
    if (etudiantIds.length === 0) {
      console.warn(`No valid student IDs for class ID: ${classe.id}`);
      return 'Aucun';
    }
    return this.getEtudiantNames(etudiantIds);
  }

  getEtudiantNames(etudiantIds: number[]): string {
    return etudiantIds
      .map(id => {
        const etudiant = this.etudiants.find(e => e.id === id);
        if (!etudiant) {
          console.warn(`Student not found for ID: ${id}`);
          return null;
        }
        return `${etudiant.nom} ${etudiant.prenom}`;
      })
      .filter((name): name is string => !!name)
      .join(', ') || 'Aucun';
  }

  toggleForm(): void {
    this.showForm = !this.showForm;
    if (!this.showForm) {
      this.classeForm.reset();
      this.editingClassId = null;
      this.errorMessage = '';
      this.successMessage = '';
      this.filteredEtudiants = [];
      this.classeForm.get('etudiantIds')?.setValue([]);
    }
  }

  openAssignStudentsModal(classeId: number, parcourId: number): void {
    this.selectedClasse = this.classes.find(c => c.id === classeId) || null;
    this.showAssignModal = true;
    this.assignStudentsForm.reset();
    this.parcourService.getEtudiantsByParcourId(parcourId).subscribe({
      next: (data) => {
        this.filteredEtudiants = data || [];
        console.log('Loaded students for assign modal:', this.filteredEtudiants);
      },
      error: (err) => {
        console.error('Error loading students for parcour:', err);
        this.errorMessage = err.message || 'Failed to load students for parcour';
        this.snackBar.open(this.errorMessage, 'Close', { duration: 3000 });
      }
    });
  }

  closeAssignModal(): void {
    this.showAssignModal = false;
    this.selectedClasse = null;
    this.assignStudentsForm.reset();
    this.filteredEtudiants = [];
  }

  onAssignStudentsSubmit(): void {
    if (this.assignStudentsForm.valid && this.selectedClasse?.id) {
      this.loading = true;
      const etudiantIds: number[] = this.assignStudentsForm.get('etudiantIds')?.value.filter((id: number) =>
        this.filteredEtudiants.some(e => e.id === id)
      );
      this.classeService.assignStudentsToClasse(this.selectedClasse.id, etudiantIds).subscribe({
        next: () => {
          this.successMessage = 'Students assigned successfully!';
          this.loading = false;
          this.closeAssignModal();
          this.loadClasses().subscribe();
          this.snackBar.open(this.successMessage, 'Close', { duration: 3000 });
          setTimeout(() => this.successMessage = '', 2000);
        },
        error: (err) => {
          console.error('Error assigning students:', err);
          this.errorMessage = err.error?.message || 'Failed to assign students';
          this.snackBar.open(this.errorMessage, 'Close', { duration: 3000 });
          this.loading = false;
        }
      });
    }
  }

  editClasse(classe: ClasseDto): void {
    this.editingClassId = classe.id || null;
    this.classeForm.patchValue({
      nom: classe.nom,
      section: classe.section,
      parcourId: classe.parcourId,
      etudiantIds: classe.etudiantIds || []
    });
    if (classe.parcourId) {
      this.parcourService.getEtudiantsByParcourId(classe.parcourId).subscribe({
        next: (data) => {
          this.filteredEtudiants = data || [];
          console.log('Loaded students for editing class:', this.filteredEtudiants);
        },
        error: (err) => {
          console.error('Error loading students for parcour:', err);
          this.errorMessage = err.message || 'Failed to load students for parcour';
          this.snackBar.open(this.errorMessage, 'Close', { duration: 3000 });
        }
      });
    }
    this.showForm = true;
  }

  toggleExpand(id: number): void {
    this.expandedClassId = this.expandedClassId === id ? null : id;
    if (this.expandedClassId && !this.etudiantsByClasse[id]) {
      this.classeService.getEtudiantsByClasseId(id).subscribe({
        next: (etudiants) => {
          this.etudiantsByClasse[id] = etudiants || [];
          console.log(`Loaded students for class ID ${id} on expand:`, this.etudiantsByClasse[id]);
        },
        error: (err) => {
          console.error('Error loading students for class:', err);
          this.errorMessage = err.message || 'Failed to load students for class';
          this.snackBar.open(this.errorMessage, 'Close', { duration: 3000 });
          this.etudiantsByClasse[id] = [];
        }
      });
    }
  }

  deleteClasse(id: number): void {
    if (confirm('Are you sure you want to delete this class?')) {
      this.classeService.deleteClasse(id).subscribe({
        next: () => {
          this.loadClasses().subscribe();
          this.etudiantsByClasse = {};
          this.paniersByClasse = {};
          this.matieresByClasse = {};
          this.successMessage = 'Class deleted successfully!';
          this.snackBar.open(this.successMessage, 'Close', { duration: 3000 });
          setTimeout(() => this.successMessage = '', 2000);
        },
        error: (err) => {
          console.error('Error deleting class:', err);
          this.errorMessage = err.error?.message || 'Failed to delete class';
          this.snackBar.open(this.errorMessage, 'Close', { duration: 3000 });
        }
      });
    }
  }

  downloadClassStudents(classId: number, classNom: string, classSection: string): void {
    const element = document.getElementById(`student-table-${classId}`);
    if (element) {
      html2canvas(element).then((canvas: { toDataURL: (arg0: string) => any }) => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        pdf.text(`Students of ${classNom} - ${classSection}`, 10, 10);
        pdf.addImage(imgData, 'PNG', 10, 20, pdfWidth - 20, pdfHeight);
        pdf.save(`students-${classNom}-${classSection}.pdf`);
      });
    } else {
      this.errorMessage = 'No student table found for this class';
      this.snackBar.open(this.errorMessage, 'Close', { duration: 3000 });
      setTimeout(() => this.errorMessage = '', 2000);
    }
  }
   onPageChange(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updatePagedClasses();
  }
}