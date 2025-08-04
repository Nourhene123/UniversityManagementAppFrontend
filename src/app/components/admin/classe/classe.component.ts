import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { forkJoin, of, switchMap, catchError, Observable, Subject } from 'rxjs';
import { map, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ClasseDto } from 'src/app/models/ClasseDto';
import { EnseignantDto } from 'src/app/models/EnseignantDto';
import { EtudiantDto } from 'src/app/models/EtudiantDto';
import { MatiereDto } from 'src/app/models/MatiereDto';
import { ParcourDto } from 'src/app/models/ParcourDto';
import { ClasseService } from 'src/app/Services/Classe/classe.service';
import { EnseignantService } from 'src/app/Services/EnseignantService/enseignant.service';
import { EtudiantService } from 'src/app/Services/EtudiantService/etudiant.service';
import { MatiereService } from 'src/app/Services/MatierService/matiere.service';
import { ParcourService } from 'src/app/Services/ParcourService/parcour.service';
import { Router } from '@angular/router';
import * as jsPDFModule from 'jspdf';
const jsPDF = jsPDFModule.jsPDF;
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-classe',
  templateUrl: './classe.component.html',
  styleUrls: ['./classe.component.css']
})
export class ClasseComponent implements OnInit {
  classeForm: FormGroup;
  classes: ClasseDto[] = [];
  filteredClasses: ClasseDto[] = [];
  parcours: ParcourDto[] = [];
  enseignants: EnseignantDto[] = [];
  matieres: MatiereDto[] = [];
  etudiants: EtudiantDto[] = [];
  etudiantsByClasse: { [key: number]: EtudiantDto[] } = {};
  loading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  showForm = false;
  expandedClassId: number | null = null;
  editingClassId: number | null = null;
  today: Date = new Date();
  searchTerm: string = '';
  isAdmin: boolean = false; // Flag for admin role
  private searchSubject = new Subject<string>();

