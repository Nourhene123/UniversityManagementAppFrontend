// src/app/matiere/matiere/matiere.component.ts
import { Component, OnInit, OnChanges, SimpleChanges, ChangeDetectorRef, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { EnseignantDto } from 'src/app/models/EnseignantDto';
import { MatiereDto } from 'src/app/models/MatiereDto';
import { EnseignantService } from 'src/app/Services/EnseignantService/enseignant.service';
import { MatiereService } from 'src/app/Services/MatierService/matiere.service';
import { ChatService } from 'src/app/Services/ChatService';

@Component({
  selector: 'app-matiere',
  templateUrl: './matiere.component.html',
  styleUrls: ['./matiere.component.css']
})
export class MatiereComponent implements OnInit, OnChanges {
  matieres: MatiereDto[] = [];
  displayedColumns: string[] = ['id', 'nom', 'volumeHoraire', 'coefficient', 'enseignantNom', 'actions'];
  matiereForm: FormGroup;
  showForm: boolean = false;
  editMode: boolean = false;
  isSubmitting: boolean = false;
  selectedMatiere: MatiereDto = { nom: '', volumeHoraire: 0, coefficient: 0 };
  enseignants: EnseignantDto[] = [];
  enseignantNomMap: { [key: number]: string } = {};

  @Input() showAddFormOnly: boolean = false;
  @Input() enseignantsInput: EnseignantDto[] = [];
  @Output() matiereAdded = new EventEmitter<MatiereDto>();

  constructor(
    private matiereService: MatiereService,
    private enseignantService: EnseignantService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    private chatService: ChatService
  ) {
    this.matiereForm = this.fb.group({
      nom: ['', Validators.required],
      volumeHoraire: [0, [Validators.required, Validators.min(1)]],
      coefficient: [0, [Validators.required, Validators.min(1)]],
      enseignantId: [null]
    });
  }

  ngOnInit(): void {
    this.loadEnseignants();
    if (!this.showAddFormOnly) {
      this.loadMatieres();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['enseignantsInput'] && changes['enseignantsInput'].currentValue) {
      this.enseignants = this.enseignantsInput;
      this.updateEnseignantNomMap();
      this.cdr.detectChanges();
    }
  }

  loadEnseignants(): void {
    if (this.enseignantsInput.length > 0) {
      this.enseignants = this.enseignantsInput;
      this.updateEnseignantNomMap();
    } else {
      this.enseignantService.getAllEnseignants().subscribe({
        next: (data) => {
          if (data) {
            this.enseignants = data.filter(u => u.role === 'Enseignant' || u.role === 'ROLE_Enseignant');
            this.updateEnseignantNomMap();
          } else {
            this.enseignants = [];
            this.enseignantNomMap = {};
            this.snackBar.open('Aucun enseignant trouvé.', 'Fermer', { duration: 3000 });
          }
        },
        error: (err: HttpErrorResponse) => {
          this.snackBar.open('Échec du chargement des enseignants.', 'Fermer', { duration: 3000 });
        }
      });
    }
  }

  private updateEnseignantNomMap(): void {
    const seenIds = new Set<number>();
    this.enseignantNomMap = this.enseignants.reduce((map, user) => {
      if (user.id !== undefined) {
        if (seenIds.has(user.id)) {
          console.warn(`Duplicate enseignant ID detected: ${user.id} (${user.nom} ${user.prenom})`);
        } else {
          seenIds.add(user.id);
          map[user.id] = `${user.nom} ${user.prenom}` || 'Unknown';
        }
      }
      return map;
    }, {} as { [key: number]: string });
    this.cdr.detectChanges();
  }

  loadMatieres(): void {
    this.matiereService.getAllMatieres().subscribe({
      next: (matieres) => {
        this.matieres = matieres || [];
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        this.snackBar.open('Échec du chargement des matières.', 'Fermer', { duration: 3000 });
        this.matieres = [];
        this.cdr.detectChanges();
      }
    });
  }

  getEnseignantNom(enseignantId: number | undefined): string {
    return enseignantId ? this.enseignantNomMap[enseignantId] || 'Unknown' : 'N/A';
  }

  openForm(): void {
    this.showForm = true;
    this.editMode = false;
    this.isSubmitting = false;
    this.selectedMatiere = { nom: '', volumeHoraire: 0, coefficient: 0 };
    this.matiereForm.reset({ nom: '', volumeHoraire: 0, coefficient: 0, enseignantId: null });
  }

  toggleForm(): void {
    this.showForm = !this.showForm;
    if (this.showForm) {
      this.matiereForm.reset({ nom: '', volumeHoraire: 0, coefficient: 0, enseignantId: null });
      this.editMode = false;
      this.selectedMatiere = { nom: '', volumeHoraire: 0, coefficient: 0 };
    }
  }

  editMatiere(matiere: MatiereDto): void {
    this.showForm = true;
    this.editMode = true;
    this.isSubmitting = false;
    this.selectedMatiere = { ...matiere };
    this.matiereForm.patchValue(matiere);
  }

  onSubmit(): void {
    if (this.matiereForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      const matiere: MatiereDto = { ...this.selectedMatiere, ...this.matiereForm.value };
      const operation = this.editMode && this.selectedMatiere.id
        ? this.matiereService.updateMatiere(matiere)
        : this.matiereService.createMatiere(matiere);

      operation.subscribe({
        next: (response) => {
          if (!this.editMode) {
            this.matiereAdded.emit(response); // Emit server response
            this.chatService.sendMatiere(response); // Notify with server response
          }
          if (!this.showAddFormOnly) {
            this.loadMatieres();
          }
          this.cancelForm();
          this.snackBar.open(`Matière ${this.editMode ? 'mise à jour' : 'créée'} avec succès !`, 'Fermer', { duration: 3000 });
        },
        error: (err: HttpErrorResponse) => {
          this.snackBar.open(`Échec de ${this.editMode ? 'la mise à jour' : 'la création'} de la matière.`, 'Fermer', { duration: 3000 });
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

  deleteMatiere(id: number | undefined): void {
    if (id && confirm('Êtes-vous sûr de vouloir supprimer cette matière ?')) {
      this.matiereService.deleteMatiere(id).subscribe({
        next: () => {
          this.loadMatieres();
          this.snackBar.open('Matière supprimée avec succès !', 'Fermer', { duration: 3000 });
        },
        error: (err: HttpErrorResponse) => {
          this.snackBar.open('Échec de la suppression de la matière.', 'Fermer', { duration: 3000 });
        }
      });
    }
  }

  cancelForm(): void {
    this.showForm = false;
    this.editMode = false;
    this.isSubmitting = false;
    this.selectedMatiere = { nom: '', volumeHoraire: 0, coefficient: 0 };
    this.matiereForm.reset({ nom: '', volumeHoraire: 0, coefficient: 0, enseignantId: null });
  }
}