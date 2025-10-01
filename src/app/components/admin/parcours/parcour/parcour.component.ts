
import { Component, OnInit, OnChanges, SimpleChanges, ChangeDetectorRef, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MatTableDataSource, MatTable } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PanierService } from 'src/app/Services/PanierService/panier.service';
import { ParcourService } from 'src/app/Services/ParcourService/parcour.service';
import { PanierDto } from 'src/app/models/PanierDto';
import { ParcourDto } from 'src/app/models/ParcourDto';
import { MatDialog } from '@angular/material/dialog';
import { ChatService } from 'src/app/Services/ChatService';
import { AffectationDialogComponent } from './affectation-dialog/affectation-dialog.component';

@Component({
  selector: 'app-parcour',
  templateUrl: './parcour.component.html',
  styleUrls: ['./parcour.component.css']
})
export class ParcourComponent implements OnInit, OnChanges {
  displayedColumns: string[] = ['id', 'nom', 'annee', 'libelle', 'paniers', 'actions'];
  dataSource = new MatTableDataSource<ParcourDto>();
  parcourForm: FormGroup;
  showForm: boolean = false;
  editMode: boolean = false;
  isSubmitting: boolean = false;
  paniers: PanierDto[] = [];
  errorMessage: string = '';
  successMessage: string = '';

  @Input() showAddFormOnly: boolean = false;
  @Input() paniersInput: PanierDto[] = [];
  @Output() parcourAdded = new EventEmitter<ParcourDto>();

  @ViewChild(MatTable) table!: MatTable<ParcourDto>;

  constructor(
    private parcourService: ParcourService,
    private panierService: PanierService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    private chatService: ChatService
  ) {
    this.parcourForm = this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(2)]],
      annee: ['', Validators.required],
      libelle: ['', [Validators.required, Validators.minLength(2)]],
      panierIds: [[]]
    });
  }

  ngOnInit() {
    this.loadParcours();
    this.loadPaniers();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['paniersInput'] && changes['paniersInput'].currentValue) {
      this.paniers = this.paniersInput;
      this.cdr.detectChanges();
    }
  }

  loadParcours() {
    this.parcourService.getAllParcours().subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.snackBar.open('Échec du chargement des parcours.', 'Fermer', { duration: 3000 });
      }
    });
  }

  loadPaniers() {
    if (this.paniersInput.length > 0) {
      this.paniers = this.paniersInput;
    } else {
      this.panierService.getAllPaniers().subscribe({
        next: (data) => {
          this.paniers = data;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.snackBar.open('Échec du chargement des paniers.', 'Fermer', { duration: 3000 });
        }
      });
    }
  }

  getPanierNames(panierIds: number[]): string {
    if (!panierIds || panierIds.length === 0) {
      return 'Aucun';
    }
    return this.paniers
      .filter(panier => panier.id !== undefined && panierIds.includes(panier.id))
      .map(panier => panier.nom)
      .join(', ');
  }

  openForm(): void {
    this.showForm = true;
    this.editMode = false;
    this.isSubmitting = false;
    this.parcourForm.reset({ nom: '', annee: '', libelle: '', panierIds: [] });
    this.errorMessage = '';
    this.successMessage = '';
  }

  cancelForm(): void {
    this.showForm = false;
    this.editMode = false;
    this.isSubmitting = false;
    this.parcourForm.reset({ nom: '', annee: '', libelle: '', panierIds: [] });
    this.errorMessage = '';
    this.successMessage = '';
  }

  onSubmit(): void {
    if (this.parcourForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      const parcour: ParcourDto = this.parcourForm.value;
      if (this.editMode) {
        parcour.id = this.parcourForm.value.id;
      }
      const operation = this.editMode && parcour.id
        ? this.parcourService.updateParcour(parcour)
        : this.parcourService.createParcour(parcour);

      operation.subscribe({
        next: (response) => {
          if (!this.editMode) {
            this.parcourAdded.emit(response); // Emit server response
            this.chatService.sendParcour(response); // Notify with server response
          }
          if (!this.showAddFormOnly) {
            this.loadParcours();
          }
          this.cancelForm();
          this.snackBar.open(`Parcours ${this.editMode ? 'mis à jour' : 'créé'} avec succès !`, 'Fermer', { duration: 3000 });
        },
        error: (err: HttpErrorResponse) => {
          let errorMessage = `Échec de ${this.editMode ? 'la mise à jour' : 'la création'} du parcours.`;
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

  editParcour(parcour: ParcourDto): void {
    this.showForm = true;
    this.editMode = true;
    this.isSubmitting = false;
    this.parcourForm.patchValue({
      nom: parcour.nom,
      annee: parcour.annee,
      libelle: parcour.libelle,
      panierIds: parcour.panierIds || []
    });
    this.errorMessage = '';
    this.successMessage = '';
  }

  deleteParcour(id: number): void {
    if (id && confirm('Êtes-vous sûr de vouloir supprimer ce parcours ?')) {
      this.parcourService.deleteParcour(id).subscribe({
        next: () => {
          this.dataSource.data = this.dataSource.data.filter(p => p.id !== id);
          this.snackBar.open('Parcours supprimé avec succès !', 'Fermer', { duration: 3000 });
          this.cdr.detectChanges();
        },
        error: (err: HttpErrorResponse) => {
          this.snackBar.open('Échec de la suppression du parcours.', 'Fermer', { duration: 3000 });
        }
      });
    }
  }
openAffectationDialog(parcourId: number) {
    const dialogRef = this.dialog.open(AffectationDialogComponent, {
      width: '400px',
      data: { parcourId }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.success) {
        this.loadParcours(); // Refresh data on successful assignment
        this.snackBar.open('Students assigned successfully!', 'Close', {
          duration: 3000,
        });
      } else if (result?.error) {
        this.snackBar.open(`Failed to assign students: ${result.error.message || 'Unknown error'}`, 'Close', {
          duration: 5000,
        });
      }
    });
  }
}
