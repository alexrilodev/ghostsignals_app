import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonItem,
  IonLabel,
  IonInput,
  IonIcon,
  IonChip,
  IonSpinner,
  IonSegment,
  IonSegmentButton,
  AlertController,
  ToastController,
  ActionSheetController,
} from '@ionic/angular/standalone';
import { AuthService } from '../services/auth.service';
import { CameraService } from '../services/camera.service';
import { StorageService } from '../services/storage.service';
import { SupabaseService, Signal } from '../services/supabase.service';
import { ThemeService, ThemeMode } from '../services/theme.service';

const PREFERRED_TAGS_PREFIX = 'ghostsignals_preferred_tags_';

@Component({
  selector: 'app-perfil',
  templateUrl: 'perfil.page.html',
  styleUrls: ['perfil.page.scss'],
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonItem,
    IonLabel,
    IonInput,
    IonIcon,
    IonChip,
    IonSpinner,
    IonSegment,
    IonSegmentButton,
  ],
})
export class PerfilPage implements OnInit {
  userName = '';
  userEmail = '';
  userPhoto: string | null = null;

  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  showPasswordForm = false;

  loadingPhoto = false;
  loadingPassword = false;
  deletingAccount = false;

  mySignals: Signal[] = [];
  mySignalsCount = 0;
  loadingSignals = true;

  availableTags = [
    'Arte',
    'Música',
    'Comida',
    'Deporte',
    'Cultura',
    'Naturaleza',
    'Fiesta',
    'Turismo',
    'Comercio',
    'Servicios',
  ];

  preferredTags: string[] = [];
  themeMode: ThemeMode = 'system';

  constructor(
    private authService: AuthService,
    private cameraService: CameraService,
    private storageService: StorageService,
    private supabaseService: SupabaseService,
    private themeService: ThemeService,
    private router: Router,
    private alertController: AlertController,
    private toastController: ToastController,
    private actionSheetController: ActionSheetController
  ) {}

  ngOnInit() {
    this.loadUserInfo();
    this.loadPreferredTags();
    this.loadMySignals();
    this.themeMode = this.themeService.currentMode;
  }

  ionViewDidEnter() {
    this.loadMySignals();
  }

  loadUserInfo() {
    const user = this.authService.currentUser;
    if (user) {
      this.userName = user.displayName || '';
      this.userEmail = user.email || '';
      this.userPhoto = user.photoURL || null;
    }
  }

  loadPreferredTags() {
    const uid = this.authService.uid;
    if (!uid) return;
    const stored = localStorage.getItem(PREFERRED_TAGS_PREFIX + uid);
    if (stored) {
      try {
        this.preferredTags = JSON.parse(stored);
      } catch {
        this.preferredTags = [];
      }
    }
  }

  savePreferredTags() {
    const uid = this.authService.uid;
    if (!uid) return;
    localStorage.setItem(PREFERRED_TAGS_PREFIX + uid, JSON.stringify(this.preferredTags));
    this.showToast('Tags de interés guardados');
  }

  togglePreferredTag(tag: string) {
    const index = this.preferredTags.indexOf(tag);
    if (index === -1) {
      this.preferredTags.push(tag);
    } else {
      this.preferredTags.splice(index, 1);
    }
    this.savePreferredTags();
  }

  isPreferredTag(tag: string): boolean {
    return this.preferredTags.includes(tag);
  }

  setTheme(mode: string | number) {
    const themeMode = String(mode) as ThemeMode;
    this.themeMode = themeMode;
    this.themeService.setMode(themeMode);
  }

  async loadMySignals() {
    this.loadingSignals = true;
    try {
      this.mySignals = await this.supabaseService.getUserSignals();
      this.mySignalsCount = this.mySignals.length;
    } catch (error) {
      console.error('Error loading signals:', error);
    } finally {
      this.loadingSignals = false;
    }
  }

  editSignal(signalId: string) {
    this.router.navigate(['/tabs/editar-signal', signalId]);
  }

