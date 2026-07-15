import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonSpinner,
  IonRefresher,
  IonRefresherContent,
  IonFab,
  IonFabButton,
} from '@ionic/angular/standalone';
import { Geolocation } from '@capacitor/geolocation';
import { Browser } from '@capacitor/browser';
import { MapService } from '../services/map.service';
import { SupabaseService, NearbySignal } from '../services/supabase.service';

@Component({
  selector: 'app-mapa',
  templateUrl: 'mapa.page.html',
  styleUrls: ['mapa.page.scss'],
  imports: [
    CommonModule,
    RouterLink,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonIcon,
    IonSpinner,
    IonRefresher,
    IonRefresherContent,
    IonFab,
    IonFabButton,
  ],
})
export class MapaPage implements OnInit, OnDestroy {
  latitude: number | null = null;
  longitude: number | null = null;
  loading = true;
  loadingSignals = false;
  errorPermission = false;
  signals: NearbySignal[] = [];

  private mapInitialized = false;

  constructor(
    private mapService: MapService,
    private supabaseService: SupabaseService,
    private ngZone: NgZone
  ) {}

  ngOnInit() {
    this.getCurrentPosition();
  }

  ngOnDestroy() {
    this.mapService.ngOnDestroy();
  }

  async getCurrentPosition() {
    try {
      const permission = await Geolocation.requestPermissions();
      if (permission.location !== 'granted') {
        this.errorPermission = true;
        this.loading = false;
        return;
      }

      const position = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
      this.latitude = position.coords.latitude;
      this.longitude = position.coords.longitude;
      this.loading = false;

      this.initMap();
    } catch (error) {
      this.errorPermission = true;
      this.loading = false;
    }
  }

  private async initMap() {
    if (this.latitude === null || this.longitude === null || this.mapInitialized) {
      return;
    }

    setTimeout(() => {
      this.mapService.initializeMap('map', this.latitude!, this.longitude!);
      this.mapService.setUserMarker(this.latitude!, this.longitude!);
      this.mapInitialized = true;

      this.mapService.onMapMove(() => {
        this.ngZone.run(() => {
          this.loadNearbySignals();
        });
      });

      this.loadNearbySignals();
    }, 100);
  }

  async loadNearbySignals() {
    const center = this.mapService.getCenter();
    if (!center) return;

    this.loadingSignals = true;

    try {
      this.signals = await this.supabaseService.getNearbySignals(
        center.latitude,
        center.longitude,
        5
      );

      this.mapService.clearMarkers();
      this.mapService.setUserMarker(center.latitude, center.longitude);

      this.signals.forEach(signal => {
        const popupContent = this.createPopupContent(signal);
        this.mapService.addSignalMarker(
          signal.latitude,
          signal.longitude,
          popupContent
        );
      });
    } catch (error) {
      console.error('Error loading signals:', error);
    } finally {
      this.loadingSignals = false;
    }
  }

  private createPopupContent(signal: NearbySignal): string {
    const tagsHtml = signal.tags
      .map(tag => `<span class="popup-tag">${tag}</span>`)
      .join('');

    const distanceText = signal.distance < 1
      ? `${Math.round(signal.distance * 1000)}m`
      : `${signal.distance.toFixed(1)}km`;

    return `
      <div class="signal-popup">
        <h3>${signal.title}</h3>
        <p class="popup-distance">${distanceText}</p>
        <p class="popup-description">${signal.description || ''}</p>
        <div class="popup-tags">${tagsHtml}</div>
      </div>
    `;
  }

  async openSettings() {
    await Browser.open({ url: 'app-settings:' });
  }

  async handleRefresh(event: CustomEvent) {
    await this.loadNearbySignals();
    (event.target as HTMLIonRefresherElement).complete();
  }
}
