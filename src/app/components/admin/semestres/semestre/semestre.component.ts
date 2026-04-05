
import { Component, OnInit, ChangeDetectorRef, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MatTableDataSource, MatTable } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable } from 'rxjs';
import { SemestreService } from 'src/app/Services/SemestreService/semestre.service';
import { PanierService } from 'src/app/Services/PanierService/panier.service';
import { SemestreDto } from 'src/app/models/SemestreDto';
import { ChatService } from 'src/app/Services/ChatService';

@Component({
  selector: 'app-semestre',
  templateUrl: './semestre.component.html',
  styleUrls: ['./semestre.component.css']
})
export class SemestreComponent implements OnInit {
  semestres$: Observable<SemestreDto[] | null> = this.semestreService.getAllSemestres();
  dataSource = new MatTableDataSource<SemestreDto>();
  displayedColumns: string[] = ['id', 'nom', 'actions'];
  semestreForm: FormGroup;
  showForm: boolean = false;
  editMode: boolean = false;
  isSubmitting: boolean = false;
  selectedSemestre: SemestreDto = { nom: '' };

  @Input() showAddFormOnly: boolean = false;
  @Output() semestreAdded = new EventEmitter<SemestreDto>();

  @ViewChild(MatTable) table!: MatTable<SemestreDto>;

  constructor(
    private semestreService: SemestreService,
    private panierService: PanierService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    private chatService: ChatService
  ) {
    this.semestreForm = this.fb.group({
      nom: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    if (!this.showAddFormOnly) {
      this.loadSemestres();
    }
  }

  loadSemestres(): void {
    this.semestres$.subscribe({
      next: (data) => {
        this.dataSource.data = data || [];
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        this.snackBar.open('Échec du chargement des semestres.', 'Fermer', { duration: 3000 });
        this.dataSource.data = [];
        this.cdr.detectChanges();
      }
    });
  }

  openForm(): void {
    this.showForm = true;
    this.editMode = false;
    this.isSubmitting = false;
    this.selectedSemestre = { nom: '' };
    this.semestreForm.reset({ nom: '' });
  }

  toggleForm(): void {
    this.showForm = !this.showForm;
    if (this.showForm) {
      this.semestreForm.reset({ nom: '' });
      this.editMode = false;
      this.selectedSemestre = { nom: '' };
    }
  }

  editSemestre(semestre: SemestreDto): void {
    this.showForm = true;
    this.editMode = true;
    this.isSubmitting = false;
    this.selectedSemestre = { ...semestre };
    this.semestreForm.patchValue(semestre);
  }

  onSubmit(saveAndNew: boolean = false): void {
    if (this.semestreForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      const semestre: SemestreDto = { ...this.selectedSemestre, ...this.semestreForm.value };
      const operation = this.editMode && this.selectedSemestre.id
        ? this.semestreService.updateSemestre(semestre)
        : this.semestreService.createSemestre(semestre);

      operation.subscribe({
        next: (response) => {
          if (!this.editMode) {
            this.semestreAdded.emit(response);
            this.chatService.sendSemestre(response);
          }
          if (!this.showAddFormOnly) {
            this.loadSemestres();
          }
          
          if (saveAndNew && !this.editMode) {
            this.resetFormForNew();
          } else {
            this.cancelForm();
          }
          this.snackBar.open(`Semestre ${this.editMode ? 'mis à jour' : 'créé'} avec succès !`, 'Fermer', { duration: 3000 });
        },
        error: (err: HttpErrorResponse) => {
          this.snackBar.open(`Échec de ${this.editMode ? 'la mise à jour' : 'la création'} du semestre.`, 'Fermer', { duration: 3000 });
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
    this.selectedSemestre = { nom: '' };
    this.editMode = false;
    this.isSubmitting = false;
    this.semestreForm.reset({ nom: '' });
    this.snackBar.open('Prêt pour l\'entrée suivante !', 'OK', { duration: 2000 });
  }

  deleteSemestre(id: number): void {
    if (id && confirm('Êtes-vous sûr de vouloir supprimer ce semestre ?')) {
      this.semestreService.deleteSemestre(id).subscribe({
        next: () => {
          this.loadSemestres();
          this.snackBar.open('Semestre supprimé avec succès !', 'Fermer', { duration: 3000 });
        },
        error: (err: HttpErrorResponse) => {
          this.snackBar.open('Échec de la suppression du semestre.', 'Fermer', { duration: 3000 });
        }
      });
    }
  }

  cancelForm(): void {
    this.showForm = false;
    this.editMode = false;
    this.isSubmitting = false;
    this.selectedSemestre = { nom: '' };
    this.semestreForm.reset({ nom: '' });
  }
}