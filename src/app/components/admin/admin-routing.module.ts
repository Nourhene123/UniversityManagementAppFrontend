import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminDashboardComponent } from './dashboard/admin-dashboard/admin-dashboard.component';
import { authGuard } from 'src/app/AuthGuard/auth.guard';
import { LayoutComponent } from './dashboard/layout/layout.component';
import { MatiereComponent } from './matieres/matiere/matiere.component';
import { ParcourComponent } from './parcours/parcour/parcour.component';

const routes: Routes = [
   {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: AdminDashboardComponent },
        { path: 'Matier', component:MatiereComponent },
         { path: 'Parcour', component:ParcourComponent },

        

     
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
