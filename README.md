# Gestion Universitaire App - Frontend

A modern, responsive university management system frontend built with **Angular 16** and styled with **Tailwind CSS**. Provides intuitive interfaces for administrators, teachers, and students to manage academic data, grades, and more.

## ✨ Features

### Role-Based Dashboards

| Role | Features |
|------|----------|
| **👨‍💼 Administrator** | Full system management (users, parcours, classes, subjects, grades) |
| **👨‍🏫 Teacher (Enseignant)** | Grade management, student performance analytics, class overview |
| **👨‍🎓 Student (Étudiant)** | Grade viewing, performance dashboard, academic tracking |

### Key Functionalities

#### For Administrators
- ✅ Manage users (Students, Teachers, Admins)
- ✅ Configure academic pathways (Parcours)
- ✅ Organize classes and sections
- ✅ Manage subjects (Matières) and course bundles (Paniers)
- ✅ Set note coefficients and types
- ✅ View system-wide statistics

#### For Teachers
- ✅ **Enhanced Dashboard** with:
  - Success rate charts by parcours
  - Top/Bottom student performance visualization
  - Trend analysis (evolution over time)
  - Class comparison radar charts
  - At-risk student alerts with notification
- ✅ Grade entry for assigned subjects (DS, Examen, TP)
- ✅ Class and student management
- ✅ **PDF Report Generation**
- ✅ **CSV Data Export**
- ✅ Real-time performance indicators

#### For Students
- ✅ Personal grade dashboard
- ✅ Performance analytics and statistics
- ✅ Subject-wise grade breakdown
- ✅ Visual charts (Radar, Bar charts)
- ✅ Personalized recommendations based on performance
- ✅ Academic progress tracking

### Technical Highlights
- 🎨 Modern dark theme UI with Tailwind CSS
- 📊 Interactive charts with Chart.js and ng2-charts
- 🔔 Toast notifications for user feedback
- 🔄 Loading states and skeleton screens
- 📱 Responsive design for all devices
- 🔐 JWT authentication with role-based routing
- 📄 PDF generation for reports
- 📤 CSV export functionality

## 🛠️ Tech Stack

- **Angular**: 16.2.0
- **TypeScript**: 5.1.3
- **Tailwind CSS**: Utility-first styling
- **Angular Material**: UI components
- **Chart.js**: Data visualization
- **ng2-charts**: Angular Chart.js integration
- **FontAwesome**: Icons
- **Bootstrap**: Additional styling
- **jsPDF**: PDF generation
- **RxJS**: Reactive programming

## 📁 Project Structure

```
GestionUniversitaireApp/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── admin/              # Admin components
│   │   │   │   ├── dashboard/
│   │   │   │   ├── utilisateurs/
│   │   │   │   ├── etudiants/
│   │   │   │   ├── enseignants/
│   │   │   │   ├── parcours/
│   │   │   │   ├── classes/
│   │   │   │   ├── matieres/
│   │   │   │   ├── notes/
│   │   │   │   ├── paniers/
│   │   │   │   └── semestres/
│   │   │   ├── auth/               # Authentication components
│   │   │   │   ├── login/
│   │   │   │   └── register/
│   │   │   ├── enseignant/         # Teacher components
│   │   │   │   ├── dashboardEnseignant/
│   │   │   │   └── notes/
│   │   │   └── etudiant/           # Student components
│   │   │       ├── dashboardEtudiant/
│   │   │       ├── notes/
│   │   │       └── evaluation-dashboard/
│   │   ├── Services/               # API services
│   │   │   ├── AuthService/
│   │   │   ├── EtudiantService/
│   │   │   ├── EnseignantService/
│   │   │   ├── MatiereService/
│   │   │   ├── NoteService/
│   │   │   ├── ClasseService/
│   │   │   ├── ParcourService/
│   │   │   └── ...
│   │   ├── guards/                 # Route guards
│   │   ├── models/                 # TypeScript interfaces/DTOs
│   │   └── app.component.*
│   ├── assets/                     # Static assets
│   ├── environments/               # Environment configurations
│   ├── index.html
│   ├── main.ts
│   └── styles.css                  # Global styles
├── angular.json                    # Angular CLI configuration
├── package.json                    # Dependencies
├── tsconfig.json                   # TypeScript configuration
└── tailwind.config.js              # Tailwind CSS configuration
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm 9+ or yarn
- Angular CLI 16+

### Installation

1. **Navigate to the project directory**
```bash
cd plateform-universitaire-frontend/GestionUniversitaireApp
```

2. **Install dependencies**
```bash
npm install
```

3. **Start the development server**
```bash
ng serve
# or
npm start
```

4. **Open your browser**
Navigate to `http://localhost:4200`

### Build for Production

```bash
ng build --configuration production
```

The build artifacts will be stored in `dist/gestion-universitaire-app/`.

## 🔧 Configuration

### API Base URL

Update the API URL in `src/app/Services/*/`: 
```typescript
private apiUrl = 'http://localhost:8080/api';
```

### Environment Variables

Configure environments in `src/environments/`:
```typescript
// environment.ts (development)
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api'
};

// environment.prod.ts (production)
export const environment = {
  production: true,
  apiUrl: 'https://your-production-api.com/api'
};
```

