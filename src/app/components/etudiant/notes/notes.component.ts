import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { NoteService } from 'src/app/Services/NoteService/note.service';
import { MatiereService } from 'src/app/Services/MatierService/matiere.service';
import { PanierService } from 'src/app/Services/PanierService/panier.service';
import { ParcourService } from 'src/app/Services/ParcourService/parcour.service';
import { NoteDto } from 'src/app/models/NoteDto';
import { MatiereDto } from 'src/app/models/MatiereDto';
import { PanierDto } from 'src/app/models/PanierDto';
import { ParcourDto } from 'src/app/models/ParcourDto';

@Component({
  selector: 'app-notes',
  templateUrl: './notes.component.html',
  styleUrls: ['./notes.component.css']
})
export class NotesComponent implements OnInit {
  notes: NoteDto[] = [];
  matieres: { [key: number]: { nom: string; coefficient: number } } = {};
  paniers: PanierDto[] = [];
  parcours: ParcourDto[] = [];
  isLoading = true;
  errorMessage: string | null = null;
  currentDate: Date = new Date('2025-08-25T16:25:00+02:00'); // Updated to 04:25 PM CET, August 25, 2025

  constructor(
    private noteService: NoteService,
    private matiereService: MatiereService,
    private panierService: PanierService,
    private parcourService: ParcourService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.getStudentId().subscribe({
      next: (studentId) => {
        console.log('Fetched studentId:', studentId);
        if (studentId !== null && studentId !== undefined) {
          this.loadData(studentId);
        } else {
          this.errorMessage = 'Student ID not found. Please log in again.';
          this.isLoading = false;
        }
      },
      error: (error) => {
        console.error('Error fetching student ID:', error);
        this.errorMessage = 'Failed to load student information. Please log in again.';
        this.isLoading = false;
      }
    });
  }

