
import { Component, OnInit, OnChanges, SimpleChanges, ChangeDetectorRef, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MatTableDataSource, MatTable } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { PanierDto } from 'src/app/models/PanierDto';
import { MatiereDto } from 'src/app/models/MatiereDto';
import { SemestreDto } from 'src/app/models/SemestreDto';
import { PanierService } from 'src/app/Services/PanierService/panier.service';
import { SemestreService } from 'src/app/Services/SemestreService/semestre.service';
import { ChatService } from 'src/app/Services/ChatService';
import { MatiereService } from 'src/app/Services/MatierService/matiere.service';

@Component({
  selector: 'app-panier',
  templateUrl: './panier.component.html',
  styleUrls: ['./panier.component.css']
})
export class PanierComponent implements OnInit, OnChanges {
  displayedColumns: string[] = ['id', 'nom', 'coefficientTotal', 'semestre', 'listeMatieres', 'actions'];
  dataSource = new MatTableDataSource<PanierDto>([]);
  panierForm: FormGroup;
  showForm: boolean = false;
  editMode: boolean = false;
  isSubmitting: boolean = false;
  selectedPanier: PanierDto = { nom: '', coefficientTotal: 0, semestreId: undefined, matiereIds: [] };
  allMatieres: MatiereDto[] = [];
  allSemestres: SemestreDto[] = [];
  selectedSemestreId?: number;
  semestreNomMap: { [key: number]: string } = {};
  matieresMap: { [key: number]: MatiereDto[] } = {};

  @Input() showAddFormOnly: boolean = false;
  @Input() matieresInput: MatiereDto[] = [];
  @Input() semestresInput: SemestreDto[] = [];
  @Output() panierAdded = new EventEmitter<PanierDto>();

  @ViewChild(MatTable) table!: MatTable<PanierDto>;

