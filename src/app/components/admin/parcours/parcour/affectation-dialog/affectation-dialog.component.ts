import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { EtudiantDto } from 'src/app/models/EtudiantDto';
import { ParcourDto } from 'src/app/models/ParcourDto';
import { ParcourService } from 'src/app/Services/ParcourService/parcour.service';
import { EtudiantService } from 'src/app/Services/EtudiantService/etudiant.service';

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
    @Inject(MAT_DIALOG_DATA) public data: { 
      parcourId?: number; 
      etudiantIds?: number[]; 
      parcoursAvailable?: ParcourDto[];
      enforceAssignment?: boolean 
    },
    private parcourService: ParcourService,
    private etudiantService: EtudiantService,
    private snackBar: MatSnackBar
  ) {
    if (this.data.etudiantIds && !this.data.parcourId) {
      this.mode = 'assignParcour';
      this.selectedEtudiantIds = this.data.etudiantIds;
    } else if (this.data.parcourId) {
      this.mode = 'assignToParcour';
      this.selectedParcourId = this.data.parcourId;
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
    if (this.data.parcoursAvailable && this.data.parcoursAvailable.length > 0) {
      this.parcours = this.data.parcoursAvailable;
      this.isLoading = false;
      console.log('Loaded parcours from data.parcoursAvailable:', this.parcours); // Debug log
    } else {
      this.parcourService.getAllParcours().subscribe({
        next: (data) => {
          this.parcours = data;
          this.isLoading = false;
          console.log('Loaded parcours from ParcourService:', this.parcours); // Debug log
        },
        error: (err) => {
          this.isLoading = false;
          this.snackBar.open('Erreur lors du chargement des parcours', 'Fermer', { duration: 3000 });
          console.error('Error fetching parcours:', err);
        }
      });
    }
  }

  loadEtudiants(): void {
    this.etudiantService.getAllEtudiants().subscribe({
      next: (data) => {
        this.etudiants = data.filter(e => e.role === 'Etudiant' && this.data.etudiantIds?.includes(e.id!));
        this.isLoading = false;
        console.log('Loaded etudiants:', this.etudiants); // Debug log
      },
      error: (err) => {
        this.isLoading = false;
        this.snackBar.open('Erreur lors du chargement des étudiants', 'Fermer', { duration: 3000 });
        console.error('Error fetching students:', err);
      }
    });
  }

  getParcourName(parcourId: number | null): string {
    if (!parcourId) return 'Aucun parcours sélectionné';
    const parcour = this.parcours.find(p => p.id === parcourId);
    return parcour ? `${parcour.nom} (${parcour.annee} - ${parcour.libelle})` : 'Inconnu';
  }

  save(): void {
    if (this.isLoading) return;
    this.isLoading = true;

    if (!this.selectedParcourId || this.selectedEtudiantIds.length === 0) {
      this.isLoading = false;
      this.snackBar.open('Veuillez sélectionner un parcours et au moins un étudiant', 'Fermer', { duration: 3000 });
      return;
    }

    this.parcourService.assignManyEtudiantsToParcour(this.selectedEtudiantIds, this.selectedParcourId).subscribe({
      next: (result: { success: EtudiantDto[], failed: EtudiantDto[] }) => {
        this.isLoading = false;
        console.log('Backend response from assignManyEtudiantsToParcour:', result); // Debug log
        const successCount = result.success.length;
        const failedCount = result.failed.length;

        if (failedCount > 0) {
          console.warn('Certains étudiants n’ont pas été assignés:', result.failed); // Debug log
          this.snackBar.open(`${failedCount} étudiant(s) non assigné(s)`, 'Fermer', { duration: 3000 });
        } else {
          this.snackBar.open('Tous les étudiants ont été assignés avec succès.', 'Fermer', { duration: 3000 });
        }

        // Ensure success array includes parcourId
        const validatedResult = {
          success: result.success.map(student => ({
            ...student,
            parcourId: this.selectedParcourId!
          })),
          failed: result.failed
        };
        this.dialogRef.close({ success: true, assigned: validatedResult.success, failed: validatedResult.failed });
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Erreur d’assignation:', err); // Debug log
        this.snackBar.open('Erreur lors de l\'assignation au serveur. Veuillez réessayer.', 'Fermer', { duration: 3000 });
        this.dialogRef.close({ success: false, error: err });
      }
    });
  }

  cancel(): void {
    if (this.data.enforceAssignment && this.mode === 'assignToParcour') {
      this.snackBar.open('Vous devez assigner au moins un étudiant au parcours.', 'Fermer', { duration: 3000 });
      return;
    }
    this.dialogRef.close({ success: false });
  }
}