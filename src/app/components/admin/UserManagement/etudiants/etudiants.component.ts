
import { Component, OnInit, ViewChild } from '@angular/core';
import { Observable, of } from 'rxjs';
import { MatTableDataSource } from '@angular/material/table';
import { MatTable } from '@angular/material/table';
import { NgForm } from '@angular/forms';
import { EtudiantDto } from 'src/app/models/EtudiantDto';
import { EtudiantService } from 'src/app/Services/EtudiantService/etudiant.service';
import { MatDialog } from '@angular/material/dialog';
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
  selectedEtudiant: EtudiantDto = { id: 0, nom: '', prenom: '', email: '', password: '', role: 'Etudiant', numeroInscription: '', parcourId: null };
  selectedEtudiantIds: number[] = [];

  @ViewChild(MatTable) table!: MatTable<EtudiantDto>;
  @ViewChild('etudiantForm') etudiantForm!: NgForm;

  constructor(
    private etudiantService: EtudiantService,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.etudiants$.subscribe(data => {
      if (data) {
        this.dataSource.data = data.filter(e => e.role === 'Etudiant');
      } else {
        this.dataSource.data = [];
      }
    });
  }

  editEtudiant(etudiant: EtudiantDto) {
    this.selectedEtudiant = { ...etudiant };
    this.editMode = true;
    this.showForm = true;
  }

  createEtudiant(etudiant: EtudiantDto) {
    this.etudiantService.createEtudiant(etudiant).subscribe({
      next: () => {
        this.etudiants$ = this.etudiantService.getAllEtudiants();
        this.etudiants$.subscribe(data => {
          if (data) this.dataSource.data = data.filter(e => e.role === 'Etudiant');
        });
        this.showForm = false;
        this.etudiantForm.reset();
        this.selectedEtudiant = { id: 0, nom: '', prenom: '', email: '', password: '', role: 'Etudiant', numeroInscription: '', parcourId: null };
        this.editMode = false;
      },
      error: (err) => console.error('Error creating etudiant:', err)
    });
  }

  updateEtudiant(etudiant: EtudiantDto) {
    if (etudiant.id) {
      this.etudiantService.updateEtudiant(etudiant.id, etudiant).subscribe({
        next: () => {
          this.etudiants$ = this.etudiantService.getAllEtudiants();
          this.etudiants$.subscribe(data => {
            if (data) this.dataSource.data = data.filter(e => e.role === 'Etudiant');
          });
          this.showForm = false;
          this.etudiantForm.reset();
          this.selectedEtudiant = { id: 0, nom: '', prenom: '', email: '', password: '', role: 'Etudiant', numeroInscription: '', parcourId: null };
          this.editMode = false;
        },
        error: (err) => console.error('Error updating etudiant:', err)
      });
    }
  }

  deleteEtudiant(id: number) {
    this.etudiantService.deleteEtudiant(id).subscribe({
      next: () => {
        this.etudiants$ = this.etudiantService.getAllEtudiants();
        this.etudiants$.subscribe(data => {
          if (data) this.dataSource.data = data.filter(e => e.role === 'Etudiant');
        });
        this.selectedEtudiantIds = this.selectedEtudiantIds.filter(selectedId => selectedId !== id);
      },
      error: (err) => console.error('Error deleting etudiant:', err)
    });
  }

  onSubmit(formValue: any) {
    const etudiant: EtudiantDto = {
      id: this.editMode ? this.selectedEtudiant.id : 0,
      nom: formValue.nom || this.selectedEtudiant.nom,
      prenom: formValue.prenom || this.selectedEtudiant.prenom,
      email: formValue.email || this.selectedEtudiant.email,
      password: formValue.password || this.selectedEtudiant.password,
      role: 'Etudiant',
      numeroInscription: formValue.numeroInscription || this.selectedEtudiant.numeroInscription,
      parcourId: formValue.parcourId || this.selectedEtudiant.parcourId || null
    };
    if (this.editMode && etudiant.id) {
      this.updateEtudiant(etudiant);
    } else {
      this.createEtudiant(etudiant);
    }
  }

  openForm() {
    this.selectedEtudiant = { id: 0, nom: '', prenom: '', email: '', password: '', role: 'Etudiant', numeroInscription: '', parcourId: null };
    this.editMode = false;
    this.showForm = true;
  }

  cancelForm() {
    this.showForm = false;
    this.etudiantForm.reset();
    this.selectedEtudiant = { id: 0, nom: '', prenom: '', email: '', password: '', role: 'Etudiant', numeroInscription: '', parcourId: null };
    this.editMode = false;
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
      data: { etudiantIds: this.selectedEtudiantIds } // Remove hardcoded parcourId
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.etudiants$ = this.etudiantService.getAllEtudiants();
        this.etudiants$.subscribe(data => {
          if (data) this.dataSource.data = data.filter(e => e.role === 'Etudiant');
        });
        this.selectedEtudiantIds = [];
      }
    });
  }
}