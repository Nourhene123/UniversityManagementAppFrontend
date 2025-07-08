import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { forkJoin, map, Observable } from 'rxjs';
import { EnseignantDto } from 'src/app/models/EnseignantDto';
import { MatiereDto } from 'src/app/models/MatiereDto';
import { PanierDto } from 'src/app/models/PanierDto';
import { ParcourDto } from 'src/app/models/ParcourDto';
import { EnseignantService } from 'src/app/Services/EnseignantService/enseignant.service';
import { MatiereService } from 'src/app/Services/MatierService/matiere.service';
import { PanierService } from 'src/app/Services/PanierService/panier.service';
import { ParcourService } from 'src/app/Services/ParcourService/parcour.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-matiere',
  templateUrl: './matiere.component.html',
  styleUrls: ['./matiere.component.css']
})
export class MatiereComponent implements OnInit {
 matieres: MatiereDto[] = [];
  displayedColumns: string[] = ['id', 'nom', 'volumeHoraire', 'coefficient', 'panierNom', 'enseignantNom', 'actions'];
  matiereForm: FormGroup;
  showForm: boolean = false;
  editMode: boolean = false;
  isSubmitting: boolean = false;
  selectedMatiere: MatiereDto = {  nom: '', volumeHoraire: 0, coefficient: 0 };
  paniers: PanierDto[] = [];
  enseignants: EnseignantDto[] = [];
  panierNomMap: { [key: number]: string } = {};
  enseignantNomMap: { [key: number]: string } = {};

  constructor(
    private matiereService: MatiereService,
    private panierService: PanierService,
    private enseignantService: EnseignantService,
    private fb: FormBuilder
  ) {
    this.matiereForm = this.fb.group({
      nom: ['', Validators.required],
      volumeHoraire: [0, [Validators.required, Validators.min(1)]],
      coefficient: [0, [Validators.required, Validators.min(1)]],
      panierId: [null],
      enseignantId: [null]
    });
  }

  ngOnInit(): void {
    this.loadPaniers();
    this.loadEnseignants();
    this.loadMatieres();
  }

  loadPaniers(): void {
    this.panierService.getAllPaniers().subscribe({
      next: (data) => {
        this.paniers = data;
        console.log('Paniers loaded:', data);
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error loading paniers:', err.status, err.statusText, err.error);
        alert('Failed to load paniers: ' + err.message);
      }
    });
  }

  loadEnseignants(): void {
    this.enseignantService.getAllEnseignants().subscribe({
      next: (data) => {
        if (data) {
          this.enseignants = data.filter(u => u.role === 'Enseignant');
          this.enseignantNomMap = data.reduce((map, user) => {
            if (user.id !== undefined) {
              map[user.id] = user.nom || 'Unknown';
            }
            return map;
          }, {} as { [key: number]: string });
          console.log('Enseignants loaded:', data);
        } else {
          this.enseignants = [];
          this.enseignantNomMap = {};
        }
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error loading enseignants:', err.status, err.statusText, err.error);
        alert('Failed to load enseignants: ' + err.message);
      }
    });
  }

  loadMatieres(): void {
    this.matiereService.getAllMatieres().subscribe({
      next: (matieres) => {
        const fetchObservables: Observable<void>[] = [];
        matieres.forEach((matiere) => {
          if (matiere.panierId && !this.panierNomMap[matiere.panierId]) {
            fetchObservables.push(
              this.panierService.getPanierById(matiere.panierId).pipe(
                map((panier) => {
                  this.panierNomMap[matiere.panierId!] = panier.nom;
                })
              )
            );
          }
          if (matiere.enseignantId && !this.enseignantNomMap[matiere.enseignantId]) {
            fetchObservables.push(
              this.enseignantService.getEnseignantById(matiere.enseignantId).pipe(
                map((enseignant) => {
                  this.enseignantNomMap[matiere.enseignantId!] = enseignant.nom;
                })
              )
            );
          }
        });

        if (fetchObservables.length > 0) {
          forkJoin(fetchObservables).subscribe({
            next: () => {
              this.matieres = matieres;
              console.log('Matieres loaded with names:', matieres);
            },
            error: (err: HttpErrorResponse) => {
              console.error('Error fetching names:', err.status, err.statusText, err.error);
              alert('Failed to load some names: ' + err.message);
              this.matieres = matieres;
            }
          });
        } else {
          this.matieres = matieres;
          console.log('Matieres loaded:', matieres);
        }
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error loading subjects:', err.status, err.statusText, err.error);
        alert('Failed to load subjects: ' + err.message);
      }
    });
  }

