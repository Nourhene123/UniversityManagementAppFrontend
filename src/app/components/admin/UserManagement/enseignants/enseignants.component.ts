// src/app/UserManagement/enseignants/enseignants.component.ts
import { Component, OnInit, ViewChild, Input, Output, EventEmitter } from '@angular/core';
import { NgForm } from '@angular/forms';
import { MatTableDataSource, MatTable } from '@angular/material/table';
import { Observable } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { EnseignantDto } from 'src/app/models/EnseignantDto';
import { EnseignantService } from 'src/app/Services/EnseignantService/enseignant.service';
import { Router } from '@angular/router';
import { TokenService } from 'src/app/Services/token.service';
import { ChatService } from 'src/app/Services/ChatService';

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
  isSubmitting: boolean = false;

  @ViewChild(MatTable) table!: MatTable<EnseignantDto>;
  @ViewChild('enseignantForm') enseignantForm!: NgForm;

  @Input() showAddFormOnly: boolean = false;
  @Output() enseignantAdded = new EventEmitter<EnseignantDto>();

  constructor(
    private enseignantService: EnseignantService,
    private tokenService: TokenService,
    private router: Router,
    private snackBar: MatSnackBar,
    private chatService: ChatService
  ) {}

  ngOnInit() {
    const user = this.tokenService.user;
    if (!this.tokenService.token || !user || user.role.toLowerCase() !== 'administrateur') {
      this.errorMessage = 'Accès refusé. Privilèges d\'administrateur requis.';
      this.snackBar.open(this.errorMessage, 'Fermer', { duration: 3000 });
      this.router.navigate(['/login']);
      return;
    }
    if (!this.showAddFormOnly) {
      this.loadEnseignants();
    }
  }

  loadEnseignants() {
    this.enseignants$.subscribe({
      next: (data) => {
        this.dataSource.data = data ? data.filter(e => e.role === 'Enseignant') : [];
        this.table?.renderRows();
      },
      error: (error) => {
        this.errorMessage = error.message || 'Erreur lors du chargement des enseignants.';
        this.snackBar.open(this.errorMessage, 'Fermer', { duration: 3000 });
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
    setTimeout(() => {
      this.enseignantForm?.reset();
      this.selectedEnseignant = { id: 0, nom: '', prenom: '', email: '', password: '', role: 'Enseignant', departement: '' };
      this.editMode = false;
      this.errorMessage = '';
      this.successMessage = '';
      this.isSubmitting = false;
    }, 0);
  }

  editEnseignant(enseignant: EnseignantDto) {
    this.selectedEnseignant = { ...enseignant, password: '' };
    this.editMode = true;
    this.showForm = true;
    this.errorMessage = '';
    this.successMessage = '';
  }

  onSubmit(formValue: any) {
    if (!this.enseignantForm.valid || this.isSubmitting) {
      this.errorMessage = 'Veuillez remplir correctement tous les champs requis.';
      this.snackBar.open(this.errorMessage, 'Fermer', { duration: 3000 });
      return;
    }

    if (!this.tokenService.token) {
      this.errorMessage = 'Veuillez vous connecter en tant qu\'administrateur d\'abord.';
      this.snackBar.open(this.errorMessage, 'Fermer', { duration: 3000 });
      this.router.navigate(['/login']);
      return;
    }

    const enseignant: EnseignantDto = {
      nom: formValue.nom,
      prenom: formValue.prenom,
      email: formValue.email,
      password: formValue.password || undefined,
      role: 'Enseignant',
      departement: formValue.departement || ''
    };

    if (this.editMode && this.selectedEnseignant.id) {
      enseignant.id = this.selectedEnseignant.id;
    }

    this.isSubmitting = true;
    const operation = this.editMode && enseignant.id
      ? this.enseignantService.updateEnseignant(enseignant.id, enseignant)
      : this.enseignantService.createEnseignant(enseignant);

    operation.subscribe({
      next: (response) => {
        this.successMessage = `Enseignant ${this.editMode ? 'mis à jour' : 'créé'} avec succès !`;
        this.errorMessage = '';
        this.snackBar.open(this.successMessage, 'Fermer', { duration: 3000 });
        if (!this.editMode) {
          this.enseignantAdded.emit(response); // Emit server response with real ID
          this.chatService.sendEnseignant(response); // Notify via ChatService
        }
        if (!this.showAddFormOnly) {
          this.loadEnseignants();
        }
        this.cancelForm();
      },
      error: (error) => {
        this.errorMessage = error.error?.error || error.message || `Échec de la ${this.editMode ? 'mise à jour' : 'création'} de l'enseignant.`;
        this.snackBar.open(this.errorMessage, 'Fermer', { duration: 3000 });
        this.isSubmitting = false;
      },
      complete: () => {
        this.isSubmitting = false;
      }
    });
  }

  deleteEnseignant(id: number) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet enseignant ?')) {
      this.enseignantService.deleteEnseignant(id).subscribe({
        next: () => {
          this.successMessage = 'Enseignant supprimé avec succès !';
          this.errorMessage = '';
          this.snackBar.open(this.successMessage, 'Fermer', { duration: 3000 });
          this.loadEnseignants();
        },
        error: (error) => {
          this.errorMessage = error.error?.error || error.message || 'Échec de la suppression de l\'enseignant.';
          this.snackBar.open(this.errorMessage, 'Fermer', { duration: 3000 });
        }
      });
    }
  }
}