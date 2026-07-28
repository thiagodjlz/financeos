import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Toast, ToastService } from '../services/toast.service';

@Component({
  selector: 'app-toast-host',
  imports: [CommonModule],
  templateUrl: './toast-host.html',
  styleUrl: './toast-host.scss',
})
export class ToastHost {
  private readonly toastService = inject(ToastService);

  protected readonly toasts = this.toastService.toasts;

  protected trackById(_index: number, toast: Toast): number {
    return toast.id;
  }

  protected close(id: number): void {
    this.toastService.dismiss(id);
  }
}
