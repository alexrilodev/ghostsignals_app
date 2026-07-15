import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonText,
  IonSpinner,
} from '@ionic/angular/standalone';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: 'login.page.html',
  styleUrls: ['login.page.scss'],
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonText,
    IonSpinner,
  ],
})
export class LoginPage {
  email = '';
  password = '';
  loading = false;
  loadingGoogle = false;
  loadingApple = false;
  error = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  async login() {
    if (!this.email || !this.password) {
      this.error = 'Por favor completa todos los campos';
      return;
    }

    this.loading = true;
    this.error = '';

    try {
      await this.authService.login(this.email, this.password);
      this.router.navigateByUrl('/tabs/mapa', { replaceUrl: true });
    } catch (e: any) {
      this.error = this.getErrorMessage(e.code);
    } finally {
      this.loading = false;
    }
  }

  async loginWithGoogle() {
    this.loadingGoogle = true;
    this.error = '';

    try {
      await this.authService.loginWithGoogle();
      this.router.navigateByUrl('/tabs/mapa', { replaceUrl: true });
    } catch (e: any) {
      this.error = 'Error al iniciar sesión con Google';
      console.error('Google sign-in error:', e);
    } finally {
      this.loadingGoogle = false;
    }
  }

  async loginWithApple() {
    this.loadingApple = true;
    this.error = '';

    try {
      await this.authService.loginWithApple();
      this.router.navigateByUrl('/tabs/mapa', { replaceUrl: true });
    } catch (e: any) {
      this.error = 'Error al iniciar sesión con Apple';
      console.error('Apple sign-in error:', e);
    } finally {
      this.loadingApple = false;
    }
  }

  private getErrorMessage(code: string): string {
    switch (code) {
      case 'auth/user-not-found':
        return 'No existe una cuenta con este email';
      case 'auth/wrong-password':
        return 'Contraseña incorrecta';
      case 'auth/invalid-email':
        return 'Email no válido';
      case 'auth/too-many-requests':
        return 'Demasiados intentos. Intenta más tarde';
      default:
        return 'Error al iniciar sesión';
    }
  }
}
