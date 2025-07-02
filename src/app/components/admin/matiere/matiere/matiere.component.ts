import { Component, OnInit } from '@angular/core';
import { MatiereDto } from 'src/app/models/MatiereDto';
import { MatiereService } from 'src/app/Services/MatierService/matiere.service';

@Component({
  selector: 'app-matiere',
  templateUrl: './matiere.component.html',
  styleUrls: ['./matiere.component.css']
})

export class MatiereComponent implements OnInit {
  matieres: MatiereDto[] = [];
  displayedColumns: string[] = ['id', 'nom', 'volumeHoraire', 'coefficient', 'actions'];

  constructor(private matiereService: MatiereService) {}

  ngOnInit(): void {
    this.loadMatieres();
  }

  loadMatieres(): void {
    this.matiereService.getAllMatieres().subscribe(data => {
      this.matieres = data;
    });
  }

  deleteMatiere(id: number): void {
    if (confirm('Are you sure you want to delete this subject?')) {
      this.matiereService.deleteMatiere(id).subscribe(() => {
        this.loadMatieres();
      });
    }
  }
}