  getPanierNom(panierId: number | undefined): string {
    return panierId ? this.panierNomMap[panierId] || 'Loading...' : 'N/A';
  }

  getEnseignantNom(enseignantId: number | undefined): string {
    return enseignantId ? this.enseignantNomMap[enseignantId] || 'Loading...' : 'N/A';
  }

  openForm(): void {
    this.showForm = true;
    this.editMode = false;
    this.isSubmitting = false;
    this.selectedMatiere = {  nom: '', volumeHoraire: 0, coefficient: 0 };
    this.matiereForm.reset({ nom: '', volumeHoraire: 0, coefficient: 0, panierId: null, enseignantId: null });
  }

  editMatiere(matiere: MatiereDto): void {
    this.showForm = true;
    this.editMode = true;
    this.isSubmitting = false;
    this.selectedMatiere = { ...matiere };
    this.matiereForm.patchValue(matiere);
  }

  onSubmit(): void {
    console.log('Form valid:', this.matiereForm.valid);
    console.log('Form value:', this.matiereForm.value);
    console.log('Form errors:', this.matiereForm.errors);
    if (this.matiereForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      const matiere: MatiereDto = { ...this.selectedMatiere, ...this.matiereForm.value };
      console.log('Matiere to send:', matiere);
      if (this.editMode && this.selectedMatiere.id) {
        this.matiereService.updateMatiere(matiere).subscribe({
          next: (response) => {
            console.log('Update response:', response);
            this.loadMatieres();
            this.cancelForm();
            alert('Subject updated successfully!');
          },
          error: (err: HttpErrorResponse) => {
            console.error('Update error:', err.status, err.statusText, err.error);
            alert('Failed to update subject: ' + err.message);
            this.isSubmitting = false;
          },
          complete: () => {
            this.isSubmitting = false;
          }
        });
      } else {
        this.matiereService.createMatiere(matiere).subscribe({
          next: (response) => {
            console.log('Create response:', response);
            this.loadMatieres();
            this.cancelForm();
            alert('Subject created successfully!');
          },
          error: (err: HttpErrorResponse) => {
            console.error('Create error:', err.status, err.statusText, err.error);
            alert('Failed to create subject: ' + err.message);
            this.isSubmitting = false;
          },
          complete: () => {
            this.isSubmitting = false;
          }
        });
      }
    } else {
      console.log('Form invalid, errors:', this.matiereForm.errors);
      alert('Please fill all required fields correctly.');
    }
  }

  deleteMatiere(id: number | undefined): void {
    if (id && confirm('Are you sure you want to delete this subject?')) {
      this.matiereService.deleteMatiere(id).subscribe({
        next: () => {
          console.log('Subject deleted:', id);
          this.loadMatieres();
          alert('Subject deleted successfully!');
        },
        error: (err: HttpErrorResponse) => {
          console.error('Error deleting subject:', err.status, err.statusText, err.error);
          alert('Failed to delete subject: ' + err.message);
        }
      });
    }
  }

  cancelForm(): void {
    this.showForm = false;
    this.editMode = false;
    this.isSubmitting = false;
    this.selectedMatiere = { id: 0, nom: '', volumeHoraire: 0, coefficient: 0 };
    this.matiereForm.reset({ nom: '', volumeHoraire: 0, coefficient: 0, panierId: null, enseignantId: null });
  }
}