// panier.component.ts
import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { NgForm } from '@angular/forms';
import { PanierDto } from 'src/app/models/PanierDto';
import { PanierService } from 'src/app/Services/PanierService/panier.service';

@Component({
  selector: 'app-panier',
  templateUrl: './panier.component.html',
  styleUrls: ['./panier.component.css']
})
export class PanierComponent implements OnInit {
  displayedColumns: string[] = ['id', 'nom', 'coefficientTotal', 'semestre', 'parcourId', 'matiereIds', 'actions'];
  dataSource = new MatTableDataSource<PanierDto>([]);
  showForm = false;
  editMode = false;
  newPanier: PanierDto = {
    nom: '',
    coefficientTotal: 0,
    semestre: '',
    parcourId: 0,
    matiereIds: []
  };
  matiereIdsString = '';

  constructor(private panierService: PanierService) {}

  ngOnInit(): void {
    this.loadPaniers();
  }

  loadPaniers(): void {
    this.panierService.getAllPaniers().subscribe({
      next: (paniers) => {
        this.dataSource.data = paniers;
      },
      error: (err) => {
        console.error('Error fetching paniers:', err);
      }
    });
  }

  openForm(): void {
    this.showForm = true;
    this.editMode = false;
    this.resetForm();
  }

  cancelForm(): void {
    this.showForm = false;
    this.resetForm();
  }

  onSubmit(formValue: any): void {
    const panier: PanierDto = {
      id: this.editMode ? this.newPanier.id : undefined,
      nom: formValue.nom,
      coefficientTotal: formValue.coefficientTotal,
      semestre: formValue.semestre,
      parcourId: formValue.parcourId,
      matiereIds: this.newPanier.matiereIds
    };

    if (this.editMode) {
      // Update logic (you may need to add an updatePanier method in PanierService)
      console.log('Update Panier:', panier);
      // Call update API if implemented
    } else {
      this.panierService.createPanier(panier).subscribe({
        next: (savedPanier) => {
          this.dataSource.data = [...this.dataSource.data, savedPanier];
          this.cancelForm();
        },
        error: (err) => {
          console.error('Error creating panier:', err);
        }
      });
    }
  }

  editPanier(panier: PanierDto): void {
    this.newPanier = { ...panier };
    this.matiereIdsString = panier.matiereIds ? panier.matiereIds.join(', ') : '';
    this.showForm = true;
    this.editMode = true;
  }

  deletePanier(id: number): void {
    this.panierService.deletePanier(id).subscribe({
      next: () => {
        this.dataSource.data = this.dataSource.data.filter(p => p.id !== id);
      },
      error: (err) => {
        console.error('Error deleting panier:', err);
      }
    });
  }

  updateMatiereIds(value: string): void {
    this.matiereIdsString = value;
    this.newPanier.matiereIds = value
      .split(',')
      .map(id => parseInt(id.trim(), 10))
      .filter(id => !isNaN(id));
  }

  resetForm(): void {
    this.newPanier = {
      nom: '',
      coefficientTotal: 0,
      semestre: '',
      parcourId: 0,
      matiereIds: []
    };
    this.matiereIdsString = '';
  }
}