## 🎯 Available Scripts

| Command | Description |
|---------|-------------|
| `ng serve` | Start development server |
| `ng build` | Build the application |
| `ng test` | Run unit tests |
| `ng lint` | Lint the code |
| `ng e2e` | Run end-to-end tests |

## 📱 Application Routes

### Public Routes
| Route | Component | Description |
|-------|-----------|-------------|
| `/login` | LoginComponent | User authentication |
| `/register` | RegisterComponent | User registration |

### Admin Routes (`/admin/*`)
| Route | Component | Description |
|-------|-----------|-------------|
| `/admin/dashboard` | DashboardComponent | Admin overview |
| `/admin/utilisateurs` | UtilisateurComponent | Manage users |
| `/admin/etudiants` | EtudiantComponent | Manage students |
| `/admin/enseignants` | EnseignantComponent | Manage teachers |
| `/admin/parcours` | ParcourComponent | Manage parcours |
| `/admin/classes` | ClasseComponent | Manage classes |
| `/admin/matieres` | MatiereComponent | Manage subjects |
| `/admin/notes` | NoteComponent | Manage grades |
| `/admin/paniers` | PanierComponent | Manage course bundles |
| `/admin/semestres` | SemestreComponent | Manage semesters |

### Teacher Routes (`/enseignant/*`)
| Route | Component | Description |
|-------|-----------|-------------|
| `/enseignant/dashboard` | DashboardEnseignantComponent | Teacher dashboard with analytics |
| `/enseignant/notes` | NotesComponent | Grade management |

### Student Routes (`/etudiant/*`)
| Route | Component | Description |
|-------|-----------|-------------|
| `/etudiant/dashboard` | DashboardEtudiantComponent | Student dashboard |
| `/etudiant/notes` | NotesComponent | View grades |
| `/etudiant/evaluation` | EvaluationDashboardComponent | Performance analytics |

## 🔐 Authentication Flow

1. User logs in via `/login`
2. Backend validates credentials and returns JWT token
3. Token is stored in `localStorage`
4. AuthInterceptor adds token to all API requests
5. AuthGuard protects routes based on user roles

### Role-Based Access

```typescript
// Route guards check user roles
const routes: Routes = [
  { 
    path: 'admin', 
    component: AdminLayout,
    canActivate: [AuthGuard],
    data: { roles: ['ADMIN'] }
  },
  { 
    path: 'enseignant', 
    component: EnseignantLayout,
    canActivate: [AuthGuard],
    data: { roles: ['ENSEIGNANT'] }
  },
  { 
    path: 'etudiant', 
    component: EtudiantLayout,
    canActivate: [AuthGuard],
    data: { roles: ['ETUDIANT'] }
  }
];
```

## 🎨 UI/UX Features

### Dashboard Components
- **Stats Cards**: Animated counters with trend indicators
- **Charts**: Interactive Chart.js visualizations
  - Bar charts for success rates
  - Line charts for trends
  - Radar charts for class comparisons
- **Filter Bars**: Dynamic filtering with pill buttons
- **Alert Banners**: Contextual warnings (at-risk students)
- **Quick Actions**: Export, refresh, notify buttons

### Grade Management
- **Color-Coded Grades**:
  - 🔴 Red: Below 10 (At-risk)
  - 🟢 Emerald: 10-14 (Good)
  - 🟣 Purple: 14+ (Excellent)
- **Dynamic Input Fields**: Add/remove grade entries
- **Coefficient Management**: Weighted average calculations

### Responsive Design
- Mobile-first approach with Tailwind CSS
- Grid layouts that adapt to screen size
- Collapsible navigation for mobile

## 🌐 Backend Integration

This frontend connects to the Spring Boot backend at:
- **Backend URL**: `http://localhost:8080`
- **API Documentation**: `http://localhost:8080/swagger-ui.html`

Ensure the backend is running before starting the frontend.

## 🧪 Testing

```bash
# Run unit tests
ng test

# Run tests with coverage
ng test --code-coverage

# Run end-to-end tests
ng e2e
```

## 📦 Dependencies Overview

### Core Angular
- `@angular/core` - Core framework
- `@angular/router` - Routing
- `@angular/forms` - Forms (Template & Reactive)
- `@angular/http` - HTTP client

### UI & Styling
- `@angular/material` - Material components
- `bootstrap` - CSS framework
- `@fortawesome/angular-fontawesome` - Icons

### Data Visualization
- `chart.js` - Charting library
- `ng2-charts` - Angular Chart.js wrapper

### Utilities
- `rxjs` - Reactive programming
- `jspdf` - PDF generation

## 🐛 Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure backend CORS allows `http://localhost:4200`
2. **401 Unauthorized**: Check JWT token is valid and not expired
3. **Charts not rendering**: Verify Chart.js is properly imported

### Development Tips

- Use Angular DevTools browser extension for debugging
- Enable source maps in `angular.json` for better debugging
- Check Network tab for API request issues

## 📄 License

This project is for educational purposes.

## 👥 Authors

Developed as part of a university internship project (Stage d'été).

---

For questions or support, please contact the development team.
