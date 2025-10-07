import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class Auth {
  private accessToken: string | null = null;

  constructor(private http: HttpClient, private router: Router) {
    // Check if token exists in localStorage on initialization
    this.accessToken = localStorage.getItem('adminToken');
  }

  public login(username: string, password: string): Observable<any> {
    // Clear any existing token before login
    this.clearAccessToken();
    
    let options = {
      headers: new HttpHeaders().set('Content-Type', 'application/x-www-form-urlencoded')
    }

    let params = new HttpParams().set('username', username).set('password', password);

    return this.http.post('http://localhost:8080/auth/login', params, options);
  }

  // Method to set the access token
  public setAccessToken(token: string): void {
    this.accessToken = token;
    localStorage.setItem('adminToken', token);
  }

  // Method to get the access token
  public getAccessToken(): string | null {
    // If not in memory, try to get from localStorage
    if (!this.accessToken) {
      this.accessToken = localStorage.getItem('adminToken');
    }
    return this.accessToken;
  }

  // Method to clear the access token
  public clearAccessToken(): void {
    this.accessToken = null;
    localStorage.removeItem('adminToken');
  }

  // Method to logout the user
  public logout(): void {
    this.clearAccessToken();
    // Redirect to login page
    this.router.navigate(['/login']);
  }

  // Method to check if user is admin
  public isAdmin(): boolean {
    const token = this.getAccessToken();
    if (!token) {
      return false;
    }

    try {
      const decodedToken: any = jwtDecode(token);
      console.log('Decoded token:', decodedToken);
      
      // Check for admin scope based on the token structure from the profile response
      // The token has a "scope" claim with value "ADMIN USER"
      if (decodedToken.scope) {
        return decodedToken.scope.includes('ADMIN');
      }
      
      // Alternative check for authorities array
      if (decodedToken.authorities) {
        return decodedToken.authorities.includes('SCOPE_ADMIN');
      }
      
      // Fallback checks
      return decodedToken.isAdmin === true || 
             decodedToken.role === 'ADMIN' || 
             decodedToken.authorities?.includes('ROLE_ADMIN');
    } catch (error) {
      console.error('Error decoding token:', error);
      return false;
    }
  }
}