import { Component, signal, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Auth } from './services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  standalone: false,
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('frontend-angular-ecom');
  showNavbar = true;

  constructor(private router: Router, private authService: Auth) {
    // Subscribe to router events to determine when to show/hide navbar
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        // Hide navbar on login page
        this.showNavbar = !event.url.includes('/login');
      });
  }

  ngOnInit(): void {
    // Component initialization
  }

  // Method to handle admin logout
  logout(): void {
    this.authService.logout();
  }

  // Method to check if current user is admin
  isAdmin(): boolean {
    return this.authService.isAdmin();
  }
}