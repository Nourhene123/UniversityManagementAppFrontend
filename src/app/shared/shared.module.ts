import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LayoutComponent } from './layout/layout.component';
import { SidebarComponent } from './layout/sidebar/sidebar.component';
import { HeaderComponent } from './layout/header/header.component';
import { ThemeToggleComponent } from './components/theme-toggle/theme-toggle.component';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@NgModule({
  declarations: [
    LayoutComponent,
    SidebarComponent,
    HeaderComponent,
    ThemeToggleComponent
  ],
  imports: [
    CommonModule,
    RouterModule ,
    FormsModule,
    MatIconModule,
    MatButtonModule
  ],
  exports: [
    LayoutComponent,
    SidebarComponent,
    HeaderComponent,
    ThemeToggleComponent,
    MatIconModule,
    MatButtonModule
  ],
  providers: [
    // ThemeService is provided in root, so no need to declare it here
  ]
})
export class SharedModule { }