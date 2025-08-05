import { Component, OnInit, ViewChild } from '@angular/core';
import { Observable } from 'rxjs';
import { MatTableDataSource } from '@angular/material/table';
import { MatTable } from '@angular/material/table';
import { NgForm } from '@angular/forms';
import { SemestreService } from 'src/app/Services/SemestreService/semestre.service';
import { PanierService, PanierDto } from 'src/app/Services/PanierService/panier.service';
import { SemestreDto } from 'src/app/models/SemestreDto';

@Component({
  selector: 'app-semestre',
  templateUrl: './semestre.component.html',
  styleUrls: ['./semestre.component.css']
})
export class SemestreComponent implements OnInit {
  semestres$: Observable<SemestreDto[] | null> = this.semestreService.getAllSemestres();
  dataSource = new MatTableDataSource<SemestreDto>();
  displayedColumns: string[] = ['id', 'nom', 'actions'];
  selectedSemestre$: Observable<SemestreDto> | null = null;
  showForm: boolean = false;
  editMode: boolean = false;
  newSemestre: SemestreDto = { nom: '' };

  @ViewChild(MatTable) table!: MatTable<SemestreDto>;
  @ViewChild('semestreForm') semestreForm!: NgForm;

  constructor(
    private semestreService: SemestreService,
    private panierService: PanierService
  ) {}

  ngOnInit() {
    // Charger les semestres
    this.semestres$.subscribe({
      next: (data) => {
        if (data) {
          this.dataSource.data = data;
        } else {
          this.dataSource.data = [];
        }
      },
      error: (err) => {
        console.error('Error fetching semestres:', err.message);
        alert(err.message);
      }
    });

   
  }

  getSemestre(id: number) {
    this.selectedSemestre$ = this.semestreService.getSemestreById(id);
  }

  createSemestre(semestre: SemestreDto) {
    this.semestreService.createSemestre(semestre).subscribe({
      next: () => {
        this.semestres$ = this.semestreService.getAllSemestres();
        this.semestres$.subscribe(data => {
          if (data) this.dataSource.data = data;
        });
        this.showForm = false;
        this.semestreForm.reset();
        this.newSemestre = { nom: '' };
     
        this.editMode = false;
      },
      error: (err) => {
        console.error('Error creating semestre:', err.message);
        alert(err.message);
      }
    });
  }

  updateSemestre(semestre: SemestreDto) {
    if (semestre.id) {
      this.semestreService.updateSemestre(semestre).subscribe({
        next: () => {
          this.semestres$ = this.semestreService.getAllSemestres();
          this.semestres$.subscribe(data => {
            if (data) this.dataSource.data = data;
          });
          this.showForm = false;
          this.semestreForm.reset();
          this.newSemestre = { nom: '' };
         
          this.editMode = false;
        },
        error: (err) => {
          console.error('Error updating semestre:', err.message);
          alert(err.message);
        }
      });
    }
  }

  deleteSemestre(id: number) {
    this.semestreService.deleteSemestre(id).subscribe({
      next: () => {
        this.semestres$ = this.semestreService.getAllSemestres();
        this.semestres$.subscribe(data => {
          if (data) this.dataSource.data = data;
        });
      },
      error: (err) => {
        console.error('Error deleting semestre:', err.message);
        alert(err.message);
      }
    });
  }

  onSubmit(formValue: any) {
    const semestre: SemestreDto = {
      id: this.editMode ? this.newSemestre.id : undefined,
      nom: formValue.nom,
    };
    if (this.editMode) {
      this.updateSemestre(semestre);
    } else {
      this.createSemestre(semestre);
    }
  }

  openForm() {
    this.showForm = true;
    this.editMode = false;
    this.newSemestre = { nom: ''};
  }

  cancelForm() {
    this.showForm = false;
    this.semestreForm.reset();
    this.newSemestre = { nom: ''};
    this.editMode = false;
  }

  editSemestre(element: SemestreDto) {
    this.editMode = true;
    this.showForm = true;
    this.newSemestre = { ...element };
  }
}