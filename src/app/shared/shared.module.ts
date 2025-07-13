import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
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
    RouterModule ,
    FormsModule
  ],
  exports: [
    LayoutComponent,
    SidebarComponent,
    HeaderComponent
  ]
})
export class SharedModule { }