  private getStudentId(): Observable<number | null> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
    });
    return this.http.get<{ id: string }>('http://localhost:8080/api/utilisateurs/me', { headers }).pipe(
      map(response => {
        console.log('Raw response from /api/utilisateurs/me:', response);
        const studentId = response.id ? Number(response.id) : null;
        console.log('Parsed studentId:', studentId);
        return studentId;
      }),
      catchError((error) => {
        console.error('Error fetching student ID:', error);
        return of(null);
      })
    );
  }

  private loadData(studentId: number): void {
    this.noteService.getNotesByStudentId(studentId).subscribe({
      next: (notes) => {
        console.log('Fetched notes:', notes);
        this.notes = notes || [];
        this.loadPaniersAndParcours(studentId);
      },
      error: (error) => {
        console.error('Error fetching notes for student ID:', studentId, error);
        this.errorMessage = error.status === 403
          ? 'You are not authorized to view these grades. Please ensure you are logged in with the correct account.'
          : error.status === 404
          ? 'No grades found for this student.'
          : 'Failed to load grades. Please try again later.';
        this.isLoading = false;
      }
    });
  }

  private loadPaniersAndParcours(studentId: number): void {
    this.panierService.getAllPaniers().subscribe({
      next: (paniers) => {
        console.log('Fetched paniers:', paniers);
        this.paniers = paniers || [];
        this.loadMatiereNames();
      },
      error: (error) => {
        console.error('Error fetching paniers:', error);
        this.paniers = [];
        this.errorMessage = 'Failed to load paniers. Please try again.';
        this.loadMatiereNames();
      }
    });

    this.parcourService.getParcoursByEtudiantId(studentId).subscribe({
      next: (parcours) => {
        console.log('Fetched parcours for student ID:', studentId, parcours);
        this.parcours = parcours || [];
        this.loadMatiereNames();
      },
      error: (error) => {
        console.error('Error fetching parcours for student ID:', studentId, error);
        this.errorMessage = error.status === 403
          ? 'You are not authorized to view parcours for this student. Please ensure you are logged in with the correct account.'
          : 'Failed to load parcours. Please try again.';
        this.loadMatiereNames();
      }
    });
  }

  private loadMatiereNames(): void {
    const uniqueMatiereIds = [...new Set(this.notes.map(note => note.matiereId))];
    console.log('Fetching matiere names and coefficients for IDs:', uniqueMatiereIds);
    if (uniqueMatiereIds.length === 0) {
      this.checkIfAllDataLoaded();
      return;
    }
    let loadedCount = 0;
    uniqueMatiereIds.forEach(matiereId => {
      this.matiereService.getMatiereById(matiereId).subscribe({
        next: (matiere: MatiereDto) => {
          console.log(`Fetched matiere ${matiereId}:`, matiere);
          this.matieres[matiereId] = { nom: matiere.nom || `Unknown Subject (${matiereId})`, coefficient: matiere.coefficient || 1.0 };
          loadedCount++;
          if (loadedCount === uniqueMatiereIds.length) {
            this.checkIfAllDataLoaded();
          }
        },
        error: (error) => {
          console.error(`Error fetching matiere ${matiereId}:`, error);
          this.matieres[matiereId] = { nom: `Unknown Subject (${matiereId})`, coefficient: 1.0 };
          loadedCount++;
          if (loadedCount === uniqueMatiereIds.length) {
            this.checkIfAllDataLoaded();
          }
        }
      });
    });
  }

  private checkIfAllDataLoaded(): void {
    const uniqueMatiereIds = [...new Set(this.notes.map(note => note.matiereId))];
    const allMatieresLoaded = uniqueMatiereIds.every(id => this.matieres[id] !== undefined);
    console.log('Check if all data loaded:', {
      allMatieresLoaded,
      paniersLoaded: this.paniers !== undefined,
      parcoursLoaded: this.parcours !== undefined,
      parcours: this.parcours
    });
    if (allMatieresLoaded && this.paniers !== undefined && this.parcours !== undefined) {
      this.isLoading = false;
    }
  }

  getTableRows(): { parcourName: string; date: string; panierName: string; panierCoefficient: number | undefined; matiereName: string; matiereCoefficient: number; note: NoteDto | null }[] {
    const rows: { parcourName: string; date: string; panierName: string; panierCoefficient: number | undefined; matiereName: string; matiereCoefficient: number; note: NoteDto | null }[] = [];
    
    // Get all panierIds associated with the student's parcours
    const parcourPanierIds = new Set(this.parcours.flatMap(parcour => parcour.panierIds ?? []));
    
    // Get all matiereIds associated with the paniers linked to the student's parcours
    const validMatiereIds = new Set(
      this.paniers
        .filter(panier => panier.id && parcourPanierIds.has(panier.id))
        .flatMap(panier => panier.matiereIds ?? [])
    );

    // For each matiere, create rows for each note or a row with no note if none exist
    validMatiereIds.forEach(matiereId => {
      const matiereNotes = this.notes.filter(note => note.matiereId === matiereId);
      const relatedPaniers = this.paniers.filter(panier => panier.matiereIds?.includes(matiereId) ?? false);
      const relatedParcours = this.parcours.filter(parcour => parcour.panierIds?.some(panierId => relatedPaniers.some(p => p.id === panierId)) ?? false);
      
      const panierName = relatedPaniers.length > 0 ? relatedPaniers.map(p => p.nom).join(', ') : 'None';
      const panierCoefficient = relatedPaniers.length > 0 ? relatedPaniers[0].coefficientTotal : undefined;
      const parcourName = relatedParcours.length > 0 ? relatedParcours.map(p => p.nom).join(', ') : 'None';
      const date = relatedParcours.length > 0 ? relatedParcours[0].annee : 'N/A';
      const matiereData = this.matieres[matiereId] || { nom: `Unknown Subject (${matiereId})`, coefficient: 1.0 };

      if (matiereNotes.length === 0) {
        rows.push({
          parcourName,
          date,
          panierName,
          panierCoefficient,
          matiereName: matiereData.nom,
          matiereCoefficient: matiereData.coefficient,
          note: null
        });
      } else {
        matiereNotes.forEach(note => {
          rows.push({
            parcourName,
            date,
            panierName,
            panierCoefficient,
            matiereName: matiereData.nom,
            matiereCoefficient: matiereData.coefficient,
            note
          });
        });
      }
    });

    return rows.sort((a, b) => a.matiereName.localeCompare(b.matiereName));
  }
}