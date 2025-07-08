
import { Component, OnInit, ViewChild } from '@angular/core';
import { Observable, of } from 'rxjs';
import { MatTableDataSource } from '@angular/material/table';
import { MatTable } from '@angular/material/table';
import { NgForm } from '@angular/forms';
import { EtudiantDto } from 'src/app/models/EtudiantDto';
import { EtudiantService } from 'src/app/Services/EtudiantService/etudiant.service';

@Component({
  selector: 'app-etudiants',
  templateUrl: './etudiants.component.html',
  styleUrls: ['./etudiants.component.css']
})
export class EtudiantsComponent implements OnInit {
 etudiants$: Observable<EtudiantDto[] | null> = this.etudiantService.getAllEtudiants();
  dataSource = new MatTableDataSource<EtudiantDto>();
  displayedColumns: string[] = ['id', 'nom', 'prenom', 'email', 'numeroInscription', 'actions'];
  showForm: boolean = false;
  editMode: boolean = false;
  selectedEtudiant: EtudiantDto = { id: 0, nom: '', prenom: '', email: '', password: '', role: 'Etudiant', numeroInscription: '' };

  @ViewChild(MatTable) table!: MatTable<EtudiantDto>;
  @ViewChild('etudiantForm') etudiantForm!: NgForm;

  constructor(private etudiantService: EtudiantService) {}

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
    this.etudiantService.createEtudiant(etudiant).subscribe(() => {
      this.etudiants$ = this.etudiantService.getAllEtudiants();
      this.etudiants$.subscribe(data => {
        if (data) this.dataSource.data = data.filter(e => e.role === 'Etudiant');
      });
      this.showForm = false;
      this.etudiantForm.reset();
      this.selectedEtudiant = { id: 0, nom: '', prenom: '', email: '', password: '', role: 'Etudiant', numeroInscription: '' };
      this.editMode = false;
    });
  }

  updateEtudiant(etudiant: EtudiantDto) {
    if (etudiant.id) {
      this.etudiantService.updateEtudiant(etudiant.id, etudiant).subscribe(() => {
        this.etudiants$ = this.etudiantService.getAllEtudiants();
        this.etudiants$.subscribe(data => {
          if (data) this.dataSource.data = data.filter(e => e.role === 'Etudiant');
        });
        this.showForm = false;
        this.etudiantForm.reset();
        this.selectedEtudiant = { id: 0, nom: '', prenom: '', email: '', password: '', role: 'Etudiant', numeroInscription: '' };
        this.editMode = false;
      });
    }
  }

  deleteEtudiant(id: number) {
    this.etudiantService.deleteEtudiant(id).subscribe(() => {
      this.etudiants$ = this.etudiantService.getAllEtudiants();
      this.etudiants$.subscribe(data => {
        if (data) this.dataSource.data = data.filter(e => e.role === 'Etudiant');
      });
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
      numeroInscription: formValue.numeroInscription || this.selectedEtudiant.numeroInscription
    };
    if (this.editMode && etudiant.id) {
      this.updateEtudiant(etudiant);
    } else {
      this.createEtudiant(etudiant);
    }
  }

  openForm() {
    this.selectedEtudiant = { id: 0, nom: '', prenom: '', email: '', password: '', role: 'Etudiant', numeroInscription: '' };
    this.editMode = false;
    this.showForm = true;
  }

  cancelForm() {
    this.showForm = false;
    this.etudiantForm.reset();
    this.selectedEtudiant = { id: 0, nom: '', prenom: '', email: '', password: '', role: 'Etudiant', numeroInscription: '' };
    this.editMode = false;
  }
}