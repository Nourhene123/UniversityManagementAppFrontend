// src/app/admin-workflow/admin-workflow.component.ts
import { Component, OnInit, OnDestroy, ViewChild, ViewChildren, QueryList, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatStepper } from '@angular/material/stepper';
import { Subscription } from 'rxjs';
import { EnseignantDto } from 'src/app/models/EnseignantDto';
import { EtudiantDto } from 'src/app/models/EtudiantDto';
import { MatiereDto } from 'src/app/models/MatiereDto';
import { SemestreDto } from 'src/app/models/SemestreDto';
import { PanierDto } from 'src/app/models/PanierDto';
import { ParcourDto } from 'src/app/models/ParcourDto';
import { ClasseDto } from 'src/app/models/ClasseDto';
import { ChatService } from 'src/app/Services/ChatService';
import { EnseignantsComponent } from '../UserManagement/enseignants/enseignants.component';
import { EtudiantsComponent } from '../UserManagement/etudiants/etudiants.component';
import { MatiereComponent } from '../matiere/matiere/matiere.component';
import { SemestreComponent } from '../semestres/semestre/semestre.component';
import { PanierComponent } from '../paniers/panier/panier.component';
import { ParcourComponent } from '../parcours/parcour/parcour.component';
import { ClasseComponent } from '../classe/classe.component';
import { MatDialog } from '@angular/material/dialog';
import { AffectationDialogComponent } from '../parcours/parcour/affectation-dialog/affectation-dialog.component';

@Component({
  selector: 'app-adminworkflow',
  templateUrl: './admin-workflow.component.html',
  styleUrls: ['./admin-workflow.component.css']
})
export class AdminWorkflowComponent implements OnInit, OnDestroy {
  @ViewChild('stepper') stepper!: MatStepper;
  @ViewChildren(EnseignantsComponent) enseignantComponents!: QueryList<EnseignantsComponent>;
  @ViewChildren(EtudiantsComponent) etudiantComponents!: QueryList<EtudiantsComponent>;
  @ViewChildren(MatiereComponent) matiereComponents!: QueryList<MatiereComponent>;
  @ViewChildren(SemestreComponent) semestreComponents!: QueryList<SemestreComponent>;
  @ViewChildren(PanierComponent) panierComponents!: QueryList<PanierComponent>;
  @ViewChildren(ParcourComponent) parcourComponents!: QueryList<ParcourComponent>;
  @ViewChildren(ClasseComponent) classeComponents!: QueryList<ClasseComponent>;

  enseignantForm!: FormGroup;
  etudiantForm!: FormGroup;
  matiereForm!: FormGroup;
  semestreForm!: FormGroup;
  panierForm!: FormGroup;
  parcourForm!: FormGroup;
  classeForm!: FormGroup;

  enseignants: EnseignantDto[] = [];
  etudiants: EtudiantDto[] = [];
  matieresData: MatiereDto[] = [];
  semestresData: SemestreDto[] = [];
  paniersData: PanierDto[] = [];
  parcoursData: ParcourDto[] = [];
  classesData: ClasseDto[] = [];
  enseignantNomMap: { [key: number]: string } = {};
  etudiantNomMap: { [key: number]: string } = {};
  semestreNomMap: { [key: number]: string } = {};
  panierNomMap: { [key: number]: string } = {};
  parcourNomMap: { [key: number]: string } = {};
  isSubmitting = false;

