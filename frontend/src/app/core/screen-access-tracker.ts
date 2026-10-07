import { Injectable, inject } from '@angular/core';
import { screenForUrl } from './entry-route';
import { Screen } from './models';
import { AuditService } from './services/audit.service';

// "Acesso à tela" da Auditoria: um registro por entrada numa tela do menu. Só a troca do primeiro
// segmento da rota conta — abrir um cadastro da mesma tela, trocar de aba ou paginar não geram
// registro. Provido pelo MainLayout, e não na raiz: um login novo começa sem tela anterior.
@Injectable()
export class ScreenAccessTracker {
  private readonly audit = inject(AuditService);
  private current: Screen | null = null;

  track(url: string): void {
    const screen = screenForUrl(url);
    if (screen === this.current) {
      return;
    }

    this.current = screen;
    if (screen) {
      // O registro é do servidor: falha aqui não interrompe a navegação nem vira aviso na tela.
      this.audit.screenAccess(screen).catch(() => undefined);
    }
  }
}
