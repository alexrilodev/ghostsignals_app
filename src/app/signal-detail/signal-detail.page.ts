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
import { SupabaseService, Signal } from '../services/supabase.service';
import { AuthService } from '../services/auth.service';

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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private supabaseService: SupabaseService,
    private authService: AuthService,
    private alertController: AlertController,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadSignal(id);
    } else {
      this.loading = false;
    }
  }

  async loadSignal(id: string) {
    try {
      const signals = await this.supabaseService.getSignalsByTags([], 0, 1000);
      this.signal = signals.find(s => s.id === id) || null;

      if (this.signal) {
        const user = this.authService.currentUser;
        this.isOwner = user ? this.signal.user_id === user.uid : false;
      }
    } catch (error) {
      console.error('Error loading signal:', error);
    } finally {
      this.loading = false;
    }
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
