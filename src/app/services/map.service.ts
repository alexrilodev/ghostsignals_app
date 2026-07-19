import { Injectable, OnDestroy } from '@angular/core';
import * as L from 'leaflet';

@Injectable({
  providedIn: 'root',
})
export class MapService implements OnDestroy {
  private map: L.Map | null = null;
  private markers: L.Marker[] = [];
  private userMarker: L.Marker | null = null;
  private resizeObserver: ResizeObserver | null = null;

  private readonly defaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  private readonly userIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  initializeMap(containerId: string, latitude: number, longitude: number): L.Map {
    if (this.map) {
      this.destroy();
    }

    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Map container #${containerId} not found`);
    }

    this.map = L.map(container, {
      center: [latitude, longitude],
      zoom: 15,
      zoomControl: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(this.map);

    L.control.zoom({ position: 'bottomright' }).addTo(this.map);

    let resizeTimeout: any;
    this.resizeObserver = new ResizeObserver(() => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        this.map?.invalidateSize();
      }, 50);
    });
    this.resizeObserver.observe(container);

    return this.map;
  }

  setUserMarker(latitude: number, longitude: number): void {
    if (!this.map) return;

    if (this.userMarker) {
      this.userMarker.setLatLng([latitude, longitude]);
    } else {
      this.userMarker = L.marker([latitude, longitude], { icon: this.userIcon })
        .bindPopup('<b>Tu ubicación</b>')
        .addTo(this.map);
    }

  }

  addSignalMarker(
    latitude: number,
    longitude: number,
    popupContent: string
  ): L.Marker {
    if (!this.map) {
      throw new Error('Map not initialized');
    }

    const marker = L.marker([latitude, longitude], { icon: this.defaultIcon })
      .bindPopup(popupContent, { maxWidth: 250 })
      .addTo(this.map);

    this.markers.push(marker);
    return marker;
  }

  clearMarkers(): void {
    this.markers.forEach(marker => marker.remove());
    this.markers = [];
  }

  onMapMove(callback: () => void): void {
    if (!this.map) return;
    this.map.on('moveend', callback);
  }

  getCenter(): { latitude: number; longitude: number } | null {
    if (!this.map) return null;
    const center = this.map.getCenter();
    return { latitude: center.lat, longitude: center.lng };
  }

  getBounds(): L.LatLngBounds | null {
    return this.map?.getBounds() ?? null;
  }

  invalidateSize(): void {
    this.map?.invalidateSize();
  }

  private destroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  ngOnDestroy() {
    this.destroy();
  }
}
