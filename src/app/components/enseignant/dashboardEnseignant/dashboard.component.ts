import { Component, OnInit, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin, of, switchMap, catchError, tap, map } from 'rxjs';
import { Chart, registerables } from 'chart.js';

import { NoteDto, TypeNote } from 'src/app/models/NoteDto';
import { ParcourDto } from 'src/app/models/ParcourDto';
import { MatiereDto } from 'src/app/models/MatiereDto';
import { EtudiantDto } from 'src/app/models/EtudiantDto';
import { TypeNoteCoefficientDto } from 'src/app/models/TypeNoteCoefficientDto';
import { NoteService } from 'src/app/Services/NoteService/note.service';
import { MatiereService } from 'src/app/Services/MatierService/matiere.service';
import { ParcourService } from 'src/app/Services/ParcourService/parcour.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardEnsignantComponent{}
