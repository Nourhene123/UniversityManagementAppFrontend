import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './Component/Auth/login/login.component';
import { RegisterComponent } from './Component/Auth/register/register.component';
import { AdminDashboardComponent } from './Component/Dashboard/admin-dashboard/admin-dashboard.component';
import { SidebarComponent } from './Component/Dashboard/sidebar/sidebar.component';
import { authGuard } from './AuthGuard/auth.guard';

const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'dashboard', component: AdminDashboardComponent , canActivate: [authGuard]},
   { path: 'SiderBar', component: SidebarComponent , canActivate: [authGuard]}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
