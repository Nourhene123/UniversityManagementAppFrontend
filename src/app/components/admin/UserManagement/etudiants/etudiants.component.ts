import { Component, OnInit, ViewChild, Input, Output, EventEmitter } from '@angular/core';
import { Observable, of } from 'rxjs';
import { MatTableDataSource, MatTable } from '@angular/material/table';
import { NgForm } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { EtudiantDto } from 'src/app/models/EtudiantDto';
import { EtudiantService } from 'src/app/Services/EtudiantService/etudiant.service';
import { TokenService } from 'src/app/Services/token.service';
import { Router } from '@angular/router';
import { ChatService } from 'src/app/Services/ChatService';
import { AffectationDialogComponent } from '../../parcours/parcour/affectation-dialog/affectation-dialog.component';

@Component({
  selector: 'app-etudiants',
  templateUrl: './etudiants.component.html',
  styleUrls: ['./etudiants.component.css']
})
export class EtudiantsComponent implements OnInit {
  etudiants$: Observable<EtudiantDto[] | null> = this.etudiantService.getAllEtudiants();
  dataSource = new MatTableDataSource<EtudiantDto>();
  displayedColumns: string[] = ['select', 'id', 'nom', 'prenom', 'email', 'numeroInscription', 'actions'];
  showForm: boolean = false;
  editMode: boolean = false;
  isSubmitting: boolean = false;
  selectedEtudiant: EtudiantDto = { id: 0, nom: '', prenom: '', email: '', password: '', role: 'Etudiant', numeroInscription: '', parcourId: null };
  selectedEtudiantIds: number[] = [];
  errorMessage: string = '';
  successMessage: string = '';

  @ViewChild(MatTable) table!: MatTable<EtudiantDto>;
  @ViewChild('etudiantForm') etudiantForm!: NgForm;

  @Input() showAddFormOnly: boolean = false; // Control whether to show only the add form
  @Output() etudiantAdded = new EventEmitter<EtudiantDto>(); // Emit when an etudiant is added

  constructor(
    private etudiantService: EtudiantService,
    private tokenService: TokenService,
    private router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private chatService: ChatService
  ) {}

  ngOnInit() {
    const user = this.tokenService.user;
    console.log('User:', user);
    console.log('Token:', localStorage.getItem('token'));
    if (!this.showAddFormOnly) {
      if (!this.tokenService.token || !user || user.role.toLowerCase() !== 'administrateur') {
        this.errorMessage = 'Accès refusé. Privilèges d\'administrateur requis.';
        this.snackBar.open(this.errorMessage, 'Fermer', { duration: 3000 });
        this.router.navigate(['/login']);
        return;
      }
      this.loadEtudiants();
    }
  }

  loadEtudiants() {
    this.etudiants$.subscribe({
      next: (data) => {
        this.dataSource.data = data ? data.filter(e => e.role === 'Etudiant') : [];
        console.log('Étudiants chargés:', this.dataSource.data);
        this.table?.renderRows();
      },
      error: (error) => {
        console.error('Erreur lors du chargement des étudiants:', error);
        this.errorMessage = error.message || 'Erreur lors du chargement des étudiants.';
        this.snackBar.open(this.errorMessage, 'Fermer', { duration: 3000 });
        this.successMessage = '';
      }
    });
  }

  openForm() {
    this.selectedEtudiant = { id: 0, nom: '', prenom: '', email: '', password: '', role: 'Etudiant', numeroInscription: '', parcourId: null };
    this.editMode = false;
    this.showForm = true;
    this.errorMessage = '';
    this.successMessage = '';
  }

  cancelForm() {
    this.showForm = false;
    setTimeout(() => {
      this.etudiantForm?.reset();
      this.selectedEtudiant = { id: 0, nom: '', prenom: '', email: '', password: '', role: 'Etudiant', numeroInscription: '', parcourId: null };
      this.editMode = false;
      this.errorMessage = '';
      this.successMessage = '';
      this.isSubmitting = false;
    }, 0);
  }

  editEtudiant(etudiant: EtudiantDto) {
    this.selectedEtudiant = { ...etudiant, password: '' }; // Do not prefill password
    this.editMode = true;
    this.showForm = true;
    this.errorMessage = '';
    this.successMessage = '';
  }

