import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { EnseignantRoutingModule } from './enseignant-routing.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { DashboardEnsignantComponent} from './dashboardEnseignant/dashboard.component';


@NgModule({
  declarations: [
   DashboardEnsignantComponent
  ],
  imports: [
    CommonModule,
    EnseignantRoutingModule
    ,SharedModule
  ]
})
export class EnseignantModule { }
