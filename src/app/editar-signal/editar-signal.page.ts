import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
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
import { CameraService, CapturedImage } from '../services/camera.service';
import { StorageService } from '../services/storage.service';
import { SupabaseService, Signal } from '../services/supabase.service';

@Component({
  selector: 'app-editar-signal',
  templateUrl: 'editar-signal.page.html',
  styleUrls: ['editar-signal.page.scss'],
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
export class EditarSignalPage implements OnInit {
  signalId = '';
  title = '';
  description = '';
  selectedTags: string[] = [];
  existingImageUrl = '';
  capturedImage: CapturedImage | null = null;

  loading = true;
  saving = false;

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
    private route: ActivatedRoute,
    private router: Router,
    private cameraService: CameraService,
    private storageService: StorageService,
    private supabaseService: SupabaseService,
    private alertController: AlertController,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.signalId = this.route.snapshot.paramMap.get('id') || '';
    if (this.signalId) {
      this.loadSignal();
    } else {
      this.loading = false;
    }
  }

  async loadSignal() {
    try {
      const signals = await this.supabaseService.getUserSignals();
      const signal = signals.find(s => s.id === this.signalId);
      if (signal) {
        this.title = signal.title;
        this.description = signal.description || '';
        this.selectedTags = [...signal.tags];
        this.existingImageUrl = signal.image_url || '';
      } else {
        this.showToast('Señal no encontrada');
        this.router.navigateByUrl('/tabs/perfil');
      }
    } catch (error) {
      console.error('Error loading signal:', error);
      this.showToast('Error al cargar la señal');
    } finally {
      this.loading = false;
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

  removeExistingImage() {
    this.existingImageUrl = '';
  }

  async saveSignal() {
    if (!this.validateForm()) {
      return;
    }

    this.saving = true;

    try {
      let imageUrl = this.existingImageUrl;

      if (this.capturedImage) {
        try {
          imageUrl = await this.storageService.uploadSignalImage(
            this.capturedImage.base64String,
            this.capturedImage.format
          );
        } catch (imgError) {
          console.error('Error uploading image:', imgError);
        }
      }

      await this.supabaseService.updateSignal(this.signalId, {
        title: this.title,
        description: this.description,
        tags: this.selectedTags,
        image_url: imageUrl,
      });

      this.showToast('Señal actualizada');
      await this.router.navigate(['/tabs/perfil']);
    } catch (error) {
      console.error('Error updating signal:', error);
      this.showToast('Error al actualizar la señal');
    } finally {
      this.saving = false;
    }
  }

  private validateForm(): boolean {
    if (!this.title.trim()) {
      this.showToast('El título es requerido');
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
