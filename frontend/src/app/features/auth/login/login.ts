import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { APP_NAME, APP_VERSION } from '../../../core/version';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  protected readonly appName = APP_NAME;
  protected readonly appVersion = APP_VERSION;

  protected readonly saving = signal(false);

  protected form = {
    email: '',
    password: '',
  };

  protected async submit(): Promise<void> {
    this.saving.set(true);

    try {
      await this.authService.login(this.form.email, this.form.password);
      await this.router.navigate(['/dashboard']);
    } catch (err) {
      // Credencial errada é Alerta, não Falha (D12 revertida pelo usuário em 28/07/2026): é erro
      // que o usuário corrige redigitando a senha. O 401 fora do login segue no interceptor.
      if (err instanceof HttpErrorResponse && err.status === 401) {
        this.toast.warning('Credenciais inválidas. Tente novamente.');
        return;
      }

      this.toast.fromHttpError(err, 'Não foi possível entrar. Tente novamente.');
    } finally {
      this.saving.set(false);
    }
  }
}
