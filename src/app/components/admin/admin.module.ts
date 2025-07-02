import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AdminRoutingModule } from './admin-routing.module';
import { LayoutComponent } from './dashboard/layout/layout.component';
import { SidebarComponent } from './dashboard/layout/sidebar/sidebar.component';
import { HeaderComponent } from './dashboard/layout/header/header.component';
import { PanierComponent } from './paniers/panier/panier.component';
import { SemestreComponent } from './semestres/semestre/semestre.component';
import { ParcourComponent } from './parcours/parcour/parcour.component';
import { MatiereService } from 'src/app/Services/MatierService/matiere.service';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatiereComponent } from './matiere/matiere/matiere.component';
import { EnseignantsComponent } from './UserManagement/enseignants/enseignants.component';
import { EtudiantsComponent } from './UserManagement/etudiants/etudiants.component';
import { AdminDashboardComponent } from './dashboard/admin-dashboard/admin-dashboard.component';


@NgModule({
  declarations: [
    LayoutComponent,
    SidebarComponent,
    HeaderComponent,
    PanierComponent,
    SemestreComponent,
    ParcourComponent,
    MatiereComponent,
    EnseignantsComponent,
    EtudiantsComponent,
    AdminDashboardComponent
  ],
  imports: [
    CommonModule,
    AdminRoutingModule,
     FormsModule,
    MatTableModule,MatTableModule, 
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule
  ],
  providers: [MatiereService]
})
export class AdminModule { }
