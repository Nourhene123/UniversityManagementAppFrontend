import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { NgForm } from '@angular/forms';
import { ParcourService } from 'src/app/Services/ParcourService/parcour.service';
import { ParcourDto } from 'src/app/models/ParcourDto';

@Component({
  selector: 'app-parcour',
  templateUrl: './parcour.component.html',
  styleUrls: ['./parcour.component.css']
})
export class ParcourComponent implements OnInit {
  displayedColumns: string[] = ['id', 'nom', 'annee', 'libelle', 'actions'];
  dataSource = new MatTableDataSource<ParcourDto>();
  showForm = false;
  editMode = false;
  newParcour: ParcourDto = { id: 0, nom: '', annee: '', libelle: '', etudiantId: 0, panierIds: [] };
  panierIdsString = '';

  constructor(private parcourService: ParcourService) {}

  ngOnInit() {
    this.loadParcours();
  }

  loadParcours() {
    this.parcourService.getAllParcours().subscribe(data => {
      this.dataSource.data = data;
    });
  }

  openForm() {
    this.showForm = true;
    this.editMode = false;
    this.newParcour = { id: 0, nom: '', annee: '', libelle: '', etudiantId: 0, panierIds: [] };
    this.panierIdsString = '';
  }

  cancelForm() {
    this.showForm = false;
  }

  onSubmit(formValue: any) {
    const parcour: ParcourDto = {
      id: this.editMode ? this.newParcour.id : 0,
      nom: formValue.nom,
      annee: formValue.annee,
      libelle: formValue.libelle,
      etudiantId: formValue.etudiantId,
      panierIds: this.panierIdsString.split(',').map(id => +id.trim()).filter(id => !isNaN(id))
    };
    if (this.editMode) {
      this.parcourService.updateParcour(parcour).subscribe(() => {
        this.loadParcours();
        this.showForm = false;
      });
    } else {
      this.parcourService.createParcour(parcour).subscribe(() => {
        this.loadParcours();
        this.showForm = false;
      });
    }
  }

  editParcour(parcour: ParcourDto) {
    this.newParcour = { ...parcour };
    this.panierIdsString = parcour.panierIds ? parcour.panierIds.join(', ') : '';
    this.showForm = true;
    this.editMode = true;
  }

  deleteParcour(id: number) {
    this.parcourService.deleteParcour(id).subscribe(() => {
      this.loadParcours();
    });
  }

  updatePanierIds(value: string) {
    this.panierIdsString = value;
  }
}