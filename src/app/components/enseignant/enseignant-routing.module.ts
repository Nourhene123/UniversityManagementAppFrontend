import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { authGuard } from 'src/app/AuthGuard/auth.guard';
import { LayoutComponent } from 'src/app/shared/layout/layout.component';
import {DashboardComponent } from './dashboardEnseignant/dashboard.component';
import { NotesComponent } from './notes/notes.component';

const routes: Routes = [
{
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent },
    { path: 'notes', component: NotesComponent },]
}];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class EnseignantRoutingModule { }
