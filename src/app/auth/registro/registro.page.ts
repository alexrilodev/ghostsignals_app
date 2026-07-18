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
  selector: 'app-registro',
  templateUrl: 'registro.page.html',
  styleUrls: ['registro.page.scss'],
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
export class RegistroPage {
  name = '';
  email = '';
  password = '';
  confirmPassword = '';
  loading = false;
  loadingGoogle = false;
  loadingApple = false;
  error = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  async register() {
    if (!this.name.trim() || !this.email || !this.password || !this.confirmPassword) {
      this.error = 'Por favor completa todos los campos';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.error = 'Las contraseñas no coinciden';
      return;
    }

    if (this.password.length < 6) {
      this.error = 'La contraseña debe tener al menos 6 caracteres';
      return;
    }

    this.loading = true;
    this.error = '';

    try {
      await this.authService.register(this.email, this.password);
      await this.authService.updateProfile(this.name.trim());
      this.router.navigateByUrl('/tabs/mapa', { replaceUrl: true });
    } catch (e: any) {
      this.error = this.getErrorMessage(e.code);
    } finally {
      this.loading = false;
    }
  }

  async registerWithGoogle() {
    this.loadingGoogle = true;
    this.error = '';

    try {
      await this.authService.loginWithGoogle();
      this.router.navigateByUrl('/tabs/mapa', { replaceUrl: true });
    } catch (e: any) {
      this.error = 'Error al registrarse con Google';
      console.error('Google sign-up error:', e);
    } finally {
      this.loadingGoogle = false;
    }
  }

  async registerWithApple() {
    this.loadingApple = true;
    this.error = '';

    try {
      await this.authService.loginWithApple();
      this.router.navigateByUrl('/tabs/mapa', { replaceUrl: true });
    } catch (e: any) {
      this.error = 'Error al registrarse con Apple';
      console.error('Apple sign-up error:', e);
    } finally {
      this.loadingApple = false;
    }
  }

  private getErrorMessage(code: string): string {
    switch (code) {
      case 'auth/email-already-in-use':
        return 'Ya existe una cuenta con este email';
      case 'auth/invalid-email':
        return 'Email no válido';
      case 'auth/weak-password':
        return 'La contraseña es muy débil';
      default:
        return 'Error al crear la cuenta';
    }
  }
}
