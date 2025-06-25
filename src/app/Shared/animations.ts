import { trigger, state, style, transition, animate } from '@angular/animations';

export const fadeInOut = trigger('fadeInOut', [
  state('void', style({ opacity: 0, transform: 'translateY(40px)' })),
  transition(':enter', [
    animate('0.8s ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
  ]),
  transition(':leave', [
    animate('0.5s ease-in', style({ opacity: 0, transform: 'translateY(40px)' })),
  ]),
]);

export const buttonHover = trigger('buttonHover', [
  state('normal', style({ transform: 'scale(1)', 'box-shadow': '0 4px 15px rgba(0, 48, 135, 0.2)' })),
  state('hovered', style({ transform: 'scale(1.03)', 'box-shadow': '0 6px 20px rgba(0, 48, 135, 0.3)' })),
  transition('normal <=> hovered', animate('0.3s ease-in-out')),
]);

export const scaleIn = trigger('scaleIn', [
  state('void', style({ opacity: 0, transform: 'scale(0.95) translateY(20px)' })),
  transition(':enter', [
    animate('0.6s ease-out', style({ opacity: 1, transform: 'scale(1) translateY(0)' })),
  ]),
]);