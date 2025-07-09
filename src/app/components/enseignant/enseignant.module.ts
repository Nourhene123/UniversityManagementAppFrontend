import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { EnseignantRoutingModule } from './enseignant-routing.module';
import { LayoutComponent } from './layout/layout.component';
import { SidebarComponent } from './layout/sidebar/sidebar.component';
import { HeaderComponent } from './layout/header/header.component';


@NgModule({
  declarations: [
    LayoutComponent,
    SidebarComponent,
    HeaderComponent
  ],
  imports: [
    CommonModule,
    EnseignantRoutingModule
  ]
})
export class EnseignantModule { }
