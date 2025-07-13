import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { authGuard } from 'src/app/AuthGuard/auth.guard';
import { LayoutComponent } from 'src/app/shared/layout/layout.component';
import {DashboardEnsignantComponent } from './dashboardEnseignant/dashboard.component';

const routes: Routes = [
{
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: DashboardEnsignantComponent },]
}];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class EnseignantRoutingModule { }
