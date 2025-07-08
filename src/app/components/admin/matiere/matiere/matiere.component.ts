import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatiereDto } from 'src/app/models/MatiereDto';
import { MatiereService } from 'src/app/Services/MatierService/matiere.service';

@Component({
  selector: 'app-matiere',
  templateUrl: './matiere.component.html',
  styleUrls: ['./matiere.component.css']
})
export class MatiereComponent implements OnInit {
 matieres: MatiereDto[] = [];
  displayedColumns: string[] = ['id', 'nom', 'volumeHoraire', 'coefficient', 'actions'];
  matiereForm: FormGroup;
  showForm: boolean = false;
  editMode: boolean = false;
  selectedMatiere: MatiereDto = { id: 0, nom: '', volumeHoraire: 0, coefficient: 0 };

  constructor(
    private matiereService: MatiereService,
    private fb: FormBuilder
  ) {
    this.matiereForm = this.fb.group({
      nom: ['', Validators.required],
      volumeHoraire: [0, [Validators.required, Validators.min(1)]],
      coefficient: [0, [Validators.required, Validators.min(1)]]
    });
  }

  ngOnInit(): void {
    this.loadMatieres();
  }

  loadMatieres(): void {
    this.matiereService.getAllMatieres().subscribe({
      next: (data) => {
        this.matieres = data;
      },
      error: (err) => {
        console.error('Error loading subjects:', err);
        alert('Failed to load subjects.');
      }
    });
  }

  openForm(): void {
    this.showForm = true;
    this.editMode = false;
    this.selectedMatiere = { id: 0, nom: '', volumeHoraire: 0, coefficient: 0 };
    this.matiereForm.reset({ nom: '', volumeHoraire: 0, coefficient: 0 });
  }

  editMatiere(matiere: MatiereDto): void {
    this.showForm = true;
    this.editMode = true;
    this.selectedMatiere = { ...matiere };
    this.matiereForm.patchValue(matiere);
  }

  onSubmit(): void {
    if (this.matiereForm.valid) {
      const matiere: MatiereDto = { ...this.selectedMatiere, ...this.matiereForm.value };
      if (this.editMode && this.selectedMatiere.id) {
        this.matiereService.updateMatiere(matiere).subscribe({
          next: () => {
            this.loadMatieres();
            this.cancelForm();
            alert('Subject updated successfully!');
          },
          error: (err) => {
            console.error('Error updating subject:', err);
            alert('Failed to update subject.');
          }
        });
      } else {
        this.matiereService.createMatiere(matiere).subscribe({
          next: () => {
            this.loadMatieres();
            this.cancelForm();
            alert('Subject created successfully!');
          },
          error: (err) => {
            console.error('Error creating subject:', err);
            alert('Failed to create subject.');
          }
        });
      }
    }
  }

  deleteMatiere(id: number | undefined): void {
    if (id && confirm('Are you sure you want to delete this subject?')) {
      this.matiereService.deleteMatiere(id).subscribe({
        next: () => {
          this.loadMatieres();
          alert('Subject deleted successfully!');
        },
        error: (err) => {
          console.error('Error deleting subject:', err);
          alert('Failed to delete subject.');
        }
      });
    }
  }

  cancelForm(): void {
    this.showForm = false;
    this.editMode = false;
    this.selectedMatiere = { id: 0, nom: '', volumeHoraire: 0, coefficient: 0 };
    this.matiereForm.reset();
  }
}