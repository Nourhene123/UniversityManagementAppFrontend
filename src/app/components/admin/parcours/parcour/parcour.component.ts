import { Component, OnInit, ViewChild } from '@angular/core';
import { ParcourService } from 'src/app/Services/ParcourService/parcour.service';
import { Observable, of } from 'rxjs'; 
import { MatTableDataSource } from '@angular/material/table';
import { MatTable } from '@angular/material/table';
import { ParcourDto } from 'src/app/models/ParcourDto';

@Component({
  selector: 'app-parcour',
  templateUrl: './parcour.component.html',
  styleUrls: ['./parcour.component.css']
})
export class ParcourComponent implements OnInit {
  parcours$: Observable<ParcourDto[] | null> = this.parcourService.getAllParcours();
  dataSource = new MatTableDataSource<ParcourDto>();
  displayedColumns: string[] = ['id', 'nom', 'annee', 'libelle', 'actions'];
  selectedParcour$: Observable<ParcourDto> | null = null;

  @ViewChild(MatTable) table!: MatTable<ParcourDto>;

  constructor(private parcourService: ParcourService) {}

  ngOnInit() {
    this.parcours$.subscribe(data => {
      if (data) {
        this.dataSource.data = data;
      } else {
        this.dataSource.data = []; // Default to empty array if null
      }
    });
  }

  getParcour(id: number) {
    this.selectedParcour$ = this.parcourService.getParcourById(id);
  }

  createParcour(parcour: ParcourDto) {
    this.parcourService.createParcour(parcour).subscribe(() => {
      this.parcours$ = this.parcourService.getAllParcours();
      this.parcours$.subscribe(data => {
        if (data) this.dataSource.data = data;
      });
    });
  }

  deleteParcour(id: number) {
    this.parcourService.deleteParcour(id).subscribe(() => {
      this.parcours$ = this.parcourService.getAllParcours();
      this.parcours$.subscribe(data => {
        if (data) this.dataSource.data = data;
      });
    });
  }
}