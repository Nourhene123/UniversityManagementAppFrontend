
import { Component, OnInit, ViewChild } from '@angular/core';
import { Observable, of } from 'rxjs';
import { MatTableDataSource } from '@angular/material/table';
import { MatTable } from '@angular/material/table';
import { NgForm } from '@angular/forms';
import { EnseignantDto } from 'src/app/models/EnseignantDto';
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

  @ViewChild(MatTable) table!: MatTable<EnseignantDto>;
  @ViewChild('enseignantForm') enseignantForm!: NgForm;

  constructor(private enseignantService: EnseignantService) {}

  ngOnInit() {
    this.enseignants$.subscribe(data => {
      if (data) {
        this.dataSource.data = data.filter(e => e.role === 'Enseignant');
      } else {
        this.dataSource.data = [];
      }
    });
  }

  editEnseignant(id: number) {
    this.enseignantService.getEnseignantById(id).subscribe(enseignant => {
      this.selectedEnseignant = { ...enseignant };
      this.editMode = true;
      this.showForm = true;
    });
  }

  createEnseignant(enseignant: EnseignantDto) {
    this.enseignantService.createEnseignant(enseignant).subscribe(() => {
      this.enseignants$ = this.enseignantService.getAllEnseignants();
      this.enseignants$.subscribe(data => {
        if (data) this.dataSource.data = data.filter(e => e.role === 'Enseignant');
      });
      this.showForm = false;
      this.enseignantForm.reset();
      this.selectedEnseignant = { id: 0, nom: '', prenom: '', email: '', password: '', role: 'Enseignant', departement: '' };
      this.editMode = false;
    });
  }

  updateEnseignant(enseignant: EnseignantDto) {
    if (enseignant.id) {
      this.enseignantService.updateEnseignant(enseignant.id, enseignant).subscribe(() => {
        this.enseignants$ = this.enseignantService.getAllEnseignants();
        this.enseignants$.subscribe(data => {
          if (data) this.dataSource.data = data.filter(e => e.role === 'Enseignant');
        });
        this.showForm = false;
        this.enseignantForm.reset();
        this.selectedEnseignant = { id: 0, nom: '', prenom: '', email: '', password: '', role: 'Enseignant', departement: '' };
        this.editMode = false;
      });
    }
  }

  deleteEnseignant(id: number) {
    this.enseignantService.deleteEnseignant(id).subscribe(() => {
      this.enseignants$ = this.enseignantService.getAllEnseignants();
      this.enseignants$.subscribe(data => {
        if (data) this.dataSource.data = data.filter(e => e.role === 'Enseignant');
      });
    });
  }

  onSubmit(formValue: any) {
    const enseignant: EnseignantDto = {
      id: this.editMode ? this.selectedEnseignant.id : 0,
      nom: formValue.nom || this.selectedEnseignant.nom,
      prenom: formValue.prenom || this.selectedEnseignant.prenom,
      email: formValue.email || this.selectedEnseignant.email,
      password: formValue.password || this.selectedEnseignant.password,
      role: 'Enseignant',
      departement: formValue.departement || this.selectedEnseignant.departement
    };
    if (this.editMode && enseignant.id) {
      this.updateEnseignant(enseignant);
    } else {
      this.createEnseignant(enseignant);
    }
  }

  openForm() {
    this.selectedEnseignant = { id: 0, nom: '', prenom: '', email: '', password: '', role: 'Enseignant', departement: '' };
    this.editMode = false;
    this.showForm = true;
  }

  cancelForm() {
    this.showForm = false;
    this.enseignantForm.reset();
    this.selectedEnseignant = { id: 0, nom: '', prenom: '', email: '', password: '', role: 'Enseignant', departement: '' };
    this.editMode = false;
  }
}