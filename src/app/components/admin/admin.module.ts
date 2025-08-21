import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AdminRoutingModule } from './admin-routing.module';
import { PanierComponent } from './paniers/panier/panier.component';
import { SemestreComponent } from './semestres/semestre/semestre.component';
import { MatiereService } from 'src/app/Services/MatierService/matiere.service';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';

import { MatStepperModule } from '@angular/material/stepper';
import { MatExpansionModule } from '@angular/material/expansion';

import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {  ReactiveFormsModule } from '@angular/forms';
import { MatiereComponent } from './matiere/matiere/matiere.component';
import { EnseignantsComponent } from './UserManagement/enseignants/enseignants.component';
import { EtudiantsComponent } from './UserManagement/etudiants/etudiants.component';
import { AdminDashboardComponent } from './dashboard/admin-dashboard/admin-dashboard.component';
import { ParcourComponent } from './parcours/parcour/parcour.component';
import { MatSelectModule } from '@angular/material/select';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthInterceptor } from 'src/app/interceptors/auth.interceptor';
import { SharedModule } from 'src/app/shared/shared.module';
import { AffectationDialogComponent } from './parcours/parcour/affectation-dialog/affectation-dialog.component';

import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { ClasseComponent } from './classe/classe.component';
import { AdminWorkflowComponent } from './admin-workflow/admin-workflow.component';
import { NgChartsModule } from 'ng2-charts';
import { MatPaginatorModule } from '@angular/material/paginator';



@NgModule({
  declarations: [
    PanierComponent,
    SemestreComponent,
    ParcourComponent,
    MatiereComponent,
    EnseignantsComponent,
    EtudiantsComponent,
    AdminDashboardComponent,
    AffectationDialogComponent,
    ClasseComponent,
    AdminWorkflowComponent
  ],
  imports: [
    CommonModule,
    AdminRoutingModule,
     FormsModule,
     RouterModule,
        MatPaginatorModule,
     MatProgressSpinnerModule,
     MatTabsModule,
    MatCardModule,
      MatDialogModule,
      NgChartsModule, 
      MatExpansionModule,
    MatIconModule,
    MatInputModule,
    MatStepperModule,
    MatButtonModule,
    MatTableModule, 
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
      MatInputModule,  
      MatDialogModule,
    MatInputModule,
    ReactiveFormsModule,
    MatSelectModule,
      MatListModule,
      MatCheckboxModule,
 MatSnackBarModule ,
    SharedModule
  ],
  providers: [MatiereService,  {
        provide: HTTP_INTERCEPTORS,
        useClass: AuthInterceptor,
        multi: true
      }],
   exports: [AffectationDialogComponent, ParcourComponent]
})
export class AdminModule { }
