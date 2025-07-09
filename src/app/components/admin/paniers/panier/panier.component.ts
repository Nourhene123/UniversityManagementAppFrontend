
import { Component, inject, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { PanierDto } from 'src/app/models/PanierDto';
import { PanierService } from 'src/app/Services/PanierService/panier.service';
import { ParcourService } from 'src/app/Services/ParcourService/parcour.service';
import { MatiereService } from 'src/app/Services/MatierService/matiere.service';
import { forkJoin, Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ParcourDto } from 'src/app/models/ParcourDto';
import { MatiereDto } from 'src/app/models/MatiereDto';
import { SemestreDto } from 'src/app/models/SemestreDto'; 
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-panier',
  templateUrl: './panier.component.html',
  styleUrls: ['./panier.component.css']
})
export class PanierComponent implements OnInit {
  displayedColumns: string[] = ['id', 'nom', 'coefficientTotal', 'semestre', 'parcourNom', 'listeMatieres', 'actions'];
  dataSource = new MatTableDataSource<PanierDto>([]);
  showForm = false;
  editMode = false;
  newPanier: PanierDto = {
    nom: '',
    coefficientTotal: 0,
    semestreId: undefined, // Remplace semestre par semestreId
    parcourId: undefined,
    matiereIds: []
  };
  allMatieres: MatiereDto[] = [];
  allParcours: ParcourDto[] = [];
  allSemestres: SemestreDto[] = []; // Ajout pour les semestres
  parcourNomMap: { [key: number]: string } = {};
  matieresMap: { [key: number]: MatiereDto[] } = {};
  semestreNomMap: { [key: number]: string } = {}; // Pour mapper les noms des semestres

  constructor(
    private panierService: PanierService,
    private parcourService: ParcourService,
    private matiereService: MatiereService
  ) {}

  ngOnInit(): void {
    this.loadPaniers();
    this.loadAllData();
  }

  loadPaniers(): void {
    this.panierService.getAllPaniers().subscribe({
      next: (paniers) => {
        this.dataSource.data = paniers;
        console.log('Paniers loaded:', paniers);
        this.loadAdditionalData(paniers);
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error fetching paniers:', err.status, err.statusText, err.error);
        alert('Failed to load paniers: ' + err.message);
      }
    });
  }

  loadAllData(): void {
    forkJoin({
      matieres: this.matiereService.getAllMatieres(),
      parcours: this.parcourService.getAllParcours(),
      semestres: this.getAllSemestres() // Ajout du chargement des semestres
    }).subscribe({
      next: ({ matieres, parcours, semestres }) => {
        this.allMatieres = matieres;
        this.allParcours = parcours;
        this.allSemestres = semestres;
        this.allSemestres.forEach(semestre => {
          this.semestreNomMap[semestre.id!] = semestre.nom;
        });
        console.log('Semestres loaded:', semestres);
        console.log('Matieres loaded:', matieres);
        console.log('Parcours loaded:', parcours);
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error fetching matieres, parcours, or semestres:', err.status, err.statusText, err.error);
        alert('Failed to load matieres, parcours, or semestres: ' + err.message);
      }
    });
  }

  getAllSemestres(): Observable<SemestreDto[]> {
    // Implémentez un service pour récupérer les semestres (exemple)
    return this.http.get<SemestreDto[]>('http://localhost:8080/api/semestres', { headers: this.getHeaders() })
      .pipe(
        catchError((err: HttpErrorResponse) => {
          console.error('Error fetching semestres:', err.status, err.statusText, err.error);
          return of([]);
        })
      );
  }

