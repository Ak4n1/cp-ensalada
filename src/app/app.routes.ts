import { Routes } from '@angular/router';
import { AportesPage } from './features/aportes/aportes.page';
import { CargarPage } from './features/cargar/cargar.page';
import { HistorialPage } from './features/historial/historial.page';
import { MaterialesPage } from './features/materiales/materiales.page';
import { ParticipantesPage } from './features/participantes/participantes.page';

export const routes: Routes = [
  { path: '', redirectTo: 'aportes', pathMatch: 'full' },
  { path: 'aportes', component: AportesPage },
  { path: 'cargar', component: CargarPage },
  { path: 'historial', component: HistorialPage },
  { path: 'participantes', component: ParticipantesPage },
  { path: 'materiales', component: MaterialesPage },
  { path: '**', redirectTo: 'aportes' },
];
