import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { EtudiantDto } from 'src/app/models/EtudiantDto';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Inject } from '@angular/core';
import { ParcourDto } from 'src/app/models/ParcourDto';
import { ParcourService } from 'src/app/Services/ParcourService/parcour.service';
import { EtudiantService } from 'src/app/Services/EtudiantService/etudiant.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-affectation-dialog',
  templateUrl: './affectation-dialog.component.html',
  styleUrls: ['./affectation-dialog.component.css']
})
export class AffectationDialogComponent implements OnInit {
  parcours: ParcourDto[] = [];
  etudiants: EtudiantDto[] = [];
  selectedParcourId: number | null = null;
  selectedEtudiantIds: number[] = [];
  mode: 'assignToParcour' | 'assignParcour' = 'assignToParcour';
  isLoading: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<AffectationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { parcourId?: number; etudiantIds?: number[] },
    private parcourService: ParcourService,
    private etudiantService: EtudiantService,
    private snackBar: MatSnackBar
  ) {
    if (data.etudiantIds) {
      this.mode = 'assignParcour';
      this.selectedEtudiantIds = data.etudiantIds;
    } else if (data.parcourId) {
      this.mode = 'assignToParcour';
      this.selectedParcourId = data.parcourId;
    }
  }

  ngOnInit(): void {
    this.isLoading = true;
    if (this.mode === 'assignParcour') {
      this.loadParcours();
    } else {
      this.loadEtudiants();
    }
  }

  loadParcours(): void {
    this.parcourService.getAllParcours().subscribe({
      next: (data) => {
        this.parcours = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.snackBar.open('Erreur lors du chargement des parcours', 'Fermer', { duration: 3000 });
        console.error('Error fetching parcours:', err);
      }
    });
  }

  loadEtudiants(): void {
    this.etudiantService.getAllEtudiants().subscribe({
      next: (data) => {
        this.etudiants = data.filter(e => e.role === 'Etudiant');
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.snackBar.open('Erreur lors du chargement des étudiants', 'Fermer', { duration: 3000 });
        console.error('Error fetching students:', err);
      }
    });
  }

 save(): void {
    if (this.isLoading) return;
    this.isLoading = true;

    console.log('Mode:', this.mode);
    console.log('Selected Parcour ID:', this.selectedParcourId);
    console.log('Selected Etudiant IDs:', this.selectedEtudiantIds);

    if (this.mode === 'assignParcour' || this.mode === 'assignToParcour') {
      if (!this.selectedParcourId || this.selectedEtudiantIds.length === 0) {
        this.isLoading = false;
        this.snackBar.open('Veuillez sélectionner un parcours et au moins un étudiant', 'Fermer', { duration: 3000 });
        return;
      }
      this.parcourService.assignManyEtudiantsToParcour(this.selectedEtudiantIds, this.selectedParcourId).subscribe({
        next: (response: EtudiantDto[]) => {
          this.isLoading = false;
          console.log('Assignment response:', response);
          const allAssigned = response.every(student => student.parcourId === this.selectedParcourId);
          if (allAssigned) {
            this.snackBar.open('Étudiants assignés avec succès', 'Fermer', { duration: 3000 });
            this.dialogRef.close(true);
          } else {
            this.snackBar.open('Erreur: Certains étudiants n\'ont pas été assignés correctement', 'Fermer', { duration: 3000 });
            console.error('Failed assignments:', response.filter(student => student.parcourId !== this.selectedParcourId));
          }
        },
        error: (err) => {
          this.isLoading = false;
          console.error('Assignment error:', err);
          this.snackBar.open('Erreur lors de l\'affectation des étudiants: ' + (err.error?.message || err.message), 'Fermer', { duration: 3000 });
        }
      });
    }
  }

  cancel(): void {
    this.dialogRef.close();
  }
}