  async confirmDeleteSignal(signal: Signal) {
    const alert = await this.alertController.create({
      header: 'Eliminar Señal',
      message: `¿Estás seguro de que quieres eliminar "${signal.title}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            await this.deleteSignal(signal.id);
          },
        },
      ],
    });
    await alert.present();
  }

  async deleteSignal(signalId: string) {
    try {
      await this.supabaseService.deleteSignal(signalId);
      this.showToast('Señal eliminada');
      await this.loadMySignals();
    } catch (error) {
      console.error('Error deleting signal:', error);
      this.showToast('Error al eliminar la señal');
    }
  }

  async changePhoto() {
    const isDark = document.body.classList.contains('ion-palette-dark');
    const actionSheet = await this.actionSheetController.create({
      header: 'Cambiar foto de perfil',
      cssClass: isDark ? 'action-sheet-dark' : '',
      buttons: [
        {
          text: 'Tomar Foto',
          icon: 'camera',
          handler: () => this.pickAndUploadPhoto('camera'),
        },
        {
          text: 'Galería',
          icon: 'images',
          handler: () => this.pickAndUploadPhoto('gallery'),
        },
        {
          text: 'Cancelar',
          role: 'cancel',
        },
      ],
    });
    await actionSheet.present();
  }

  private async pickAndUploadPhoto(mode: 'camera' | 'gallery') {
    this.loadingPhoto = true;
    try {
      const image = mode === 'camera'
        ? await this.cameraService.takePhoto()
        : await this.cameraService.selectFromGallery();

      if (!image) return;

      const imageUrl = await this.storageService.uploadProfilePhoto(
        image.base64String,
        image.format
      );

      await this.authService.updatePhotoURL(imageUrl);
      this.userPhoto = imageUrl;
      this.showToast('Foto de perfil actualizada');
    } catch (error) {
      console.error('Error changing photo:', error);
      this.showToast('Error al cambiar la foto');
    } finally {
      this.loadingPhoto = false;
    }
  }

  togglePasswordForm() {
    this.showPasswordForm = !this.showPasswordForm;
    this.currentPassword = '';
    this.newPassword = '';
    this.confirmPassword = '';
  }

  async changePassword() {
    if (!this.currentPassword || !this.newPassword || !this.confirmPassword) {
      this.showToast('Completa todos los campos');
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.showToast('Las contraseñas no coinciden');
      return;
    }

    if (this.newPassword.length < 6) {
      this.showToast('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    this.loadingPassword = true;
    try {
      await this.authService.login(this.userEmail, this.currentPassword);
      await this.authService.updatePassword(this.newPassword);
      this.showToast('Contraseña actualizada');
      this.showPasswordForm = false;
    } catch (error: any) {
      console.error('Error changing password:', error);
      if (error.code === 'auth/wrong-password') {
        this.showToast('La contraseña actual es incorrecta');
      } else {
        this.showToast('Error al cambiar la contraseña');
      }
    } finally {
      this.loadingPassword = false;
    }
  }

  async logout() {
    const alert = await this.alertController.create({
      header: 'Cerrar Sesión',
      message: '¿Estás seguro de que quieres cerrar sesión?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Cerrar Sesión',
          role: 'destructive',
          handler: async () => {
            await this.authService.logout();
            this.router.navigateByUrl('/login', { replaceUrl: true });
          },
        },
      ],
    });
    await alert.present();
  }

  async showToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'bottom',
    });
    await toast.present();
  }

  async confirmDeleteAccount() {
    const alert = await this.alertController.create({
      header: 'Eliminar Cuenta',
      subHeader: 'Esta acción es irreversible',
      message:
        'Se eliminarán permanentemente todas tus señales, fotos de perfil, imágenes de señales y tu cuenta de usuario. ¿Estás completamente seguro?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar mi cuenta',
          role: 'destructive',
          handler: () => this.deleteAccount(),
        },
      ],
    });
    await alert.present();
  }

  async deleteAccount() {
    this.deletingAccount = true;
    try {
      await this.storageService.deleteAllUserSignalImages();
      await this.supabaseService.deleteUserSignals();
      await this.storageService.deleteProfilePhoto();

      const uid = this.authService.uid;
      if (uid) {
        localStorage.removeItem(PREFERRED_TAGS_PREFIX + uid);
      }

      await this.authService.deleteAccount();
      await this.authService.logout();
      this.router.navigateByUrl('/login', { replaceUrl: true });
    } catch (error: any) {
      console.error('Error deleting account:', error);
      if (error?.code === 'auth/requires-recent-login') {
        this.showToast('Debes haber iniciado sesión recientemente. Cierra sesión y vuelve a iniciar para eliminar tu cuenta.');
      } else {
        this.showToast('Error al eliminar la cuenta');
      }
    } finally {
      this.deletingAccount = false;
    }
  }
}
