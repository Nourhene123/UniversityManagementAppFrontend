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
  selector: 'app-evaluation-dashboard',
  templateUrl: './evaluation-dashboard.component.html',
  styleUrls: ['./evaluation-dashboard.component.css']
})
export class EvaluationDashboardComponent implements OnInit {
  // Data
  notes: NoteDto[] = [];
  matieres: { [key: number]: { nom: string; coefficient: number } } = {};
  paniers: PanierDto[] = [];
  parcours: ParcourDto[] = [];
  studentClasse: ClasseDto | null = null;
  studentId: number | null = null;
  
  // Loading state
  isLoading = true;
  errorMessage: string | null = null;
  
  // Statistics
  overallAverage: number = 0;
  totalMatieres: number = 0;
  bestMatiere: MatiereStats | null = null;
  worstMatiere: MatiereStats | null = null;
  matiereStats: MatiereStats[] = [];
  
  // Recommendations
  recommendations: Recommendation[] = [];
  
  // Charts
  radarChartData: ChartData<'radar'> = {
    labels: [],
    datasets: []
  };
  
  radarChartOptions: ChartConfiguration<'radar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      r: {
        min: 0,
        max: 20,
        ticks: {
          stepSize: 4,
          color: 'rgba(255, 255, 255, 0.7)'
        },
        pointLabels: {
          color: 'rgba(255, 255, 255, 0.9)',
          font: {
            size: 12
          }
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        }
      }
    }
  };
  
  barChartData: ChartData<'bar'> = {
    labels: [],
    datasets: []
  };
  
  barChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      y: {
        min: 0,
        max: 20,
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)'
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        }
      },
      x: {
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)'
        },
        grid: {
          display: false
        }
      }
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
          this.studentId = studentId;
          this.loadData(studentId);
        } else {
          this.errorMessage = 'ID étudiant non trouvé. Veuillez vous reconnecter.';
          this.isLoading = false;
        }
      },
      error: (error) => {
        console.error('Error fetching student ID:', error);
        this.errorMessage = 'Erreur lors du chargement des informations étudiant.';
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
        const studentId = response.id ? Number(response.id) : null;
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
        this.notes = notes || [];
        this.loadPaniersAndParcours(studentId);
      },
      error: (error) => {
        console.error('Error fetching notes:', error);
        this.errorMessage = 'Erreur lors du chargement des notes.';
        this.isLoading = false;
      }
    });
  }

  private loadPaniersAndParcours(studentId: number): void {
    this.panierService.getAllPaniers().subscribe({
      next: (paniers) => {
        this.paniers = paniers || [];
        this.loadMatiereNames();
      },
      error: () => {
        this.paniers = [];
        this.loadMatiereNames();
      }
    });

    this.parcourService.getParcoursByEtudiantId(studentId).subscribe({
      next: (parcours) => {
        this.parcours = parcours || [];
        this.loadStudentClasse();
        this.loadMatiereNames();
      },
      error: () => {
        this.parcours = [];
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
          this.studentClasse = classes && classes.length > 0 ? classes[0] : null;
        },
        error: () => {
          this.studentClasse = null;
        }
      });
    }
  }

  private loadMatiereNames(): void {
    const uniqueMatiereIds = [...new Set(this.notes.map(note => note.matiereId))];
    if (uniqueMatiereIds.length === 0) {
      this.calculateStats();
      this.isLoading = false;
      return;
    }
    
    let loadedCount = 0;
    uniqueMatiereIds.forEach(matiereId => {
      this.matiereService.getMatiereById(matiereId).subscribe({
        next: (matiere: MatiereDto) => {
          this.matieres[matiereId] = { 
            nom: matiere.nom || `Matière ${matiereId}`, 
            coefficient: matiere.coefficient || 1.0 
          };
          loadedCount++;
          if (loadedCount === uniqueMatiereIds.length) {
            this.calculateStats();
            this.isLoading = false;
          }
        },
        error: () => {
          this.matieres[matiereId] = { nom: `Matière ${matiereId}`, coefficient: 1.0 };
          loadedCount++;
          if (loadedCount === uniqueMatiereIds.length) {
            this.calculateStats();
            this.isLoading = false;
          }
        }
      });
    });
  }

  private calculateStats(): void {
    if (this.notes.length === 0) {
      this.generateRecommendations();
      return;
    }

    // Group notes by matiere
    const notesByMatiere: { [key: number]: NoteDto[] } = {};
    this.notes.forEach(note => {
      if (!notesByMatiere[note.matiereId]) {
        notesByMatiere[note.matiereId] = [];
      }
      notesByMatiere[note.matiereId].push(note);
    });

    // Calculate stats per matiere
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

    // Calculate overall weighted average
    let weightedSum = 0;
    let totalCoefficient = 0;
    this.matiereStats.forEach(stat => {
      weightedSum += stat.average * stat.coefficient;
      totalCoefficient += stat.coefficient;
    });
    this.overallAverage = totalCoefficient > 0 
      ? Math.round((weightedSum / totalCoefficient) * 100) / 100 
      : 0;

    // Find best and worst matieres
    if (this.matiereStats.length > 0) {
      this.bestMatiere = this.matiereStats.reduce((best, current) => 
        current.average > best.average ? current : best
      );
      this.worstMatiere = this.matiereStats.reduce((worst, current) => 
        current.average < worst.average ? current : worst
      );
    }

    this.updateCharts();
    this.generateRecommendations();
  }

  private updateCharts(): void {
    if (this.matiereStats.length === 0) return;

    // Limit to top 6 matieres for better readability
    const topMatieres = this.matiereStats.slice(0, 6);
    const labels = topMatieres.map(m => m.matiereName);
    const data = topMatieres.map(m => m.average);

    // Radar chart
    this.radarChartData = {
      labels,
      datasets: [{
        data,
        label: 'Moyenne',
        backgroundColor: 'rgba(139, 92, 246, 0.2)',
        borderColor: 'rgba(139, 92, 246, 1)',
        pointBackgroundColor: 'rgba(139, 92, 246, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(139, 92, 246, 1)',
        borderWidth: 2
      }]
    };

    // Bar chart
    const colors = data.map(v => {
      if (v >= 14) return 'rgba(34, 197, 94, 0.8)';  // Green
      if (v >= 10) return 'rgba(234, 179, 8, 0.8)';  // Yellow
      return 'rgba(239, 68, 68, 0.8)';               // Red
    });

    this.barChartData = {
      labels,
      datasets: [{
        data,
        label: 'Moyenne',
        backgroundColor: colors,
        borderColor: colors.map(c => c.replace('0.8', '1')),
        borderWidth: 1,
        borderRadius: 4
      }]
    };
  }

  private generateRecommendations(): void {
    this.recommendations = [];

    if (this.notes.length === 0) {
      this.recommendations.push({
        type: 'info',
        title: 'Aucune note disponible',
        message: 'Vous n\'avez pas encore de notes enregistrées. Les recommandations apparaîtront dès que vos évaluations seront saisies.',
        icon: 'info'
      });
      return;
    }

    // Overall performance recommendation
    if (this.overallAverage >= 16) {
      this.recommendations.push({
        type: 'success',
        title: 'Excellente performance !',
        message: `Votre moyenne générale de ${this.overallAverage}/20 est excellente. Continuez ainsi et maintenez votre niveau d'excellence.`,
        icon: 'emoji_events'
      });
    } else if (this.overallAverage >= 14) {
      this.recommendations.push({
        type: 'success',
        title: 'Très bon travail',
        message: `Avec une moyenne de ${this.overallAverage}/20, vous êtes sur la bonne voie. Quelques efforts supplémentaires vous permettront d'atteindre l'excellence.`,
        icon: 'thumb_up'
      });
    } else if (this.overallAverage >= 10) {
      this.recommendations.push({
        type: 'warning',
        title: 'Moyenne à consolider',
        message: `Votre moyenne de ${this.overallAverage}/20 est satisfaisante mais peut être améliorée. Concentrez-vous sur les matières où vous êtes en dessous de la moyenne.`,
        icon: 'trending_up'
      });
    } else {
      this.recommendations.push({
        type: 'danger',
        title: 'Attention necessaire',
        message: `Votre moyenne de ${this.overallAverage}/20 nécessite une attention immédiate. N'hésitez pas à demander de l'aide à vos professeurs ou à utiliser les ressources pédagogiques disponibles.`,
        icon: 'warning'
      });
    }

    // Best matiere recommendation
    if (this.bestMatiere && this.bestMatiere.average >= 16) {
      this.recommendations.push({
        type: 'success',
        title: `Force en ${this.bestMatiere.matiereName}`,
        message: `Vous excellez en ${this.bestMatiere.matiereName} avec une moyenne de ${this.bestMatiere.average}/20. Votre méthode de travail dans cette matière pourrait inspirer vos autres disciplines.`,
        icon: 'star'
      });
    }

    // Worst matiere recommendation
    if (this.worstMatiere && this.worstMatiere.average < 10) {
      this.recommendations.push({
        type: 'danger',
        title: `Point d'attention: ${this.worstMatiere.matiereName}`,
        message: `${this.worstMatiere.matiereName} nécessite plus d'attention (moyenne: ${this.worstMatiere.average}/20). Envisagez des séances de tutorat ou des révisions supplémentaires.`,
        icon: 'school'
      });
    }

    // Coefficient-based recommendation
    const highCoeffLowScore = this.matiereStats.find(m => m.coefficient >= 3 && m.average < 12);
    if (highCoeffLowScore) {
      this.recommendations.push({
        type: 'warning',
        title: 'Matière importante à travailler',
        message: `${highCoeffLowScore.matiereName} a un coefficient élevé (${highCoeffLowScore.coefficient}) et impacte significativement votre moyenne. Priorisez cette matière dans vos révisions.`,
        icon: 'priority_high'
      });
    }

    // Consistency recommendation
    const inconsistentMatieres = this.matiereStats.filter(m => m.notesCount >= 3);
    if (inconsistentMatieres.length > 0) {
      const variances = inconsistentMatieres.map(m => {
        const notes = this.notes.filter(n => n.matiereId === m.matiereId);
        const avg = m.average;
        const variance = notes.reduce((sum, n) => sum + Math.pow(n.valeur - avg, 2), 0) / notes.length;
        return { matiere: m, variance };
      });
      
      const mostInconsistent = variances.reduce((max, curr) => curr.variance > max.variance ? curr : max, variances[0]);
      if (mostInconsistent && mostInconsistent.variance > 9) {
        this.recommendations.push({
          type: 'info',
          title: 'Régularité à améliorer',
          message: `Vos notes en ${mostInconsistent.matiere.matiereName} sont irrégulières. Travaillez sur la constance de vos résultats pour plus de stabilité.`,
          icon: 'show_chart'
        });
      }
    }
  }

  getGradeColor(average: number): string {
    if (average >= 16) return '#22c55e'; // Green
    if (average >= 14) return '#84cc16'; // Light green
    if (average >= 12) return '#eab308'; // Yellow
    if (average >= 10) return '#f97316'; // Orange
    return '#ef4444'; // Red
  }

  getGradeLabel(average: number): string {
    if (average >= 16) return 'Très Bien';
    if (average >= 14) return 'Bien';
    if (average >= 12) return 'Assez Bien';
    if (average >= 10) return 'Passable';
    return 'Insuffisant';
  }
}