  constructor(
    private fb: FormBuilder,
    private classeService: ClasseService,
    private parcourService: ParcourService,
    private enseignantService: EnseignantService,
    private matiereService: MatiereService,
    private etudiantService: EtudiantService,
    private router: Router
  ) {
    this.classeForm = this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(3)]],
      section: ['', [Validators.required, Validators.minLength(2)]],
      parcourId: ['', [Validators.required, Validators.min(1)]],
      matiereIds: [[], Validators.required],
      enseignantIds: [[], Validators.required],
      etudiantIds: [[], Validators.required]
    });
  }

  ngOnInit(): void {
   

    this.loadClasses();
    this.loadParcours();
    this.loadEnseignants();
    this.loadMatieres();
    this.loadEtudiants();
    this.setupSearch();
    this.classeForm.get('parcourId')?.valueChanges.pipe(
      switchMap(parcourId => {
        if (parcourId) {
          return this.parcourService.getEtudiantsByParcourId(parcourId).pipe(
            map((data: EtudiantDto[]) => {
              console.log('Loaded students for parcour:', data);
              this.etudiants = data || [];
              return parcourId;
            }),
            catchError(err => {
              console.error(`Error loading students for parcour ${parcourId}:`, err);
              if (err.status === 403) {
                this.errorMessage = 'Accès refusé. Veuillez vérifier vos permissions ou vous reconnecter.';
                setTimeout(() => this.router.navigate(['/login']), 2000);
              } else {
                this.errorMessage = `Failed to load students for parcour ${parcourId}`;
              }
              return of(null);
            })
          );
        }
        return of(null);
      })
    ).subscribe(parcourId => {
      if (parcourId) {
        this.classeForm.get('etudiantIds')?.setValue([]);
      } else {
        this.etudiants = [];
        this.classeForm.get('etudiantIds')?.setValue([]);
      }
    });
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
  }

  loadClasses(): void {
    this.loading = true;
    this.etudiantsByClasse = {};
    this.classeService.getAllClasses().pipe(
      switchMap(classes => {
        this.classes = classes || [];
        this.filteredClasses = classes || [];
        console.log('Loaded classes:', this.classes);
        const etudiantObservables = this.classes
          .filter(classe => classe.id)
          .map(classe =>
            this.classeService.getEtudiantsByClasseId(classe.id!).pipe(
              map((etudiants: EtudiantDto[]) => {
                console.log(`Loaded students for class ${classe.nom} (ID: ${classe.id}):`, etudiants);
                this.etudiantsByClasse[classe.id!] = etudiants || [];
                return classe;
              }),
              catchError(err => {
                console.error(`Error loading students for class ${classe.nom}:`, err);
                this.etudiantsByClasse[classe.id!] = [];
                return of(classe);
              })
            )
          );
        return forkJoin(etudiantObservables.length > 0 ? etudiantObservables : [of(null)]).pipe(
          map(() => classes)
        );
      }),
      catchError(err => {
        console.error('Error loading classes:', err);
        this.errorMessage = err.message || 'Failed to load classes';
        return of([]);
      })
    ).subscribe(() => {
      this.loading = false;
    });
  }

  loadParcours(): void {
    this.parcourService.getAllParcours().subscribe({
      next: (data) => {
        this.parcours = data || [];
        console.log('Loaded parcours:', this.parcours);
      },
      error: (err) => {
        console.error('Error loading parcours:', err);
        this.errorMessage = 'Failed to load parcours';
      }
    });
  }

  loadEnseignants(): void {
    this.enseignantService.getAllEnseignants().subscribe({
      next: (data) => {
        this.enseignants = data || [];
        console.log('Loaded enseignants:', this.enseignants);
      },
      error: (err) => {
        console.error('Error loading enseignants:', err);
        this.errorMessage = 'Failed to load enseignants';
      }
    });
  }

  loadMatieres(): void {
    this.matiereService.getAllMatieres().subscribe({
      next: (data) => {
        this.matieres = data || [];
        console.log('Loaded matieres:', this.matieres);
      },
      error: (err) => {
        console.error('Error loading matieres:', err);
        this.errorMessage = 'Failed to load matieres';
      }
    });
  }

  loadEtudiants(): void {
    this.etudiantService.getAllEtudiants().subscribe({
      next: (data) => {
        this.etudiants = data || [];
        console.log('Loaded etudiants:', this.etudiants);
      },
      error: (err) => {
        console.error('Error loading etudiants:', err);
        this.errorMessage = 'Failed to load etudiants';
      }
    });
  }

  downloadClassStudents(classId: number, classNom: string, classSection: string): void {
    const element = document.getElementById(`student-table-${classId}`);
    if (element) {
      html2canvas(element).then((canvas: { toDataURL: (arg0: string) => any; }) => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        pdf.text(`Students of ${classNom} - ${classSection}`, 10, 10); // Add title
        pdf.addImage(imgData, 'PNG', 10, 20, pdfWidth - 20, pdfHeight); // Adjust position
        pdf.save(`students-${classNom}-${classSection}.pdf`);
      });
    } else {
      this.errorMessage = 'No student table found for this class';
      setTimeout(() => this.errorMessage = null, 2000);
    }
  }

  getParcourNom(parcourId: number): string {
    const parcour = this.parcours.find(p => p.id === parcourId);
    return parcour ? parcour.nom : 'N/A';
  }

  getMatiereNames(matiereIds: number[]): string {
    return matiereIds
      .map(id => this.matieres.find(m => m.id === id)?.nom)
      .filter((name): name is string => !!name)
      .join(', ') || 'None';
  }

  getEnseignantNames(enseignantIds: number[]): string {
    return enseignantIds
      .map(id => {
        const enseignant = this.enseignants.find(e => e.id === id);
        return enseignant ? `${enseignant.nom} ${enseignant.prenom}` : null;
      })
      .filter((name): name is string => !!name)
      .join(', ') || 'None';
  }

  getEtudiantNames(etudiantIds: number[]): string {
    return etudiantIds
      .map(id => {
        const etudiant = this.etudiants.find(e => e.id === id);
        return etudiant ? `${etudiant.nom} ${etudiant.prenom}` : null;
      })
      .filter((name): name is string => !!name)
      .join(', ') || 'None';
  }

  toggleForm(): void {
    this.showForm = !this.showForm;
    if (!this.showForm) {
      this.classeForm.reset();
      this.editingClassId = null;
      this.errorMessage = null;
      this.successMessage = null;
      this.etudiants = [];
      this.classeForm.get('etudiantIds')?.setValue([]);
    }
  }

  editClasse(classe: ClasseDto): void {
    this.editingClassId = classe.id || null;
    this.classeForm.patchValue({
      nom: classe.nom,
      section: classe.section,
      parcourId: classe.parcourId,
      matiereIds: classe.matiereIds || [],
      enseignantIds: classe.enseignantIds || [],
      etudiantIds: classe.etudiantIds || []
    });
    if (classe.parcourId) {
      this.parcourService.getEtudiantsByParcourId(classe.parcourId).subscribe({
        next: (data) => {
          this.etudiants = data || [];
          console.log('Loaded students for editing class:', data);
        },
        error: (err) => {
          console.error('Error loading students for parcour:', err);
          this.errorMessage = 'Failed to load students for parcour';
        }
      });
    }
    this.showForm = true;
  }

  onSubmit(): void {
    if (this.classeForm.valid) {
      this.loading = true;
      const classeData: ClasseDto = this.classeForm.value;
      console.log('Submitting class data:', classeData);
      const request = this.editingClassId
        ? this.classeService.updateClasse(this.editingClassId, classeData)
        : this.classeService.createClasse(classeData);

      request.pipe(
        switchMap((response: ClasseDto) => {
          console.log('Class response:', response);
          if (response.id) {
            return this.classeService.getEtudiantsByClasseId(response.id).pipe(
              map((etudiants: EtudiantDto[]) => {
                this.etudiantsByClasse[response.id!] = etudiants || [];
                console.log(`Loaded students for class ID ${response.id}:`, etudiants);
                return response;
              }),
              catchError(err => {
                console.error(`Error loading students for class ID ${response.id}:`, err);
                this.etudiantsByClasse[response.id!] = [];
                return of(response);
              })
            );
          }
          return of(response);
        })
      ).subscribe({
        next: (response: ClasseDto) => {
          this.successMessage = this.editingClassId ? 'Class updated successfully!' : 'Class created successfully!';
          this.loading = false;
          this.classeForm.reset();
          this.editingClassId = null;
          this.etudiants = [];
          this.classeForm.get('etudiantIds')?.setValue([]);
          this.loadClasses();
          this.expandedClassId = response.id || null;
          setTimeout(() => {
            this.successMessage = null;
            this.showForm = false;
          }, 2000);
        },
        error: (err) => {
          console.error('Submission Error:', err);
          this.errorMessage = err.message || 'Failed to create/update class';
          this.loading = false;
        }
      });
    } else {
      console.log('Form is invalid:', this.classeForm.errors);
    }
  }

  toggleExpand(id: number): void {
    this.expandedClassId = this.expandedClassId === id ? null : id;
    if (this.expandedClassId && !this.etudiantsByClasse[id]) {
      this.classeService.getEtudiantsByClasseId(id).subscribe({
        next: (etudiants) => {
          this.etudiantsByClasse[id] = etudiants || [];
          console.log(`Loaded students for class ID ${id} on expand:`, etudiants);
        },
        error: (err) => {
          console.error('Error loading students for class:', err);
          this.errorMessage = 'Failed to load students for class';
          this.etudiantsByClasse[id] = [];
        }
      });
    }
  }

  deleteClasse(id: number): void {
    if (confirm('Are you sure you want to delete this class?')) {
      this.classeService.deleteClasse(id).subscribe({
        next: () => {
          this.loadClasses();
          this.etudiantsByClasse = {};
        },
        error: (err) => {
          console.error('Error deleting class:', err);
          this.errorMessage = err.message || 'Failed to delete class';
        }
      });
    }
  }
}