  private http = inject(HttpClient); // Ajout pour utiliser HttpClient
  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    });
  }

  loadAdditionalData(paniers: PanierDto[]): void {
    const parcourObservables: Observable<void>[] = [];
    const matiereObservables: Observable<void>[] = [];

    const uniqueParcourIds = [...new Set(paniers.map(p => p.parcourId).filter(id => id !== undefined && id !== 0))] as number[];
    uniqueParcourIds.forEach(parcourId => {
      if (!this.parcourNomMap[parcourId]) {
        parcourObservables.push(
          this.parcourService.getParcourById(parcourId).pipe(
            map((parcour: ParcourDto) => {
              this.parcourNomMap[parcourId] = parcour.nom;
            }),
            catchError((err) => {
              console.error(`Error fetching parcour ID ${parcourId}:`, err);
              this.parcourNomMap[parcourId] = 'Not Found';
              return of(void 0);
            })
          )
        );
      }
    });

    paniers.forEach(panier => {
      if (panier.matiereIds && panier.matiereIds.length > 0 && !this.matieresMap[panier.id!]) {
        const matiereIds = panier.matiereIds;
        matiereObservables.push(
          forkJoin(matiereIds.map(id => this.matiereService.getMatiereById(id))).pipe(
            map((matieres: MatiereDto[]) => {
              this.matieresMap[panier.id!] = matieres;
            }),
            catchError((err) => {
              console.error(`Error fetching matieres for panier ID ${panier.id}:`, err);
              this.matieresMap[panier.id!] = [];
              return of(void 0);
            })
          )
        );
      }
    });

    if (parcourObservables.length > 0 || matiereObservables.length > 0) {
      forkJoin([...parcourObservables, ...matiereObservables]).subscribe({
        next: () => {
          console.log('Additional data loaded');
        },
        error: (err: HttpErrorResponse) => {
          console.error('Error loading additional data:', err.status, err.statusText, err.error);
          alert('Failed to load additional data: ' + err.message);
        }
      });
    }
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
    console.log('Form value:', formValue);
    const panier: PanierDto = {
      id: this.editMode ? this.newPanier.id : undefined,
      nom: formValue.nom,
      coefficientTotal: formValue.coefficientTotal,
      semestreId: formValue.semestreId, // Utilise semestreId au lieu de semestre
      parcourId: formValue.parcourId,
      matiereIds: this.newPanier.matiereIds
    };
    console.log('Panier to send:', panier);

    if (this.editMode) {
      this.panierService.updatePanier(panier).subscribe({
        next: (updatedPanier: PanierDto) => {
          console.log('Update response:', updatedPanier);
          const index = this.dataSource.data.findIndex(p => p.id === updatedPanier.id);
          this.dataSource.data[index] = updatedPanier;
          this.dataSource.data = [...this.dataSource.data];
          this.loadAdditionalData([updatedPanier]);
          this.cancelForm();
          alert('Panier updated successfully!');
        },
        error: (err: HttpErrorResponse) => {
          console.error('Error updating panier:', err.status, err.statusText, err.error);
          alert('Failed to update panier: ' + err.message);
        }
      });
    } else {
      this.panierService.createPanier(panier).subscribe({
        next: (savedPanier) => {
          console.log('Create response:', savedPanier);
          this.dataSource.data = [...this.dataSource.data, savedPanier];
          this.loadAdditionalData([savedPanier]);
          this.cancelForm();
          alert('Panier created successfully!');
        },
        error: (err: HttpErrorResponse) => {
          console.error('Error creating panier:', err.status, err.statusText, err.error);
          alert('Failed to create panier: ' + err.message);
        }
      });
    }
  }

  editPanier(panier: PanierDto): void {
    this.newPanier = { ...panier };
    this.showForm = true;
    this.editMode = true;
  }

  deletePanier(id: number): void {
    if (confirm('Are you sure you want to delete this panier?')) {
      this.panierService.deletePanier(id).subscribe({
        next: () => {
          console.log('Panier deleted:', id);
          this.dataSource.data = this.dataSource.data.filter(p => p.id !== id);
          delete this.matieresMap[id];
          alert('Panier deleted successfully!');
        },
        error: (err: HttpErrorResponse) => {
          console.error('Error deleting panier:', err.status, err.statusText, err.error);
          alert('Failed to delete panier: ' + err.message);
        }
      });
    }
  }

  resetForm(): void {
    this.newPanier = {
      nom: '',
      coefficientTotal: 0,
      semestreId: undefined, // Remplace semestre par semestreId
      parcourId: undefined,
      matiereIds: []
    };
  }

  getParcourNom(parcourId: number): string {
    return this.parcourNomMap[parcourId] || 'Not Found';
  }

  getListeMatieres(panierId: number): string {
    const matieres = this.matieresMap[panierId] || [];
    return matieres.map(m => m.nom).join(', ') || 'No Matieres';
  }

  getSemestreNom(semestreId?: number): string {
    return semestreId !== undefined ? this.semestreNomMap[semestreId] || 'Not Found' : 'Not Assigned';
  }
}