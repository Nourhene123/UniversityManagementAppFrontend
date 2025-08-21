import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EvaluationDashboardComponent } from './evaluation-dashboard/evaluation-dashboard.component';
import { authGuard } from 'src/app/AuthGuard/auth.guard';

const routes: Routes = [
 
  {
    path: 'dashboard',
    canActivate:  [authGuard],
    component: EvaluationDashboardComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class EtudiantRoutingModule { }