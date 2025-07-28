import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { PanierService } from 'src/app/Services/PanierService/panier.service';
import { ParcourService } from 'src/app/Services/ParcourService/parcour.service';
import { PanierDto } from 'src/app/models/PanierDto';
import { ParcourDto } from 'src/app/models/ParcourDto';
import { AffectationDialogComponent } from './affectation-dialog/affectation-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

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
  newParcour: ParcourDto = { nom: '', annee: '', libelle: '', etudiantIds: [], panierIds: [] }; // Consistent with interface
  paniers: PanierDto[] = [];

  constructor(
    private parcourService: ParcourService,
    private panierService: PanierService,
    public dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

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
        this.snackBar.open('Failed to load Parcours: ' + (err.error?.message || err.statusText || 'Unknown error'), 'Close', {
          duration: 5000,
        });
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
        this.snackBar.open('Failed to load Paniers: ' + (err.error?.message || err.statusText || 'Unknown error'), 'Close', {
          duration: 5000,
        });
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
    this.newParcour = { nom: '', annee: '', libelle: '', etudiantIds: [], panierIds: [] };
  }

  cancelForm() {
    this.showForm = false;
  }

  onSubmit(formValue: any) {
    const parcour: ParcourDto = {
      id: this.editMode ? this.newParcour.id : undefined,
      nom: formValue.nom,
      annee: formValue.annee,
      libelle: formValue.libelle,
      etudiantIds: formValue.etudiantIds || [], // Use array for consistency
      panierIds: formValue.panierIds || []
    };
    const serviceCall = this.editMode
      ? this.parcourService.updateParcour(parcour)
      : this.parcourService.createParcour(parcour);

    serviceCall.subscribe({
      next: () => {
        this.loadParcours();
        this.showForm = false;
        this.snackBar.open(`Parcour ${this.editMode ? 'updated' : 'created'} successfully!`, 'Close', {
          duration: 3000,
        });
      },
      error: (err) => {
        console.error(`${this.editMode ? 'Update' : 'Create'} error:`, err);
        this.snackBar.open(`Failed to ${this.editMode ? 'update' : 'create'} Parcour: ${err.error?.message || err.statusText || 'Unknown error'} (Status: ${err.status})`, 'Close', {
          duration: 5000,
        });
      }
    });
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
        this.snackBar.open('Parcour deleted successfully!', 'Close', {
          duration: 3000,
        });
      },
      error: (err) => {
        console.error('Delete error:', err);
        this.snackBar.open(`Failed to delete Parcour: ${err.error?.message || err.statusText || 'Unknown error'} (Status: ${err.status})`, 'Close', {
          duration: 5000,
        });
      }
    });
  }

  openAffectationDialog(parcourId: number) {
    const dialogRef = this.dialog.open(AffectationDialogComponent, {
      width: '400px',
      data: { parcourId }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.success) {
        this.loadParcours(); // Refresh data on successful assignment
        this.snackBar.open('Students assigned successfully!', 'Close', {
          duration: 3000,
        });
      } else if (result?.error) {
        this.snackBar.open(`Failed to assign students: ${result.error.message || 'Unknown error'}`, 'Close', {
          duration: 5000,
        });
      }
    });
  }
}