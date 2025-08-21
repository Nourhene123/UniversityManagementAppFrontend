
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { EnseignantDto } from '../models/EnseignantDto';
import { EtudiantDto } from '../models/EtudiantDto';
import { MatiereDto } from '../models/MatiereDto';
import { SemestreDto } from '../models/SemestreDto';
import { PanierDto } from '../models/PanierDto';
import { ParcourDto } from '../models/ParcourDto';
import { ClasseDto } from '../models/ClasseDto';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private workflowData = new BehaviorSubject<{
    enseignants: EnseignantDto[];
    etudiants: EtudiantDto[];
    matieres: MatiereDto[];
    semestres: SemestreDto[];
    paniers: PanierDto[];
    parcours: ParcourDto[];
    classes: ClasseDto[];
  }>({
    enseignants: [],
    etudiants: [],
    matieres: [],
    semestres: [],
    paniers: [],
    parcours: [],
    classes: []
  });

  workflow$ = this.workflowData.asObservable();

  sendEnseignant(enseignant: EnseignantDto) {
    if (enseignant.id === 0) {
      console.error('Invalid enseignant ID: 0');
      return;
    }
    const currentData = this.workflowData.value;
    this.workflowData.next({
      ...currentData,
      enseignants: [...currentData.enseignants.filter(e => e.id !== enseignant.id), enseignant]
    });
  }

  sendEtudiant(etudiant: EtudiantDto) {
    if (etudiant.id === 0) {
      console.error('Invalid etudiant ID: 0');
      return;
    }
    const currentData = this.workflowData.value;
    this.workflowData.next({
      ...currentData,
      etudiants: [...currentData.etudiants.filter(e => e.id !== etudiant.id), etudiant]
    });
  }

  updateEtudiants(etudiants: EtudiantDto[]) {
    const currentData = this.workflowData.value;
    const updatedEtudiants = currentData.etudiants.map(existing => {
      const updated = etudiants.find(e => e.id === existing.id);
      return updated || existing;
    });
    this.workflowData.next({
      ...currentData,
      etudiants: updatedEtudiants
    });
    console.log('ChatService updated etudiants:', updatedEtudiants); // Debug log
  }

  sendMatiere(matiere: MatiereDto) {
    if (matiere.id === 0) {
      console.error('Invalid matiere ID: 0');
      return;
    }
    const currentData = this.workflowData.value;
    this.workflowData.next({
      ...currentData,
      matieres: [...currentData.matieres.filter(m => m.id !== matiere.id), matiere]
    });
  }

  sendSemestre(semestre: SemestreDto) {
    if (semestre.id === 0) {
      console.error('Invalid semestre ID: 0');
      return;
    }
    const currentData = this.workflowData.value;
    this.workflowData.next({
      ...currentData,
      semestres: [...currentData.semestres.filter(s => s.id !== semestre.id), semestre]
    });
  }

  sendPanier(panier: PanierDto) {
    if (panier.id === 0) {
      console.error('Invalid panier ID: 0');
      return;
    }
    const currentData = this.workflowData.value;
    this.workflowData.next({
      ...currentData,
      paniers: [...currentData.paniers.filter(p => p.id !== panier.id), panier]
    });
  }

  sendParcour(parcour: ParcourDto) {
    if (parcour.id === 0) {
      console.error('Invalid parcour ID: 0');
      return;
    }
    const currentData = this.workflowData.value;
    this.workflowData.next({
      ...currentData,
      parcours: [...currentData.parcours.filter(p => p.id !== parcour.id), parcour]
    });
  }

  sendClasse(classe: ClasseDto) {
    if (classe.id === 0) {
      console.error('Invalid classe ID: 0');
      return;
    }
    const currentData = this.workflowData.value;
    this.workflowData.next({
      ...currentData,
      classes: [...currentData.classes.filter(c => c.id !== classe.id), classe]
    });
  }

  resetAll() {
    this.workflowData.next({
      enseignants: [],
      etudiants: [],
      matieres: [],
      semestres: [],
      paniers: [],
      parcours: [],
      classes: []
    });
  }
}