import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { PanierService } from 'src/app/Services/PanierService/panier.service';
import { ParcourService } from 'src/app/Services/ParcourService/parcour.service';
import { PanierDto } from 'src/app/models/PanierDto';
import { ParcourDto } from 'src/app/models/ParcourDto';

@Component({
  selector: 'app-parcour',
  templateUrl: './parcour.component.html',
  styleUrls: ['./parcour.component.css']
})
export class ParcourComponent implements OnInit {
 displayedColumns: string[] = ['id', 'nom', 'annee', 'libelle', 'paniers', 'actions'];
  dataSource = new MatTableDataSource<ParcourDto>();
  showForm = false;
  editMode = false;
  newParcour: ParcourDto = { nom: '', annee: '', libelle: '', etudiantId: undefined, panierIds: [] };
  paniers: PanierDto[] = [];

  constructor(private parcourService: ParcourService, private panierService: PanierService) {}

  ngOnInit() {
    this.loadParcours();
    this.loadPaniers();
  }

  loadParcours() {
    this.parcourService.getAllParcours().subscribe({
      next: (data) => {
        this.dataSource.data = data;
      },
      error: (err) => {
        console.error('Error loading parcours:', err);
        alert('Failed to load Parcours: ' + (err.error?.message || err.statusText || 'Unknown error'));
      }
    });
  }

  loadPaniers() {
    this.panierService.getAllPaniers().subscribe({
      next: (data) => {
        this.paniers = data;
      },
      error: (err) => {
        console.error('Error loading paniers:', err);
        alert('Failed to load Paniers: ' + (err.error?.message || err.statusText || 'Unknown error'));
      }
    });
  }

  getPanierNames(panierIds: number[]): string {
    if (!panierIds || panierIds.length === 0) {
      return 'None';
    }
    return this.paniers
      .filter(panier => panier.id !== undefined && panierIds.includes(panier.id))
      .map(panier => panier.nom)
      .join(', ');
  }

  openForm() {
    this.showForm = true;
    this.editMode = false;
    this.newParcour = { nom: '', annee: '', libelle: '', etudiantId: undefined, panierIds: [] };
  }

  cancelForm() {
    this.showForm = false;
  }

  onSubmit(formValue: any) {
    const parcour: ParcourDto = {
      nom: formValue.nom,
      annee: formValue.annee,
      libelle: formValue.libelle,
      etudiantId: formValue.etudiantId || null,
      panierIds: formValue.panierIds || []
    };
    if (this.editMode) {
      if (!this.newParcour.id) {
        alert('Error: Parcour ID is missing for update');
        return;
      }
      parcour.id = this.newParcour.id;
      this.parcourService.updateParcour(parcour).subscribe({
        next: () => {
          this.loadParcours();
          this.showForm = false;
        },
        error: (err) => {
          console.error('Update error:', err);
          const message = err.error?.message || err.statusText || 'Unknown error';
          alert(`Failed to update Parcour: ${message} (Status: ${err.status})`);
        }
      });
    } else {
      this.parcourService.createParcour(parcour).subscribe({
        next: () => {
          this.loadParcours();
          this.showForm = false;
        },
        error: (err) => {
          console.error('Create error:', err);
          const message = err.error?.message || err.statusText || 'Unknown error';
          alert(`Failed to create Parcour: ${message} (Status: ${err.status})`);
        }
      });
    }
  }

  editParcour(parcour: ParcourDto) {
    this.newParcour = { ...parcour };
    this.showForm = true;
    this.editMode = true;
  }

  deleteParcour(id: number) {
    this.parcourService.deleteParcour(id).subscribe({
      next: () => {
        this.loadParcours();
      },
      error: (err) => {
        console.error('Delete error:', err);
        const message = err.error?.message || err.statusText || 'Unknown error';
        alert(`Failed to delete Parcour: ${message} (Status: ${err.status})`);
      }
    });
  }
}