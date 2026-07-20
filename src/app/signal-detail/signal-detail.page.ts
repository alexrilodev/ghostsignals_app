import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonBackButton,
  IonButtons,
  IonChip,
  IonSpinner,
  IonIcon,
  IonButton,
  AlertController,
  ToastController,
} from '@ionic/angular/standalone';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';
import { SupabaseService, Signal } from '../services/supabase.service';
import { AuthService } from '../services/auth.service';
import { StorageService } from '../services/storage.service';

@Component({
  selector: 'app-signal-detail',
  templateUrl: 'signal-detail.page.html',
  styleUrls: ['signal-detail.page.scss'],
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonBackButton,
    IonButtons,
    IonChip,
    IonSpinner,
    IonIcon,
    IonButton,
  ],
})
export class SignalDetailPage implements OnInit {
  signal: Signal | null = null;
  loading = true;
  isOwner = false;
  distance: string | null = null;
  private signalId = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private supabaseService: SupabaseService,
    private authService: AuthService,
    private storageService: StorageService,
    private alertController: AlertController,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.signalId = this.route.snapshot.paramMap.get('id') || '';
    if (this.signalId) {
      this.loadSignal(this.signalId);
    } else {
      this.loading = false;
    }
  }

  ionViewDidEnter() {
    const newId = this.route.snapshot.paramMap.get('id') || '';
    if (newId) {
      this.signalId = newId;
      this.loading = true;
      this.loadSignal(newId);
    }
  }

  async loadSignal(id: string) {
    try {
      const signals = await this.supabaseService.getSignalsByTags([], 0, 1000);
      this.signal = signals.find(s => s.id === id) || null;

      if (this.signal) {
        const user = this.authService.currentUser;
        this.isOwner = user ? this.signal.user_id === user.uid : false;
        await this.calculateDistance();
      }
    } catch (error) {
      console.error('Error loading signal:', error);
    } finally {
      this.loading = false;
    }
  }

  private async calculateDistance() {
    if (!this.signal) return;

    try {
      let userLat: number;
      let userLng: number;

      if (Capacitor.isNativePlatform()) {
        const position = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
        userLat = position.coords.latitude;
        userLng = position.coords.longitude;
      } else {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          });
        });
        userLat = position.coords.latitude;
        userLng = position.coords.longitude;
      }

      const dist = this.haversineDistance(userLat, userLng, this.signal.latitude, this.signal.longitude);
      this.distance = dist < 1 ? `${Math.round(dist * 1000)}m` : `${dist.toFixed(1)}km`;
    } catch {
      this.distance = null;
    }
  }

  private haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  openMaps() {
    if (!this.signal) return;
    const url = `https://www.google.com/maps?q=${this.signal.latitude},${this.signal.longitude}`;
    window.open(url, '_blank');
  }

  editSignal() {
    if (this.signal) {
      this.router.navigate(['/tabs/editar-signal', this.signal.id]);
    }
  }

  async confirmDeleteSignal() {
    if (!this.signal) return;

    const alert = await this.alertController.create({
      header: 'Eliminar Señal',
      message: `¿Estás seguro de que quieres eliminar "${this.signal.title}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            await this.deleteSignal();
          },
        },
      ],
    });
    await alert.present();
  }

  async deleteSignal() {
    if (!this.signal) return;

    try {
      if (this.signal.image_url) {
        await this.storageService.deleteSignalImage(this.signal.image_url);
      }
      await this.supabaseService.deleteSignal(this.signal.id);
      this.showToast('Señal eliminada');
      this.router.navigateByUrl('/tabs/perfil');
    } catch (error) {
      console.error('Error deleting signal:', error);
      this.showToast('Error al eliminar la señal');
    }
  }

  getTimeAgo(dateStr: string): string {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHrs / 24);

    if (diffMin < 1) return 'Ahora mismo';
    if (diffMin < 60) return `Hace ${diffMin} min`;
    if (diffHrs < 24) return `Hace ${diffHrs}h`;
    return `Hace ${diffDays}d`;
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
