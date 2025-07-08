import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminDashboardComponent } from './dashboard/admin-dashboard/admin-dashboard.component';
import { authGuard } from 'src/app/AuthGuard/auth.guard';
import { LayoutComponent } from './dashboard/layout/layout.component';
import { ParcourComponent } from './parcours/parcour/parcour.component';
import { MatiereComponent } from './matiere/matiere/matiere.component';
import { SemestreComponent } from './semestres/semestre/semestre.component';
import { EtudiantsComponent } from './UserManagement/etudiants/etudiants.component';
import { EnseignantsComponent } from './UserManagement/enseignants/enseignants.component';
import { PanierComponent } from './paniers/panier/panier.component';

const routes: Routes = [
   {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: AdminDashboardComponent },
      { path: 'Matier', component:MatiereComponent },
      { path: 'Parcour', component:ParcourComponent },
      { path: 'Semestre', component:SemestreComponent},
       { path: 'Panier', component:PanierComponent},
      { path: 'Etudiant', component:EtudiantsComponent},
     
       { path: 'Enseignants', component:EnseignantsComponent},

        

     
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
