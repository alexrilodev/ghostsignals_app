import { Injectable, OnDestroy } from '@angular/core';
import * as L from 'leaflet';

declare module 'leaflet' {
  interface Map {
    markerClusterGroup(options?: any): any;
  }
}

async function ensureMarkerCluster(): Promise<void> {
  (window as any).L = L;
  await import('leaflet.markercluster');
}

@Injectable({
  providedIn: 'root',
})
export class MapService implements OnDestroy {
  private map: L.Map | null = null;
  private markers: L.Marker[] = [];
  private userMarker: L.Marker | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private markerClusterGroup: L.MarkerClusterGroup | null = null;

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

  async initializeMap(containerId: string, latitude: number, longitude: number): Promise<L.Map> {
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

    try {
      await ensureMarkerCluster();
      if ((L as any).markerClusterGroup) {
        this.markerClusterGroup = (L as any).markerClusterGroup({
          spiderfyOnMaxZoom: true,
          showCoverageOnHover: false,
          zoomToBoundsOnClick: true,
          maxClusterRadius: 30,
        });
        this.map.addLayer(this.markerClusterGroup!);
      }
    } catch (e) {
      console.warn('MarkerCluster plugin failed to load, using plain markers:', e);
    }

    let resizeTimeout: any;
    this.resizeObserver = new ResizeObserver(() => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        this.map?.invalidateSize();
      }, 50);
    });
    this.resizeObserver.observe(container);

    this.map.invalidateSize();
    return this.map;
  }

  setUserMarker(latitude: number, longitude: number): void {
    if (!this.map) return;

    if (this.userMarker) {
      this.userMarker.setLatLng([latitude, longitude]);
      if (!this.map.hasLayer(this.userMarker)) {
        this.userMarker.addTo(this.map);
      }
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
      .bindPopup(popupContent, { maxWidth: 250 });

    if (this.markerClusterGroup) {
      this.markerClusterGroup.addLayer(marker);
    } else {
      marker.addTo(this.map);
    }
    this.markers.push(marker);
    return marker;
  }

  clearMarkers(): void {
    if (this.markerClusterGroup) {
      this.markerClusterGroup.clearLayers();
    } else {
      this.markers.forEach(m => {
        if (this.map) {
          this.map.removeLayer(m);
        }
      });
    }
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

  centerOnUser(latitude: number, longitude: number): void {
    if (!this.map) return;
    this.map.flyTo([latitude, longitude], this.map.getZoom(), { animate: true, duration: 0.8 });
    this.setUserMarker(latitude, longitude);
  }

  private destroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    if (this.markerClusterGroup) {
      this.markerClusterGroup.clearLayers();
      this.markerClusterGroup = null;
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
