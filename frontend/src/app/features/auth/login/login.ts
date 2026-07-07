import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly saving = signal(false);
  protected readonly error = signal('');

  protected form = {
    email: '',
    password: '',
  };

  protected async submit(): Promise<void> {
    this.saving.set(true);
    this.error.set('');

    try {
      await this.authService.login(this.form.email, this.form.password);
      await this.router.navigate(['/dashboard']);
    } catch {
      this.error.set('E-mail ou senha invalidos.');
    } finally {
      this.saving.set(false);
    }
  }
}
