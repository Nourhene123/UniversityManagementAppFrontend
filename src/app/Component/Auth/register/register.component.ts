import { Router } from '@angular/router';
import { AuthService } from 'src/app/Services/Auth/auth.service';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      nom: ['', [Validators.required]],
      prenom: ['', [Validators.required]],
      departement: ['']
    });
  }

  ngOnInit(): void {}

  onSubmit(): void {
    if (this.registerForm.valid) {
      const { email, password, nom, prenom, departement } = this.registerForm.value;
      this.authService.register({ email, password, nom, prenom, departement }).subscribe({
        next: (response) => {
          console.log('Registration successful', response);
          this.router.navigate(['/login']);
        },
        error: (error) => {
          console.error('Registration failed', error);
        }
      });
    }
  }
}