  private workflowSubscription!: Subscription;

  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private chatService: ChatService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) {
    this.initForms();
  }

  ngOnInit(): void {
    this.workflowSubscription = this.chatService.workflow$.subscribe(data => {
      console.log('Workflow data updated:', data);
      this.enseignants = data.enseignants || [];
      this.etudiants = data.etudiants || [];
      this.matieresData = data.matieres || [];
      this.semestresData = data.semestres || [];
      this.paniersData = data.paniers || [];
      this.parcoursData = data.parcours || [];
      this.classesData = data.classes || [];
      this.updateMaps();
      this.cdr.markForCheck(); // Use markForCheck instead of detectChanges
    });
  }

  ngOnDestroy(): void {
    this.workflowSubscription?.unsubscribe();
  }

  initForms() {
    this.enseignantForm = this.fb.group({ dummy: [null, Validators.required] });
    this.etudiantForm = this.fb.group({ dummy: [null, Validators.required] });
    this.matiereForm = this.fb.group({ dummy: [null, Validators.required] });
    this.semestreForm = this.fb.group({ dummy: [null, Validators.required] });
    this.panierForm = this.fb.group({ dummy: [null, Validators.required] });
    this.parcourForm = this.fb.group({ dummy: [null, Validators.required] });
    this.classeForm = this.fb.group({ dummy: [null, Validators.required] });
  }

  private updateMaps() {
    this.enseignantNomMap = this.enseignants.reduce((map, user) => {
      if (user.id !== undefined && user.nom && user.prenom && user.role === 'Enseignant') {
        map[user.id] = `${user.nom} ${user.prenom}`;
      } else {
        console.warn('Invalid enseignant:', user);
      }
      return map;
    }, {} as { [key: number]: string });

    this.etudiantNomMap = this.etudiants.reduce((map, user) => {
      if (user.id !== undefined && user.nom && user.prenom && user.role === 'Etudiant') {
        map[user.id] = `${user.nom} ${user.prenom}`;
      } else {
        console.warn('Invalid etudiant:', user);
      }
      return map;
    }, {} as { [key: number]: string });

    this.semestreNomMap = this.semestresData.reduce((map, semestre) => {
      if (semestre.id !== undefined && semestre.nom) {
        map[semestre.id] = semestre.nom;
      } else {
        console.warn('Invalid semestre:', semestre);
      }
      return map;
    }, {} as { [key: number]: string });

    this.panierNomMap = this.paniersData.reduce((map, panier) => {
      if (panier.id !== undefined && panier.nom) {
        map[panier.id] = panier.nom;
      } else {
        console.warn('Invalid panier:', panier);
      }
      return map;
    }, {} as { [key: number]: string });

    this.parcourNomMap = this.parcoursData.reduce((map, parcour) => {
      if (parcour.id !== undefined && parcour.nom) {
        map[parcour.id] = parcour.nom;
      } else {
        console.warn('Invalid parcour:', parcour);
      }
      return map;
    }, {} as { [key: number]: string });

    this.cdr.markForCheck(); // Use markForCheck
  }

  openEnseignantForm(): void {
    const enseignantComponent = this.enseignantComponents.first;
    if (enseignantComponent) {
      enseignantComponent.openForm();
    } else {
      this.snackBar.open('Erreur : composant Enseignants introuvable.', 'Fermer', { duration: 3000 });
    }
  }

  openEtudiantForm(): void {
    const etudiantComponent = this.etudiantComponents.first;
    if (etudiantComponent) {
      etudiantComponent.openForm();
    } else {
      this.snackBar.open('Erreur : composant Étudiants introuvable.', 'Fermer', { duration: 3000 });
    }
  }

  openMatiereForm(): void {
    const matiereComponent = this.matiereComponents.first;
    if (matiereComponent) {
      matiereComponent.openForm();
    } else {
      this.snackBar.open('Erreur : composant Matière introuvable.', 'Fermer', { duration: 3000 });
    }
  }

  openSemestreForm(): void {
    const semestreComponent = this.semestreComponents.first;
    if (semestreComponent) {
      semestreComponent.openForm();
    } else {
      this.snackBar.open('Erreur : composant Semestre introuvable.', 'Fermer', { duration: 3000 });
    }
  }

  openPanierForm(): void {
    const panierComponent = this.panierComponents.first;
    if (panierComponent) {
      panierComponent.openForm();
    } else {
      this.snackBar.open('Erreur : composant Panier introuvable.', 'Fermer', { duration: 3000 });
    }
  }

  openParcourForm(): void {
    const parcourComponent = this.parcourComponents.first;
    if (parcourComponent) {
      parcourComponent.openForm();
    } else {
      this.snackBar.open('Erreur : composant Parcours introuvable.', 'Fermer', { duration: 3000 });
    }
  }

  openClasseForm(): void {
    const classeComponent = this.classeComponents.first;
    if (classeComponent) {
      classeComponent.toggleForm();
    } else {
      this.snackBar.open('Erreur : composant Classe introuvable.', 'Fermer', { duration: 3000 });
    }
  }

  openAssignStudentsToParcour(): void {
    const dialogRef = this.dialog.open(AffectationDialogComponent, {
      width: '600px',
      data: {
        etudiantIds: this.etudiants.map(e => e.id).filter((id): id is number => id !== undefined),
        parcoursAvailable: this.parcoursData
      },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.success) {
        const updatedEtudiants = this.etudiants.map(etudiant => {
          const assignedStudent = result.assigned.find((a: EtudiantDto) => a.id === etudiant.id);
          if (assignedStudent) {
            return { ...etudiant, parcourId: assignedStudent.parcourId };
          }
          return etudiant;
        });
        this.chatService.updateEtudiants(updatedEtudiants);
        console.log('Updated etudiants after parcours assignment:', updatedEtudiants); // Debug log
        this.snackBar.open(`${result.assigned.length} étudiant(s) assigné(s) avec succès.`, 'Fermer', { duration: 3000 });
        this.cdr.markForCheck(); // Use markForCheck
      } else {
        console.log('Assign students to parcour cancelled or failed:', result); // Debug log
      }
      console.log('Parcours step completed:', this.allStudentsAssignedToWorkflowParcour()); // Debug log
    });
  }

  openAssignStudentsToNewParcour(parcour: ParcourDto) {
    if (!parcour.id) {
      this.snackBar.open('ID du parcours manquant.', 'Fermer', { duration: 3000 });
      console.error('Invalid parcour ID:', parcour);
      return;
    }
    const dialogRef = this.dialog.open(AffectationDialogComponent, {
      width: '600px',
      data: {
        parcourId: parcour.id,
        etudiantIds: this.etudiants.map(e => e.id).filter((id): id is number => id !== undefined),
        parcoursAvailable: this.parcoursData,
        enforceAssignment: true
      },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('Assign students to new parcour result:', result); // Debug log
      if (result && result.success && result.assigned.length > 0) {
        const updatedEtudiants = this.etudiants.map(etudiant => {
          const assignedStudent = result.assigned.find((a: EtudiantDto) => a.id === etudiant.id);
          if (assignedStudent && assignedStudent.parcourId) {
            return { ...etudiant, parcourId: assignedStudent.parcourId };
          }
          return etudiant;
        });
        this.chatService.updateEtudiants(updatedEtudiants);
        console.log('Updated etudiants after new parcours assignment:', updatedEtudiants); // Debug log
        this.snackBar.open(`${result.assigned.length} étudiant(s) assigné(s) au parcours ${parcour.nom}.`, 'Fermer', { duration: 3000 });
        this.cdr.markForCheck(); // Use markForCheck
        if (this.allStudentsAssignedToWorkflowParcour()) {
          this.stepper.next();
        } else {
          this.snackBar.open('Tous les étudiants doivent être assignés à un parcours du workflow pour passer à l\'étape suivante.', 'Fermer', { duration: 3000 });
          console.log('Cannot proceed: not all students assigned', this.etudiants); // Debug log
        }
      } else {
        this.snackBar.open('Échec de l\'assignation des étudiants. Veuillez réessayer.', 'Fermer', { duration: 3000 });
        console.log('Assignment failed or cancelled:', result); // Debug log
      }
    });
  }

  openAssignStudentsToClasse(): void {
    const dialogRef = this.dialog.open(AffectationDialogComponent, {
      width: '600px',
      data: {
        classeId: null,
        etudiantIds: this.etudiants.map(e => e.id).filter((id): id is number => id !== undefined),
        classesAvailable: this.classesData
      },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.success) {
        const classeId = result.classeId;
        if (classeId) {
          const classe = this.classesData.find(c => c.id === classeId);
          if (classe) {
            const updatedClasse = { ...classe, etudiantIds: [...(classe.etudiantIds || []), ...result.assigned.map((e: EtudiantDto) => e.id)] };
            this.chatService.sendClasse(updatedClasse);
            console.log('Updated classe with new students:', updatedClasse); // Debug log
            this.snackBar.open(`${result.assigned.length} étudiant(s) assigné(s) à la classe ${classe.nom}.`, 'Fermer', { duration: 3000 });
            this.cdr.markForCheck(); // Use markForCheck
          }
        }
      }
      console.log('Classe step completed:', this.allStudentsAssignedToClasse()); // Debug log
    });
  }

  getEnseignantNom(enseignantId: number | undefined): string {
    return enseignantId ? this.enseignantNomMap[enseignantId] || 'Unknown' : 'N/A';
  }

  getEtudiantNom(etudiantId: number | undefined): string {
    return etudiantId ? this.etudiantNomMap[etudiantId] || 'Unknown' : 'N/A';
  }

  getSemestreNom(semestreId: number | undefined): string {
    return semestreId ? this.semestreNomMap[semestreId] || 'Non trouvé' : 'Non assigné';
  }

  getPanierNames(panierIds: number[] | undefined): string {
    if (!panierIds || panierIds.length === 0) {
      return 'Aucun';
    }
    return panierIds.map(id => this.panierNomMap[id] || 'Inconnu').join(', ');
  }

  getParcourNom(parcourId: number | undefined): string {
    return parcourId ? this.parcourNomMap[parcourId] || 'Non trouvé' : 'Non assigné';
  }

  onEnseignantChange(enseignant: EnseignantDto) {
    if (!enseignant.nom || !enseignant.prenom || !enseignant.email || !enseignant.id) {
      this.snackBar.open('Données de l\'enseignant incomplètes ou ID manquant.', 'Fermer', { duration: 3000 });
      return;
    }
    if (enseignant.role !== 'Enseignant') {
      this.snackBar.open('Rôle invalide pour un enseignant.', 'Fermer', { duration: 3000 });
      return;
    }
    if (this.enseignants.some(e => e.email === enseignant.email && e.id !== enseignant.id)) {
      this.snackBar.open('Enseignant déjà existant.', 'Fermer', { duration: 3000 });
      return;
    }
    this.chatService.sendEnseignant(enseignant);
    this.snackBar.open('Enseignant ajouté !', 'Fermer', { duration: 3000 });
    this.stepper.next();
  }

  onEtudiantChange(etudiant: EtudiantDto) {
    if (!etudiant.nom || !etudiant.prenom || !etudiant.email || !etudiant.id) {
      this.snackBar.open('Données de l\'étudiant incomplètes ou ID manquant.', 'Fermer', { duration: 3000 });
      console.error('Invalid EtudiantDto:', etudiant);
      return;
    }
    if (etudiant.role !== 'Etudiant') {
      this.snackBar.open('Rôle invalide pour un étudiant.', 'Fermer', { duration: 3000 });
      return;
    }
    if (this.etudiants.some(e => e.email === etudiant.email && e.id !== etudiant.id)) {
      this.snackBar.open('Étudiant déjà existant.', 'Fermer', { duration: 3000 });
      return;
    }
    this.chatService.sendEtudiant(etudiant);
    this.snackBar.open('Étudiant ajouté !', 'Fermer', { duration: 3000 });
    this.stepper.next();
  }

  onMatiereChange(matiere: MatiereDto) {
    if (!matiere.nom || !matiere.id) {
      this.snackBar.open('Nom de la matière ou ID manquant.', 'Fermer', { duration: 3000 });
      return;
    }
    if (this.matieresData.some(m => m.nom === matiere.nom && m.id !== matiere.id)) {
      this.snackBar.open('Matière déjà existante.', 'Fermer', { duration: 3000 });
      return;
    }
    this.chatService.sendMatiere(matiere);
    this.snackBar.open('Matière ajoutée !', 'Fermer', { duration: 3000 });
    this.stepper.next();
  }

  onSemestreChange(semestre: SemestreDto) {
    if (!semestre.nom || !semestre.id) {
      this.snackBar.open('Nom du semestre ou ID manquant.', 'Fermer', { duration: 3000 });
      return;
    }
    if (this.semestresData.some(s => s.nom === semestre.nom && s.id !== semestre.id)) {
      this.snackBar.open('Semestre déjà existant.', 'Fermer', { duration: 3000 });
      return;
    }
    this.chatService.sendSemestre(semestre);
    this.snackBar.open('Semestre ajouté !', 'Fermer', { duration: 3000 });
    this.stepper.next();
  }

  onPanierChange(panier: PanierDto) {
    if (!panier.nom || !panier.id) {
      this.snackBar.open('Nom du panier ou ID manquant.', 'Fermer', { duration: 3000 });
      return;
    }
    if (this.paniersData.some(p => p.nom === panier.nom && p.id !== panier.id)) {
      this.snackBar.open('Panier déjà existant.', 'Fermer', { duration: 3000 });
      return;
    }
    this.chatService.sendPanier(panier);
    this.snackBar.open('Panier ajouté !', 'Fermer', { duration: 3000 });
    this.stepper.next();
  }

  onParcourChange(parcour: ParcourDto) {
    if (!parcour.nom || !parcour.id) {
      this.snackBar.open('Nom du parcours ou ID manquant.', 'Fermer', { duration: 3000 });
      console.error('Invalid ParcourDto:', parcour);
      return;
    }
    if (this.parcoursData.some(p => p.nom === parcour.nom && p.id !== parcour.id)) {
      this.snackBar.open('Parcours déjà existant.', 'Fermer', { duration: 3000 });
      return;
    }
    this.chatService.sendParcour(parcour);
    this.parcoursData = [...this.parcoursData, parcour];
    this.snackBar.open('Parcours ajouté !', 'Fermer', { duration: 3000 });
    console.log('Added parcour:', parcour); // Debug log
    if (this.etudiants.length > 0) {
      this.openAssignStudentsToNewParcour(parcour);
    } else {
      this.stepper.next();
    }
  }

  onClasseChange(classe: ClasseDto) {
    if (!classe.nom || !classe.section || !classe.parcourId || !classe.id) {
      this.snackBar.open('Données de la classe incomplètes ou ID manquant.', 'Fermer', { duration: 3000 });
      console.error('Invalid ClasseDto:', classe);
      return;
    }
    if (this.classesData.some(c => c.nom === classe.nom && c.section === classe.section && c.id !== classe.id)) {
      this.snackBar.open('Classe déjà existante.', 'Fermer', { duration: 3000 });
      console.warn('Duplicate class detected:', classe);
      return;
    }
    if (!this.parcoursData.some(p => p.id === classe.parcourId)) {
      this.snackBar.open('La classe doit être associée à un parcours créé dans le workflow.', 'Fermer', { duration: 3000 });
      console.error('Class associated with non-workflow parcours:', classe);
      return;
    }
    console.log('Adding class to ChatService:', classe); // Debug log
    this.chatService.sendClasse(classe);
    if (!this.classesData.some(c => c.id === classe.id)) {
      this.classesData = [...this.classesData, classe];
      console.log('Updated classesData:', this.classesData); // Debug log
    }
    this.snackBar.open('Classe ajoutée !', 'Fermer', { duration: 3000 });
    this.cdr.markForCheck(); // Use markForCheck
    this.stepper.next();
  }

  allStudentsAssignedToWorkflowParcour(): boolean {
    const workflowParcourIds = new Set(this.parcoursData.map(p => p.id).filter((id): id is number => id !== undefined));
    const allAssigned = this.etudiants.every(etudiant => 
      etudiant.parcourId !== undefined && 
      etudiant.parcourId !== null && 
      workflowParcourIds.has(etudiant.parcourId)
    );
    console.log('allStudentsAssignedToWorkflowParcour:', allAssigned, 'etudiants:', this.etudiants, 'workflowParcourIds:', workflowParcourIds); // Debug log
    return allAssigned;
  }

  allStudentsAssignedToClasse(): boolean {
    const assignedStudentIds = new Set(this.classesData.flatMap(classe => classe.etudiantIds || []));
    const allAssigned = this.etudiants.every(etudiant => etudiant.id !== undefined && assignedStudentIds.has(etudiant.id));
    console.log('allStudentsAssignedToClasse:', allAssigned, 'assignedStudentIds:', assignedStudentIds); // Debug log
    return allAssigned;
  }

  saveAll() {
    if (
      !this.enseignants.length ||
      !this.etudiants.length ||
      !this.matieresData.length ||
      !this.semestresData.length ||
      !this.paniersData.length ||
      !this.parcoursData.length ||
      !this.classesData.length ||
      !this.allStudentsAssignedToWorkflowParcour() ||
      !this.allStudentsAssignedToClasse()
    ) {
      this.snackBar.open('Veuillez compléter toutes les étapes et assigner tous les étudiants à un parcours et une classe du workflow.', 'Fermer', { duration: 3000 });
      return;
    }

    this.isSubmitting = true;
    this.snackBar.open('Toutes les données sont déjà sauvegardées.', 'Fermer', { duration: 3000 });
    this.isSubmitting = false;
    this.chatService.resetAll();
    this.stepper.reset();
    this.enseignantForm.reset({ dummy: null });
    this.etudiantForm.reset({ dummy: null });
    this.matiereForm.reset({ dummy: null });
    this.semestreForm.reset({ dummy: null });
    this.panierForm.reset({ dummy: null });
    this.parcourForm.reset({ dummy: null });
    this.classeForm.reset({ dummy: null });
    this.cdr.markForCheck(); // Use markForCheck
  }

  resetWorkflow() {
    this.chatService.resetAll();
    this.stepper.reset();
    this.enseignantForm.reset({ dummy: null });
    this.etudiantForm.reset({ dummy: null });
    this.matiereForm.reset({ dummy: null });
    this.semestreForm.reset({ dummy: null });
    this.panierForm.reset({ dummy: null });
    this.parcourForm.reset({ dummy: null });
    this.classeForm.reset({ dummy: null });
    this.snackBar.open('Workflow réinitialisé.', 'Fermer', { duration: 3000 });
    this.cdr.markForCheck(); // Use markForCheck
  }
}