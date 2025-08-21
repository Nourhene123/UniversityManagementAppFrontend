import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { authGuard } from './AuthGuard/auth.guard';
import { LoginComponent } from './components/auth/login/login.component';
import { RegisterComponent } from './components/auth/register/register.component';
import { AdminDashboardComponent } from './components/admin/dashboard/admin-dashboard/admin-dashboard.component';

const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
 
  { path: 'admin', loadChildren: () => import('./components/admin/admin.module').then(m => m.AdminModule) }
  ,{
    path: 'enseignant',
    loadChildren: () => import('./components/enseignant/enseignant.module').then(m => m.EnseignantModule)
  }
   ,{
    path: 'etudaint',
    loadChildren: () => import('./components/etudiant/etudiant.module').then(m => m.EtudiantModule)
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
