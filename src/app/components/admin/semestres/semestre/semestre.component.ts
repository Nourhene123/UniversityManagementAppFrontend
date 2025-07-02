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
    });
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
      id: 0,
      nom: formValue.nom,
      panierIds: this.panierIdsString.split(',').map(id => +id.trim()).filter(id => !isNaN(id))
    };
    this.createSemestre(semestre);
  }

  updatePanierIds(value: string) {
    this.panierIdsString = value;
  }

  openForm() {
    this.showForm = true;
    this.panierIdsString = '';
  }

  cancelForm() {
    this.showForm = false;
    this.semestreForm.reset();
  }
}