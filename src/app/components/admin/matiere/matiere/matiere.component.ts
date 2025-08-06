import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { EnseignantDto } from 'src/app/models/EnseignantDto';
import { MatiereDto } from 'src/app/models/MatiereDto';
import { EnseignantService } from 'src/app/Services/EnseignantService/enseignant.service';
import { MatiereService } from 'src/app/Services/MatierService/matiere.service';

@Component({
  selector: 'app-matiere',
  templateUrl: './matiere.component.html',
  styleUrls: ['./matiere.component.css']
})
export class MatiereComponent implements OnInit {
  matieres: MatiereDto[] = [];
  displayedColumns: string[] = ['id', 'nom', 'volumeHoraire', 'coefficient', 'enseignantNom', 'actions'];
  matiereForm: FormGroup;
  showForm: boolean = false;
  editMode: boolean = false;
  isSubmitting: boolean = false;
  selectedMatiere: MatiereDto = { nom: '', volumeHoraire: 0, coefficient: 0 };
  enseignants: EnseignantDto[] = [];
  enseignantNomMap: { [key: number]: string } = {};

  constructor(
    private matiereService: MatiereService,
    private enseignantService: EnseignantService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
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
    this.loadMatieres();
  }

  loadEnseignants(): void {
    this.enseignantService.getAllEnseignants().subscribe({
      next: (data) => {
        if (data) {
          this.enseignants = data.filter(u => u.role === 'Enseignant' || u.role === 'ROLE_Enseignant');
          const seenIds = new Set<number>();
          this.enseignantNomMap = data.reduce((map, user) => {
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
          console.log('Enseignants loaded:', data);
          console.log('enseignantNomMap:', this.enseignantNomMap);
          this.cdr.detectChanges();
        } else {
          this.enseignants = [];
          this.enseignantNomMap = {};
          this.snackBar.open('Aucun enseignant trouvé.', 'Close', { duration: 3000 });
        }
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error loading enseignants:', err.status, err.statusText, err.error);
        this.snackBar.open('Échec du chargement des enseignants : ' + (err.message || 'Erreur serveur'), 'Close', { duration: 3000 });
      }
    });
  }

  loadMatieres(): void {
    this.matiereService.getAllMatieres().subscribe({
      next: (matieres) => {
        this.matieres = matieres || [];
        console.log('Matieres loaded:', this.matieres);
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error loading subjects:', err.status, err.statusText, err.error);
        this.snackBar.open('Échec du chargement des matières : ' + (err.message || 'Erreur serveur'), 'Close', { duration: 3000 });
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
          console.log(`${this.editMode ? 'Update' : 'Create'} response:`, response);
          this.loadMatieres();
          this.cancelForm();
          this.snackBar.open(`Matière ${this.editMode ? 'mise à jour' : 'créée'} avec succès !`, 'Close', { duration: 3000 });
        },
        error: (err: HttpErrorResponse) => {
          console.error(`${this.editMode ? 'Update' : 'Create'} error:`, err.status, err.statusText, err.error);
          this.snackBar.open(`Échec de ${this.editMode ? 'la mise à jour' : 'la création'} de la matière : ` + (err.message || 'Erreur serveur'), 'Close', { duration: 3000 });
          this.isSubmitting = false;
        },
        complete: () => {
          this.isSubmitting = false;
        }
      });
    } else {
      console.log('Form invalid, errors:', this.matiereForm.errors);
      this.snackBar.open('Veuillez remplir tous les champs requis correctement.', 'Close', { duration: 3000 });
    }
  }

  deleteMatiere(id: number | undefined): void {
    if (id && confirm('Êtes-vous sûr de vouloir supprimer cette matière ?')) {
      this.matiereService.deleteMatiere(id).subscribe({
        next: () => {
          console.log('Subject deleted:', id);
          this.loadMatieres();
          this.snackBar.open('Matière supprimée avec succès !', 'Close', { duration: 3000 });
        },
        error: (err: HttpErrorResponse) => {
          console.error('Error deleting subject:', err.status, err.statusText, err.error);
          this.snackBar.open('Échec de la suppression de la matière : ' + (err.message || 'Erreur serveur'), 'Close', { duration: 3000 });
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