import { Component, OnInit, ViewChild } from '@angular/core';
import { Observable, of } from 'rxjs';
import { MatTableDataSource } from '@angular/material/table';
import { MatTable } from '@angular/material/table';
import { NgForm } from '@angular/forms';
import { SemestreService } from 'src/app/Services/SemestreService/semestre.service';
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
  panierIdsString: string = '';
  showForm: boolean = false;
  editMode: boolean = false; // Add editMode property
  newSemestre: SemestreDto = { nom: '', panierIds: [] }; // Add newSemestre property

  @ViewChild(MatTable) table!: MatTable<SemestreDto>;
  @ViewChild('semestreForm') semestreForm!: NgForm;

  constructor(private semestreService: SemestreService) {}

  ngOnInit() {
    this.semestres$.subscribe(data => {
      if (data) {
        this.dataSource.data = data;
      } else {
        this.dataSource.data = [];
      }
    });
  }

  getSemestre(id: number) {
    this.selectedSemestre$ = this.semestreService.getSemestreById(id);
  }

  createSemestre(semestre: SemestreDto) {
    this.semestreService.createSemestre(semestre).subscribe(() => {
      this.semestres$ = this.semestreService.getAllSemestres();
      this.semestres$.subscribe(data => {
        if (data) this.dataSource.data = data;
      });
      this.showForm = false;
      this.semestreForm.reset();
      this.newSemestre = { nom: '', panierIds: [] }; // Reset newSemestre
      this.editMode = false; // Reset edit mode
    });
  }

  updateSemestre(semestre: SemestreDto) {
    if (semestre.id) {
      this.semestreService.updateSemestre(semestre).subscribe(() => {
        this.semestres$ = this.semestreService.getAllSemestres();
        this.semestres$.subscribe(data => {
          if (data) this.dataSource.data = data;
        });
        this.showForm = false;
        this.semestreForm.reset();
        this.newSemestre = { nom: '', panierIds: [] }; // Reset newSemestre
        this.editMode = false; // Reset edit mode
      });
    }
  }

  deleteSemestre(id: number) {
    this.semestreService.deleteSemestre(id).subscribe(() => {
      this.semestres$ = this.semestreService.getAllSemestres();
      this.semestres$.subscribe(data => {
        if (data) this.dataSource.data = data;
      });
    });
  }

  onSubmit(formValue: any) {
    const semestre: SemestreDto = {
      id: this.editMode ? this.newSemestre.id : undefined, // Preserve id if editing
      nom: formValue.nom,
      panierIds: this.panierIdsString.split(',').map(id => +id.trim()).filter(id => !isNaN(id))
    };
    if (this.editMode) {
      this.updateSemestre(semestre);
    } else {
      this.createSemestre(semestre);
    }
  }

  updatePanierIds(value: string) {
    this.panierIdsString = value;
  }

  openForm() {
    this.showForm = true;
    this.panierIdsString = '';
    this.editMode = false; // Default to add mode
    this.newSemestre = { nom: '', panierIds: [] }; // Reset form
  }

  cancelForm() {
    this.showForm = false;
    this.semestreForm.reset();
    this.newSemestre = { nom: '', panierIds: [] }; // Reset newSemestre
    this.editMode = false; // Reset edit mode
  }

  editSemestre(element: SemestreDto) { // Add editSemestre method
    this.editMode = true;
    this.showForm = true;
    this.newSemestre = { ...element }; // Copy the selected semester
    this.panierIdsString = element.panierIds ? element.panierIds.join(',') : '';
  }
}