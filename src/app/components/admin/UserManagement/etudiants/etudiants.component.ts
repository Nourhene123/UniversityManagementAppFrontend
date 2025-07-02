
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
  selectedEtudiant: EtudiantDto | null = null;
  showForm: boolean = false;

  @ViewChild(MatTable) table!: MatTable<EtudiantDto>;
  @ViewChild('etudiantForm') etudiantForm!: NgForm;

  constructor(private etudiantService: EtudiantService) {}

  ngOnInit() {
    this.etudiants$.subscribe(data => {
      if (data) {
        this.dataSource.data = data.filter(e => e.role === 'Etudiant'); // Filter for Etudiant role
      } else {
        this.dataSource.data = [];
      }
    });
  }

  getEtudiant(id: number) {
    this.etudiantService.getEtudiantById(id).subscribe(etudiant => {
      this.selectedEtudiant = etudiant;
      this.showForm = true;
    });
  }

  createEtudiant(etudiant: EtudiantDto) {
    this.etudiantService.createEtudiant(etudiant).subscribe(() => {
      this.etudiants$ = this.etudiantService.getAllEtudiants();
      this.etudiants$.subscribe(data => {
        if (data) this.dataSource.data = data.filter(e => e.role === 'Etudiant');
      });
      this.showForm = false;
      this.etudiantForm.reset();
    });
  }

  updateEtudiant(etudiant: EtudiantDto) {
    if (this.selectedEtudiant?.id) {
      this.etudiantService.updateEtudiant(this.selectedEtudiant.id, etudiant).subscribe(() => {
        this.etudiants$ = this.etudiantService.getAllEtudiants();
        this.etudiants$.subscribe(data => {
          if (data) this.dataSource.data = data.filter(e => e.role === 'Etudiant');
        });
        this.showForm = false;
        this.etudiantForm.reset();
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
      id: this.selectedEtudiant?.id,
      nom: formValue.nom,
      prenom: formValue.prenom,
      email: formValue.email,
      password: formValue.password,
      role: 'Etudiant',
      numeroInscription: formValue.numeroInscription
    };
    if (this.selectedEtudiant?.id) {
      this.updateEtudiant(etudiant);
    } else {
      this.createEtudiant(etudiant);
    }
  }

  openForm() {
    this.selectedEtudiant = null;
    this.showForm = true;
  }

  cancelForm() {
    this.showForm = false;
    this.etudiantForm.reset();
  }
}