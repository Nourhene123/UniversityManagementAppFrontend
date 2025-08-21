import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { EtudiantRoutingModule } from './etudiant-routing.module';
import { EvaluationDashboardComponent } from './evaluation-dashboard/evaluation-dashboard.component';
import { NavbarComponent } from './navbar/navbar.component';


@NgModule({
  declarations: [
  EvaluationDashboardComponent,
    NavbarComponent
  ],
  imports: [
    CommonModule,
    EtudiantRoutingModule
  ]
})
export class EtudiantModule { }
