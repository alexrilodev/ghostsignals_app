import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonSearchbar,
  IonChip,
  IonSpinner,
  IonRefresher,
  IonRefresherContent,
  IonIcon,
} from '@ionic/angular/standalone';
import { SupabaseService, Signal } from '../services/supabase.service';

@Component({
  selector: 'app-explorar',
  templateUrl: 'explorar.page.html',
  styleUrls: ['explorar.page.scss'],
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonSearchbar,
    IonChip,
    IonSpinner,
    IonRefresher,
    IonRefresherContent,
    IonIcon,
  ],
})
export class ExplorarPage implements OnInit {
  signals: Signal[] = [];
  filteredSignals: Signal[] = [];
  loading = true;
  selectedTags: string[] = [];
  searchText = '';

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

  constructor(private supabaseService: SupabaseService, private router: Router) {}

  ngOnInit() {
    this.loadSignals();
  }

  async loadSignals() {
    this.loading = true;
    try {
      this.signals = await this.supabaseService.getSignalsByTags(this.selectedTags);
      this.applySearchFilter();
    } catch (error) {
      console.error('Error loading signals:', error);
      this.signals = [];
      this.filteredSignals = [];
    } finally {
      this.loading = false;
    }
  }

  toggleTag(tag: string) {
    const index = this.selectedTags.indexOf(tag);
    if (index === -1) {
      this.selectedTags.push(tag);
    } else {
      this.selectedTags.splice(index, 1);
    }
    this.loadSignals();
  }

  isTagSelected(tag: string): boolean {
    return this.selectedTags.includes(tag);
  }

  onSearch(event: any) {
    this.searchText = (event.detail.value || '').toLowerCase();
    this.applySearchFilter();
  }

  private applySearchFilter() {
    if (!this.searchText) {
      this.filteredSignals = [...this.signals];
      return;
    }
    this.filteredSignals = this.signals.filter(
      (s) =>
        s.title.toLowerCase().includes(this.searchText) ||
        s.description.toLowerCase().includes(this.searchText)
    );
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

  async handleRefresh(event: CustomEvent) {
    await this.loadSignals();
    (event.target as HTMLIonRefresherElement).complete();
  }

  openSignalDetail(signalId: string) {
    this.router.navigate(['/tabs/signal-detail', signalId]);
  }
}
