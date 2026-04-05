import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { NoteService } from 'src/app/Services/NoteService/note.service';
import { MatiereService } from 'src/app/Services/MatierService/matiere.service';
import { PanierService } from 'src/app/Services/PanierService/panier.service';
import { ParcourService } from 'src/app/Services/ParcourService/parcour.service';
import { ClasseService } from 'src/app/Services/Classe/classe.service';
import { NoteDto } from 'src/app/models/NoteDto';
import { MatiereDto } from 'src/app/models/MatiereDto';
import { PanierDto } from 'src/app/models/PanierDto';
import { ParcourDto } from 'src/app/models/ParcourDto';
import { ClasseDto } from 'src/app/models/ClasseDto';
import { ChartConfiguration, ChartData } from 'chart.js';

interface Recommendation {
  type: 'success' | 'warning' | 'danger' | 'info';
  title: string;
  message: string;
  icon: string;
}

interface MatiereStats {
  matiereId: number;
  matiereName: string;
  average: number;
  coefficient: number;
  notesCount: number;
}

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
  studentClasse: ClasseDto | null = null;
  isLoading = true;
  errorMessage: string | null = null;
  currentDate: Date = new Date('2025-08-25T16:25:00+02:00');

  // Statistics
  overallAverage: number = 0;
  totalMatieres: number = 0;
  bestMatiere: MatiereStats | null = null;
  worstMatiere: MatiereStats | null = null;
  matiereStats: MatiereStats[] = [];
  
  // Recommendations
  recommendations: Recommendation[] = [];
  
  // Charts
  barChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  barChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { min: 0, max: 20, ticks: { color: 'rgba(255, 255, 255, 0.7)' }, grid: { color: 'rgba(255, 255, 255, 0.1)' } },
      x: { ticks: { color: 'rgba(255, 255, 255, 0.7)' }, grid: { display: false } }
    }
  };

  constructor(
    private noteService: NoteService,
    private matiereService: MatiereService,
    private panierService: PanierService,
    private parcourService: ParcourService,
    private classeService: ClasseService,
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
        this.loadStudentClasse();
        this.loadMatiereNames();
      },
      error: (error) => {
        console.error('Error fetching parcours for student ID:', studentId, error);
        this.errorMessage = error.status === 403
          ? 'You are not authorized to view parcours for this student. Please ensure you are logged in with the correct account.'
          : 'Failed to load parcours. Please try again.';
        this.loadStudentClasse();
        this.loadMatiereNames();
      }
    });
  }

  private loadStudentClasse(): void {
    if (this.parcours.length > 0 && this.parcours[0].id) {
      const parcourId = this.parcours[0].id;
      this.classeService.getClassesByParcour(parcourId).subscribe({
        next: (classes) => {
          console.log('Fetched classes for parcour:', parcourId, classes);
          // Get the first class associated with the parcour
          this.studentClasse = classes && classes.length > 0 ? classes[0] : null;
        },
        error: (error) => {
          console.error('Error fetching classes for parcour:', parcourId, error);
          this.studentClasse = null;
        }
      });
    } else {
      this.studentClasse = null;
    }
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
    if (allMatieresLoaded && this.paniers !== undefined && this.parcours !== undefined) {
      this.calculateStats();
      this.isLoading = false;
    }
  }

  private calculateStats(): void {
    if (this.notes.length === 0) {
      this.generateRecommendations();
      return;
    }

    const notesByMatiere: { [key: number]: NoteDto[] } = {};
    this.notes.forEach(note => {
      if (!notesByMatiere[note.matiereId]) notesByMatiere[note.matiereId] = [];
      notesByMatiere[note.matiereId].push(note);
    });

    this.matiereStats = Object.keys(notesByMatiere).map(matiereId => {
      const id = Number(matiereId);
      const notes = notesByMatiere[id];
      const sum = notes.reduce((acc, note) => acc + note.valeur, 0);
      const average = sum / notes.length;
      const matiereData = this.matieres[id];
      return {
        matiereId: id,
        matiereName: matiereData?.nom || `Matière ${id}`,
        average: Math.round(average * 100) / 100,
        coefficient: matiereData?.coefficient || 1.0,
        notesCount: notes.length
      };
    });

    this.totalMatieres = this.matiereStats.length;

    let weightedSum = 0, totalCoefficient = 0;
    this.matiereStats.forEach(stat => {
      weightedSum += stat.average * stat.coefficient;
      totalCoefficient += stat.coefficient;
    });
    this.overallAverage = totalCoefficient > 0 ? Math.round((weightedSum / totalCoefficient) * 100) / 100 : 0;

    if (this.matiereStats.length > 0) {
      this.bestMatiere = this.matiereStats.reduce((best, current) => current.average > best.average ? current : best);
      this.worstMatiere = this.matiereStats.reduce((worst, current) => current.average < worst.average ? current : worst);
    }

    this.updateCharts();
    this.generateRecommendations();
  }

  private updateCharts(): void {
    if (this.matiereStats.length === 0) return;
    const topMatieres = this.matiereStats.slice(0, 6);
    const labels = topMatieres.map(m => m.matiereName.substring(0, 15));
    const data = topMatieres.map(m => m.average);
    const colors = data.map(v => v >= 14 ? 'rgba(34, 197, 94, 0.8)' : v >= 10 ? 'rgba(234, 179, 8, 0.8)' : 'rgba(239, 68, 68, 0.8)');
    this.barChartData = { labels, datasets: [{ data, label: 'Moyenne', backgroundColor: colors, borderColor: colors.map(c => c.replace('0.8', '1')), borderWidth: 1, borderRadius: 4 }] };
  }

  private generateRecommendations(): void {
    this.recommendations = [];
    if (this.notes.length === 0) {
      this.recommendations.push({ type: 'info', title: 'Aucune note disponible', message: 'Vos recommandations apparaîtront dès que vos évaluations seront saisies.', icon: 'info' });
      return;
    }
    if (this.overallAverage >= 16) {
      this.recommendations.push({ type: 'success', title: 'Excellente performance !', message: `Votre moyenne de ${this.overallAverage}/20 est excellente. Continuez ainsi !`, icon: 'emoji_events' });
    } else if (this.overallAverage >= 14) {
      this.recommendations.push({ type: 'success', title: 'Très bon travail', message: `Avec ${this.overallAverage}/20, vous êtes sur la bonne voie.`, icon: 'thumb_up' });
    } else if (this.overallAverage >= 10) {
      this.recommendations.push({ type: 'warning', title: 'Moyenne à consolider', message: `Votre moyenne de ${this.overallAverage}/20 peut être améliorée.`, icon: 'trending_up' });
    } else {
      this.recommendations.push({ type: 'danger', title: 'Attention nécessaire', message: `Votre moyenne de ${this.overallAverage}/20 nécessite une attention immédiate.`, icon: 'warning' });
    }
    if (this.bestMatiere && this.bestMatiere.average >= 16) {
      this.recommendations.push({ type: 'success', title: `Force: ${this.bestMatiere.matiereName}`, message: `Vous excellez avec ${this.bestMatiere.average}/20.`, icon: 'star' });
    }
    if (this.worstMatiere && this.worstMatiere.average < 10) {
      this.recommendations.push({ type: 'danger', title: `À améliorer: ${this.worstMatiere.matiereName}`, message: `Moyenne faible (${this.worstMatiere.average}/20). Envisagez du tutorat.`, icon: 'school' });
    }
    const highCoeffLowScore = this.matiereStats.find(m => m.coefficient >= 3 && m.average < 12);
    if (highCoeffLowScore) {
      this.recommendations.push({ type: 'warning', title: 'Matière importante', message: `${highCoeffLowScore.matiereName} (coef. ${highCoeffLowScore.coefficient}) impacte votre moyenne.`, icon: 'priority_high' });
    }
  }

  getGradeColor(average: number): string {
    if (average >= 16) return '#22c55e';
    if (average >= 14) return '#84cc16';
    if (average >= 12) return '#eab308';
    if (average >= 10) return '#f97316';
    return '#ef4444';
  }

  getGradeLabel(average: number): string {
    if (average >= 16) return 'Très Bien';
    if (average >= 14) return 'Bien';
    if (average >= 12) return 'Assez Bien';
    if (average >= 10) return 'Passable';
    return 'Insuffisant';
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

    // If no parcours/paniers linked, fall back to showing all notes with their matieres
    const matiereIdsToShow = validMatiereIds.size > 0 
      ? validMatiereIds 
      : new Set(this.notes.map(note => note.matiereId));

    // For each matiere, create rows for each note or a row with no note if none exist
    matiereIdsToShow.forEach(matiereId => {
      const matiereNotes = this.notes.filter(note => note.matiereId === matiereId);
      const relatedPaniers = this.paniers.filter(panier => panier.matiereIds?.includes(matiereId) ?? false);
      const relatedParcours = this.parcours.filter(parcour => parcour.panierIds?.some(panierId => relatedPaniers.some(p => p.id === panierId)) ?? false);
      
      const panierName = relatedPaniers.length > 0 ? relatedPaniers.map(p => p.nom).join(', ') : 'Non assigné';
      const panierCoefficient = relatedPaniers.length > 0 ? relatedPaniers[0].coefficientTotal : undefined;
      const parcourName = relatedParcours.length > 0 ? relatedParcours.map(p => p.nom).join(', ') : 'Non assigné';
      const date = relatedParcours.length > 0 ? relatedParcours[0].annee : 'N/A';
      const matiereData = this.matieres[matiereId] || { nom: `Matière inconnue (${matiereId})`, coefficient: 1.0 };

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