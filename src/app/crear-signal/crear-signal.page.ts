import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonButton,
  IonIcon,
  IonSpinner,
  IonChip,
  IonBackButton,
  IonButtons,
  AlertController,
  ToastController,
} from '@ionic/angular/standalone';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';
import { CameraService, CapturedImage } from '../services/camera.service';
import { StorageService } from '../services/storage.service';
import { SupabaseService, Signal } from '../services/supabase.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-crear-signal',
  templateUrl: 'crear-signal.page.html',
  styleUrls: ['crear-signal.page.scss'],
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonItem,
    IonLabel,
    IonInput,
    IonTextarea,
    IonButton,
    IonIcon,
    IonSpinner,
    IonChip,
    IonBackButton,
    IonButtons,
  ],
})
export class CrearSignalPage implements OnInit {
  title = '';
  description = '';
  selectedTags: string[] = [];
  capturedImage: CapturedImage | null = null;
  latitude: number | null = null;
  longitude: number | null = null;

  loading = false;
  loadingLocation = true;

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

  constructor(
    private cameraService: CameraService,
    private storageService: StorageService,
    private supabaseService: SupabaseService,
    private authService: AuthService,
    private router: Router,
    private alertController: AlertController,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.getCurrentPosition();
  }

  ionViewDidEnter() {
    this.resetForm();
  }

  resetForm() {
    this.title = '';
    this.description = '';
    this.selectedTags = [];
    this.capturedImage = null;
    this.loading = false;
  }

  async getCurrentPosition() {
    try {
      if (Capacitor.isNativePlatform()) {
        const permission = await Geolocation.requestPermissions();
        if (permission.location !== 'granted') {
          this.loadingLocation = false;
          return;
        }
        const position = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
        this.latitude = position.coords.latitude;
        this.longitude = position.coords.longitude;
      } else {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          });
        });
        this.latitude = position.coords.latitude;
        this.longitude = position.coords.longitude;
      }
      this.loadingLocation = false;
    } catch (error) {
      console.error('Error getting location:', error);
      this.loadingLocation = false;
    }
  }

  async takePhoto() {
    const hasPermission = await this.cameraService.checkPermissions();
    if (!hasPermission) {
      this.showAlert('Permiso requerido', 'Necesitamos acceso a la cámara para tomar fotos');
      return;
    }

    const image = await this.cameraService.takePhoto();
    if (image) {
      this.capturedImage = image;
    }
  }

  async selectFromGallery() {
    const hasPermission = await this.cameraService.checkPermissions();
    if (!hasPermission) {
      this.showAlert('Permiso requerido', 'Necesitamos acceso a la galería para seleccionar fotos');
      return;
    }

    const image = await this.cameraService.selectFromGallery();
    if (image) {
      this.capturedImage = image;
    }
  }

  toggleTag(tag: string) {
    const index = this.selectedTags.indexOf(tag);
    if (index === -1) {
      this.selectedTags.push(tag);
    } else {
      this.selectedTags.splice(index, 1);
    }
  }

  isTagSelected(tag: string): boolean {
    return this.selectedTags.includes(tag);
  }

  async createSignal() {
    if (!this.validateForm()) {
      return;
    }

    this.loading = true;
    let signalCreated = false;
    let signalId: string | null = null;

    try {
      const user = this.authService.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const signal = await this.supabaseService.createSignal({
        user_id: user.uid,
        user_name: user.displayName || user.email || 'Anónimo',
        title: this.title,
        description: this.description,
        image_url: '',
        latitude: this.latitude!,
        longitude: this.longitude!,
        tags: this.selectedTags,
      });

      signalCreated = true;
      signalId = signal.id;

      if (this.capturedImage) {
        try {
          const imageUrl = await this.storageService.uploadSignalImage(
            this.capturedImage.base64String,
            this.capturedImage.format
          );
          await this.supabaseService.updateSignalImage(signal.id, imageUrl);
        } catch (imgError) {
          console.error('Error uploading image (signal still created):', imgError);
        }
      }

      this.showToast('Señal creada exitosamente');
      await this.router.navigate(['/tabs/mapa']);
    } catch (error) {
      console.error('Error creating signal:', error);

      if (signalCreated && signalId) {
        await this.rollbackSignal(signalId);
      }

      this.showToast('Error al crear la señal');
    } finally {
      this.loading = false;
    }
  }

  private async rollbackSignal(signalId: string) {
    try {
      await this.supabaseService.deleteSignal(signalId);
    } catch (rollbackError) {
      console.error('Rollback failed:', rollbackError);
    }
  }

  private validateForm(): boolean {
    if (!this.title.trim()) {
      this.showToast('El título es requerido');
      return false;
    }

    if (this.latitude === null || this.longitude === null) {
      this.showToast('No se pudo obtener la ubicación');
      return false;
    }

    if (this.selectedTags.length === 0) {
      this.showToast('Selecciona al menos un tag');
      return false;
    }

    return true;
  }

  async showAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK'],
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
}
