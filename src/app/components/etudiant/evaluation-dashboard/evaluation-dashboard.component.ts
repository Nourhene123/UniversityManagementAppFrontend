
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatListModule } from '@angular/material/list';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { HttpClient } from '@angular/common/http';
import { AuthService } from 'src/app/Services/Auth/auth.service';
import { Observable, forkJoin, catchError, of } from 'rxjs';

@Component({
  selector: 'app-evaluation-dashboard',
  templateUrl: './evaluation-dashboard.component.html',
  styleUrls: ['./evaluation-dashboard.component.css'],
})
export class EvaluationDashboardComponent {
}