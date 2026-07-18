import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

export const routes: Routes = [
  {
    path: '',
    component: TabsPage,
    children: [
      {
        path: 'mapa',
        loadComponent: () =>
          import('../mapa/mapa.page').then((m) => m.MapaPage),
      },
      {
        path: 'explorar',
        loadComponent: () =>
          import('../explorar/explorar.page').then((m) => m.ExplorarPage),
      },
      {
        path: 'avisos',
        loadComponent: () =>
          import('../avisos/avisos.page').then((m) => m.AvisosPage),
      },
      {
        path: 'perfil',
        loadComponent: () =>
          import('../perfil/perfil.page').then((m) => m.PerfilPage),
      },
      {
        path: 'crear-signal',
        loadComponent: () =>
          import('../crear-signal/crear-signal.page').then((m) => m.CrearSignalPage),
      },
      {
        path: 'signal-detail/:id',
        loadComponent: () =>
          import('../signal-detail/signal-detail.page').then((m) => m.SignalDetailPage),
      },
      {
        path: '',
        redirectTo: '/tabs/mapa',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '',
    redirectTo: '/tabs/mapa',
    pathMatch: 'full',
  },
];
