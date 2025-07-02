import { Router } from '@angular/router';
import { AuthService } from 'src/app/Services/Auth/auth.service';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent  {
  loginForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      staySignedIn: [false]
    });
  }

  ngOnInit(): void {}

  onSubmit(): void {
    if (this.loginForm.valid) {
      const { email, password, staySignedIn } = this.loginForm.value;
      this.authService.login({ email, password, staySignedIn }).subscribe({
        next: (response) => {
          console.log('Login successful', response);
         this.router.navigate(['/admin/dashboard']);

        },
        error: (error) => {
          console.error('Login failed', error);
        }
      });
    }
  }
}