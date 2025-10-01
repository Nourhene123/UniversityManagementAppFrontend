import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatListModule } from '@angular/material/list';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { EvaluationDashboardComponent } from './evaluation-dashboard/evaluation-dashboard.component';
import { NotesComponent } from './notes/notes.component';
import { EtudiantRoutingModule } from './etudiant-routing.module';
import { NgChartsModule } from 'ng2-charts';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@NgModule({
  declarations: [
    EvaluationDashboardComponent,
    NotesComponent,
  ],
  imports: [
    CommonModule,
    MatSidenavModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatToolbarModule,
    MatIconModule,
   MatCardModule, 
   MatTableModule,
   MatProgressSpinnerModule,
    MatIconModule,
    MatListModule,
     NgChartsModule,
    MatMenuModule,
    MatListModule,
    MatTableModule,
    MatCardModule,
    RouterModule,
    EtudiantRoutingModule
  ]
})
export class EtudiantModule { }