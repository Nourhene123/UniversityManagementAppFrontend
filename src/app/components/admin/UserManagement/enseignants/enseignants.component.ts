// src/app/components/enseignants/enseignants.component.ts
import { Component, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { MatTableDataSource, MatTable } from '@angular/material/table';
import { Observable } from 'rxjs';
import { EnseignantDto } from 'src/app/models/EnseignantDto';
import { AuthService } from 'src/app/Services/Auth/auth.service';
import { EnseignantService } from 'src/app/Services/EnseignantService/enseignant.service';

@Component({
  selector: 'app-enseignants',
  templateUrl: './enseignants.component.html',
  styleUrls: ['./enseignants.component.css']
})
export class EnseignantsComponent implements OnInit {
  enseignants$: Observable<EnseignantDto[] | null> = this.enseignantService.getAllEnseignants();
  dataSource = new MatTableDataSource<EnseignantDto>();
  displayedColumns: string[] = ['id', 'nom', 'prenom', 'email', 'departement', 'actions'];
  showForm: boolean = false;
  editMode: boolean = false;
  selectedEnseignant: EnseignantDto = { id: 0, nom: '', prenom: '', email: '', password: '', role: 'Enseignant', departement: '' };
  errorMessage: string = '';
  successMessage: string = '';

  @ViewChild(MatTable) table!: MatTable<EnseignantDto>;
  @ViewChild('enseignantForm') enseignantForm!: NgForm;

  constructor(
    private enseignantService: EnseignantService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadEnseignants();
  }

  loadEnseignants() {
    this.enseignants$.subscribe({
      next: (data) => {
        this.dataSource.data = data ? data.filter(e => e.role === 'Enseignant') : [];
      },
      error: (error) => {
        this.errorMessage = error.message;
        this.successMessage = '';
      }
    });
  }

  openForm() {
    this.selectedEnseignant = { id: 0, nom: '', prenom: '', email: '', password: '', role: 'Enseignant', departement: '' };
    this.editMode = false;
    this.showForm = true;
    this.errorMessage = '';
    this.successMessage = '';
  }

  cancelForm() {
    this.showForm = false;
    this.enseignantForm.reset();
    this.selectedEnseignant = { id: 0, nom: '', prenom: '', email: '', password: '', role: 'Enseignant', departement: '' };
    this.editMode = false;
    this.errorMessage = '';
    this.successMessage = '';
  }

  editEnseignant(enseignant: EnseignantDto) {
    this.selectedEnseignant = { ...enseignant, password: '' }; // Clear password for security
    this.editMode = true;
    this.showForm = true;
    this.errorMessage = '';
    this.successMessage = '';
  }

  onSubmit(formValue: any) {
    if (!this.enseignantForm.valid) {
      this.errorMessage = 'Please fill out all required fields correctly';
      return;
    }

    if (!this.authService.getToken()) {
      this.errorMessage = 'Please log in as an admin first';
      return;
    }

    const enseignant: EnseignantDto = {
      id: this.editMode ? this.selectedEnseignant.id : 0,
      nom: formValue.nom,
      prenom: formValue.prenom,
      email: formValue.email,
      password: formValue.password || undefined, // Exclude password if empty in edit mode
      role: 'Enseignant',
      departement: formValue.departement
    };

    if (this.editMode && enseignant.id) {
      this.enseignantService.updateEnseignant(enseignant.id, enseignant).subscribe({
        next: () => {
          this.successMessage = 'Enseignant updated successfully!';
          this.errorMessage = '';
          this.showForm = false;
          this.enseignantForm.reset();
          this.selectedEnseignant = { id: 0, nom: '', prenom: '', email: '', password: '', role: 'Enseignant', departement: '' };
          this.editMode = false;
          this.loadEnseignants();
        },
        error: (error) => {
          this.errorMessage = error.message;
          this.successMessage = '';
        }
      });
    } else {
      this.enseignantService.createEnseignant(enseignant).subscribe({
        next: () => {
          this.successMessage = 'Enseignant created successfully!';
          this.errorMessage = '';
          this.showForm = false;
          this.enseignantForm.reset();
          this.selectedEnseignant = { id: 0, nom: '', prenom: '', email: '', password: '', role: 'Enseignant', departement: '' };
          this.loadEnseignants();
        },
        error: (error) => {
          this.errorMessage = error.message;
          this.successMessage = '';
        }
      });
    }
  }

  deleteEnseignant(id: number) {
    if (confirm('Are you sure you want to delete this enseignant?')) {
      this.enseignantService.deleteEnseignant(id).subscribe({
        next: () => {
          this.successMessage = 'Enseignant deleted successfully!';
          this.errorMessage = '';
          this.loadEnseignants();
        },
        error: (error) => {
          this.errorMessage = error.message;
          this.successMessage = '';
        }
      });
    }
  }
}