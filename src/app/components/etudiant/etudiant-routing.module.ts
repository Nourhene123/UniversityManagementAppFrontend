import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EvaluationDashboardComponent } from './evaluation-dashboard/evaluation-dashboard.component';
import { NotesComponent } from './notes/notes.component';
import { authGuard } from 'src/app/AuthGuard/auth.guard';
import { LayoutComponent } from 'src/app/shared/layout/layout.component';

const routes: Routes = [
 {
     path: '',
     component: LayoutComponent,
     canActivate: [authGuard],
     children: [
       { path: 'dashboard', component: EvaluationDashboardComponent },
       { path: 'EvaluationNote', component: NotesComponent },
       { path: 'dashboard', component: EvaluationDashboardComponent },] }  
       
];
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class EtudiantRoutingModule {}