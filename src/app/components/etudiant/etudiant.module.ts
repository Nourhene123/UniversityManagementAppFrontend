import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { EtudiantRoutingModule } from './etudiant-routing.module';
import { EvaluationDashboardComponent } from './evaluation-dashboard/evaluation-dashboard.component';


@NgModule({
  declarations: [
    EvaluationDashboardComponent
  ],
  imports: [
    CommonModule,
    EtudiantRoutingModule
  ]
})
export class EtudiantModule { }