  constructor(
    private panierService: PanierService,
    private matiereService: MatiereService,
    private semestreService: SemestreService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    private chatService: ChatService
  ) {
    this.panierForm = this.fb.group({
      nom: ['', Validators.required],
      coefficientTotal: ['', [Validators.required, Validators.min(1)]],
      semestreId: ['', Validators.required],
      matiereIds: [[], Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadAllData();
    if (!this.showAddFormOnly) {
      this.loadPaniers();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['matieresInput'] && changes['matieresInput'].currentValue) {
      this.allMatieres = this.matieresInput;
      this.cdr.detectChanges();
    }
    if (changes['semestresInput'] && changes['semestresInput'].currentValue) {
      this.allSemestres = this.semestresInput;
      this.updateSemestreNomMap();
      this.cdr.detectChanges();
    }
  }

  loadPaniers(): void {
    const panierObservable = this.selectedSemestreId
      ? this.panierService.getPaniersBySemestre(this.selectedSemestreId)
      : this.panierService.getAllPaniers();

    panierObservable.subscribe({
      next: (paniers) => {
        this.dataSource.data = paniers || [];
        this.loadAdditionalData(paniers);
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        this.snackBar.open('Échec du chargement des paniers.', 'Fermer', { duration: 3000 });
        this.dataSource.data = [];
        this.cdr.detectChanges();
      }
    });
  }

  loadAllData(): void {
    if (this.matieresInput.length > 0 && this.semestresInput.length > 0) {
      this.allMatieres = this.matieresInput;
      this.allSemestres = this.semestresInput;
      this.updateSemestreNomMap();
    } else {
      forkJoin({
        matieres: this.matiereService.getAllMatieres(),
        semestres: this.semestreService.getAllSemestres()
      }).subscribe({
        next: ({ matieres, semestres }) => {
          this.allMatieres = matieres || [];
          this.allSemestres = semestres || [];
          this.updateSemestreNomMap();
        },
        error: (err: HttpErrorResponse) => {
          this.snackBar.open('Échec du chargement des matières ou semestres.', 'Fermer', { duration: 3000 });
        }
      });
    }
  }

  private updateSemestreNomMap(): void {
    this.semestreNomMap = this.allSemestres.reduce((map, semestre) => {
      if (semestre.id) {
        map[semestre.id] = semestre.nom;
      }
      return map;
    }, {} as { [key: number]: string });
    this.cdr.detectChanges();
  }

  loadAdditionalData(paniers: PanierDto[]): void {
    const matiereObservables: Observable<void>[] = [];
    paniers.forEach(panier => {
      if (panier.id && panier.matiereIds?.length && !this.matieresMap[panier.id]) {
        matiereObservables.push(
          forkJoin(panier.matiereIds.map(id => this.matiereService.getMatiereById(id))).pipe(
            map((matieres: MatiereDto[]) => {
              this.matieresMap[panier.id!] = matieres;
            }),
            catchError((err: HttpErrorResponse) => {
              this.matieresMap[panier.id!] = [];
              return of(void 0);
            })
          )
        );
      }
    });

    if (matiereObservables.length > 0) {
      forkJoin(matiereObservables).subscribe({
        next: () => this.cdr.detectChanges(),
        error: (err: HttpErrorResponse) => {
          this.snackBar.open('Échec du chargement des données supplémentaires.', 'Fermer', { duration: 3000 });
        }
      });
    }
  }

  filterBySemestre(semestreId: number): void {
    this.selectedSemestreId = semestreId;
    this.loadPaniers();
  }

  clearSemestreFilter(): void {
    this.selectedSemestreId = undefined;
    this.loadPaniers();
  }

  openForm(): void {
    this.showForm = true;
    this.editMode = false;
    this.isSubmitting = false;
    this.selectedPanier = { nom: '', coefficientTotal: 0, semestreId: undefined, matiereIds: [] };
    this.panierForm.reset({ nom: '', coefficientTotal: '', semestreId: '', matiereIds: [] });
  }

  cancelForm(): void {
    this.showForm = false;
    this.editMode = false;
    this.isSubmitting = false;
    this.selectedPanier = { nom: '', coefficientTotal: 0, semestreId: undefined, matiereIds: [] };
    this.panierForm.reset({ nom: '', coefficientTotal: '', semestreId: '', matiereIds: [] });
  }

  editPanier(panier: PanierDto): void {
    this.selectedPanier = { ...panier };
    this.showForm = true;
    this.editMode = true;
    this.isSubmitting = false;
    this.panierForm.patchValue({
      nom: panier.nom,
      coefficientTotal: panier.coefficientTotal,
      semestreId: panier.semestreId,
      matiereIds: panier.matiereIds || []
    });
  }

  onSubmit(saveAndNew: boolean = false): void {
    if (this.panierForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      const panier: PanierDto = { ...this.selectedPanier, ...this.panierForm.value };
      const operation = this.editMode && this.selectedPanier.id
        ? this.panierService.updatePanier(panier)
        : this.panierService.createPanier(panier);

      operation.subscribe({
        next: (response) => {
          if (!this.editMode) {
            this.panierAdded.emit(response);
            this.chatService.sendPanier(response);
          }
          if (!this.showAddFormOnly) {
            this.loadPaniers();
          }
          
          if (saveAndNew && !this.editMode) {
            this.resetFormForNew();
          } else {
            this.cancelForm();
          }
          this.snackBar.open(`Panier ${this.editMode ? 'mis à jour' : 'créé'} avec succès !`, 'Fermer', { duration: 3000 });
        },
        error: (err: HttpErrorResponse) => {
          let errorMessage = `Échec de ${this.editMode ? 'la mise à jour' : 'la création'} du panier.`;
          if (err.status === 403) {
            errorMessage = 'Accès non autorisé. Vérifiez vos permissions.';
          }
          this.snackBar.open(errorMessage, 'Fermer', { duration: 3000 });
          this.isSubmitting = false;
        },
        complete: () => {
          this.isSubmitting = false;
        }
      });
    } else {
      this.snackBar.open('Veuillez remplir tous les champs requis correctement.', 'Fermer', { duration: 3000 });
    }
  }

  resetFormForNew(): void {
    this.selectedPanier = { nom: '', coefficientTotal: 0, semestreId: undefined, matiereIds: [] };
    this.editMode = false;
    this.isSubmitting = false;
    this.panierForm.reset({ nom: '', coefficientTotal: '', semestreId: '', matiereIds: [] });
    this.snackBar.open('Prêt pour l\'entrée suivante !', 'OK', { duration: 2000 });
  }

  deletePanier(id: number): void {
    if (id && confirm('Êtes-vous sûr de vouloir supprimer ce panier ?')) {
      this.panierService.deletePanier(id).subscribe({
        next: () => {
          this.dataSource.data = this.dataSource.data.filter(p => p.id !== id);
          delete this.matieresMap[id];
          this.snackBar.open('Panier supprimé avec succès !', 'Fermer', { duration: 3000 });
          this.cdr.detectChanges();
        },
        error: (err: HttpErrorResponse) => {
          this.snackBar.open('Échec de la suppression du panier.', 'Fermer', { duration: 3000 });
        }
      });
    }
  }

  getSemestreNom(semestreId?: number): string {
    return semestreId !== undefined ? this.semestreNomMap[semestreId] || 'Non trouvé' : 'Non assigné';
  }

  getListeMatieres(panierId?: number): string {
    const matieres = panierId ? this.matieresMap[panierId] || [] : [];
    return matieres.map(m => m.nom).join(', ') || 'Aucune matière';
  }
}