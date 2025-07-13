// src/app/components/admin/UserManagement/enseignants/enseignants.component.ts
import { Component, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { MatTableDataSource, MatTable } from '@angular/material/table';
import { Observable } from 'rxjs';
import { EnseignantDto } from 'src/app/models/EnseignantDto';
import { EnseignantService } from 'src/app/Services/EnseignantService/enseignant.service';
import { Router } from '@angular/router';
import { TokenService } from 'src/app/Services/token.service';

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
    private tokenService: TokenService,
    private router: Router
  ) {}

  ngOnInit() {
    const user = this.tokenService.user;
    if (!this.tokenService.token || !user || user.role.toLowerCase() !== 'administrateur') {
      this.errorMessage = 'Access denied. Admin privileges required.';
      this.router.navigate(['/login']);
      return;
    }
    this.loadEnseignants();
  }

  // Rest of the component remains unchanged
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
    this.selectedEnseignant = { ...enseignant, password: '' };
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

    if (!this.tokenService.token) {
      this.errorMessage = 'Please log in as an admin first';
      this.router.navigate(['/login']);
      return;
    }

    const enseignant: EnseignantDto = {
      id: this.editMode ? this.selectedEnseignant.id : 0,
      nom: formValue.nom,
      prenom: formValue.prenom,
      email: formValue.email,
      password: formValue.password || undefined,
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