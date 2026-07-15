import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonSearchbar, IonChip } from '@ionic/angular/standalone';

@Component({
  selector: 'app-explorar',
  templateUrl: 'explorar.page.html',
  styleUrls: ['explorar.page.scss'],
  imports: [CommonModule, IonHeader, IonToolbar, IonTitle, IonContent, IonSearchbar, IonChip],
})
export class ExplorarPage {
  constructor() {}
}
