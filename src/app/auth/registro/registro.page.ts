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
  IonIcon,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { eye, eyeOff } from 'ionicons/icons';
import { AuthService } from '../../services/auth.service';
import { StorageService } from '../../services/storage.service';

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
    IonIcon,
  ],
})
export class RegistroPage {
  name = '';
  email = '';
  password = '';
  confirmPassword = '';
  showPassword = false;
  showConfirmPassword = false;
  loading = false;
  loadingGoogle = false;
  loadingApple = false;
  error = '';

  constructor(
    private authService: AuthService,
    private storageService: StorageService,
    private router: Router
  ) {
    addIcons({ eye, 'eye-off': eyeOff });
  }

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
      const user = await this.authService.loginWithGoogle();
      if (user.photoURL) {
        this.storageService.downloadAndUploadGooglePhoto(user.photoURL).then(url => {
          if (url) this.authService.updatePhotoURL(url);
        });
      }
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
