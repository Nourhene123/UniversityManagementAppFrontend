import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UserResponse } from 'src/app/models/UserResponse';
import { AuthService } from 'src/app/Services/Auth/auth.service';
import { TokenService } from 'src/app/Services/token.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  loginForm: FormGroup;
  errorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private tokenService: TokenService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      staySignedIn: [false]
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      const { email, password, staySignedIn } = this.loginForm.value;
      this.authService.login({ email, password, staySignedIn }).subscribe({
        next: (response: UserResponse) => {
          console.log('Login API Response:', JSON.stringify(response, null, 2));
          if (!response || !response.id || !response.email || !response.role || !response.token) {
            this.errorMessage = 'Invalid response from server: missing required fields. Please contact support.';
            console.error('Invalid response:', JSON.stringify(response, null, 2));
            return;
          }
          const role = response.role.toLowerCase().replace('role_', '');
          switch (role) {
            case 'administrateur':
              this.router.navigate(['/admin/dashboard']);
              break;
            case 'enseignant':
              this.router.navigate(['/enseignant/dashboard']);
              break;
            case 'etudiant':
              this.router.navigate(['etudaint/dashboard']); 
              break;
            default:
              this.errorMessage = `Unknown role: ${response.role}. Please contact support.`;
              console.error('Unknown role:', response.role);
          }
        },
        error: (error) => {
          console.error('Login error:', JSON.stringify(error, null, 2));
          if (error.status === 401) {
            this.errorMessage = error.error || 'Invalid email or password.';
          } else if (error.status === 404) {
            this.errorMessage = 'User not found.';
          } else if (error.status === 500) {
            this.errorMessage = error.error || 'Server error. Please try again later.';
          } else {
            this.errorMessage = 'Login failed: ' + (error.error || 'Unknown error. Please try again.');
          }
        }
      });
    }
  }
}