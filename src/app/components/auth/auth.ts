import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth } from '../../services/auth.service';

@Component({
  selector: 'app-auth',
  standalone: false,
  templateUrl: './auth.html',
  styleUrl: './auth.css'
})
export class AuthComponent implements OnInit {
  formLogin!: FormGroup;
  loading = false;
  error: string | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: Auth
  ) {}

  ngOnInit(): void {
    this.formLogin = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required]]
    });
  }

  onLogin() {
    if (this.formLogin.valid) {
      this.loading = true;
      this.error = null;

      const credentials = this.formLogin.value;

      // Use the auth service directly
      this.authService.login(credentials.username, credentials.password).subscribe({
        next: (response: any) => {
          console.log('Login successful', response);
          // Set the access token in the service
          // Handle different possible response formats
          if (response && response['access-token']) {
            this.authService.setAccessToken(response['access-token']);
          } else if (response && response.token) {
            this.authService.setAccessToken(response.token);
          }
          this.router.navigate(['/dashboard']);
          this.loading = false;
        },
        error: (err: any) => {
          console.error('Login failed', err);
          this.error = 'Identifiants administrateur invalides. Veuillez réessayer.';
          this.loading = false;
        }
      });
    } else {
      this.error = 'Veuillez remplir tous les champs correctement';
    }
  }
}