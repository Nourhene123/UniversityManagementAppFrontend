import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { EnseignantRoutingModule } from './enseignant-routing.module';
import { DashboardEnsignantComponent} from './dashboardEnseignant/dashboard.component';
import { NotesComponent } from './notes/notes.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';


@NgModule({
  declarations: [
   DashboardEnsignantComponent,
   NotesComponent
  ],
  imports: [
    CommonModule,
    EnseignantRoutingModule
    ,SharedModule,
    MatFormFieldModule,
    MatSelectModule,
    MatOptionModule,
    MatInputModule,
    MatTableModule,
    MatProgressSpinnerModule,
     FormsModule
  ]
})
export class EnseignantModule { }