  onSubmit(formValue: any, saveAndNew: boolean = false) {
    if (!this.etudiantForm.valid || this.isSubmitting) {
      this.errorMessage = 'Veuillez remplir correctement tous les champs requis.';
      console.warn('Formulaire invalide:', this.etudiantForm.value);
      this.snackBar.open(this.errorMessage, 'Fermer', { duration: 3000 });
      return;
    }

    if (!this.tokenService.token) {
      this.errorMessage = 'Veuillez vous connecter en tant qu\'administrateur d\'abord.';
      this.snackBar.open(this.errorMessage, 'Fermer', { duration: 3000 });
      this.router.navigate(['/login']);
      return;
    }

    const etudiant: EtudiantDto = {
      nom: formValue.nom,
      prenom: formValue.prenom,
      email: formValue.email,
      password: formValue.password || undefined,
      role: 'Etudiant',
      numeroInscription: formValue.numeroInscription,
      parcourId: formValue.parcourId || null
    };

    if (this.editMode && this.selectedEtudiant.id) {
      etudiant.id = this.selectedEtudiant.id;
    }

    console.log('Envoi des données:', JSON.stringify(etudiant, null, 2));

    this.isSubmitting = true;
    const operation = this.editMode && etudiant.id
      ? this.etudiantService.updateEtudiant(etudiant.id, etudiant)
      : this.etudiantService.createEtudiant(etudiant);

    operation.subscribe({
      next: (response) => {
        this.successMessage = `Étudiant ${this.editMode ? 'mis à jour' : 'créé'} avec succès !`;
        this.errorMessage = '';
        this.snackBar.open(this.successMessage, 'Fermer', { duration: 3000 });
        if (!this.editMode) {
          this.etudiantAdded.emit({ ...etudiant, id: response.id }); // Emit new etudiant
          this.chatService.sendEtudiant({ ...etudiant, id: response.id }); // Notify via ChatService
        }
        if (!this.showAddFormOnly) {
          this.loadEtudiants();
        }
        
        if (saveAndNew && !this.editMode) {
          this.resetFormForNew();
        } else {
          this.cancelForm();
        }
      },
      error: (error) => {
        console.error(`Erreur de ${this.editMode ? 'mise à jour' : 'création'}:`, error);
        this.errorMessage = error.error?.error || error.message || `Échec de la ${this.editMode ? 'mise à jour' : 'création'} de l'étudiant.`;
        this.snackBar.open(this.errorMessage, 'Fermer', { duration: 3000 });
        this.isSubmitting = false;
      },
      complete: () => {
        this.isSubmitting = false;
      }
    });
  }

  resetFormForNew() {
    this.selectedEtudiant = { id: 0, nom: '', prenom: '', email: '', password: '', role: 'Etudiant', numeroInscription: '', parcourId: null };
    this.editMode = false;
    this.errorMessage = '';
    this.successMessage = '';
    this.isSubmitting = false;
    
    setTimeout(() => {
      this.etudiantForm?.resetForm();
    }, 0);
    
    this.snackBar.open('Prêt pour l\'entrée suivante !', 'OK', { duration: 2000 });
  }

  deleteEtudiant(id: number) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet étudiant ?')) {
      this.etudiantService.deleteEtudiant(id).subscribe({
        next: () => {
          this.successMessage = 'Étudiant supprimé avec succès !';
          this.errorMessage = '';
          this.snackBar.open(this.successMessage, 'Fermer', { duration: 3000 });
          this.loadEtudiants();
          this.selectedEtudiantIds = this.selectedEtudiantIds.filter(selectedId => selectedId !== id);
        },
        error: (error) => {
          console.error('Erreur de suppression:', error);
          this.errorMessage = error.error?.error || error.message || 'Échec de la suppression de l\'étudiant.';
          this.snackBar.open(this.errorMessage, 'Fermer', { duration: 3000 });
        }
      });
    }
  }

  toggleSelection(id: number, checked: boolean) {
    if (checked) {
      this.selectedEtudiantIds.push(id);
    } else {
      this.selectedEtudiantIds = this.selectedEtudiantIds.filter(selectedId => selectedId !== id);
    }
  }

  isAllSelected(): boolean {
    return this.dataSource.data.length > 0 && this.dataSource.data.every(e => this.selectedEtudiantIds.includes(e.id!));
  }

  toggleAll(checked: boolean) {
    if (checked) {
      this.selectedEtudiantIds = this.dataSource.data.map(e => e.id!).filter(id => id !== undefined);
    } else {
      this.selectedEtudiantIds = [];
    }
  }

  openAffectationDialog() {
    const dialogRef = this.dialog.open(AffectationDialogComponent, {
      width: '500px',
      data: { etudiantIds: this.selectedEtudiantIds }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadEtudiants();
        this.selectedEtudiantIds = [];
      }
    });
  }
}