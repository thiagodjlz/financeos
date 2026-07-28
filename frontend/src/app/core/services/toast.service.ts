import { Injectable, signal } from '@angular/core';
import { classifyHttpError } from '../http-error';

export type ToastType = 'success' | 'warning' | 'error';

export interface Toast {
  id: number;
  type: ToastType;
  title: string;
  message: string;
  duration: number | null;
  leaving: boolean;
}

export const TOAST_TITLES: Record<ToastType, string> = {
  success: 'Sucesso',
  warning: 'Alerta',
  error: 'Falha',
};

export const TOAST_DURATIONS: Record<ToastType, number | null> = {
  success: 3800,
  warning: 5200,
  error: null,
};

export const TOAST_MAX = 3;
export const TOAST_LEAVE_MS = 260;

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly stack = signal<Toast[]>([]);
  readonly toasts = this.stack.asReadonly();

  private nextId = 1;
  private readonly timers = new Map<number, ReturnType<typeof setTimeout>>();

  success(message: string): void {
    this.show('success', message);
  }

  warning(message: string): void {
    this.show('warning', message);
  }

  error(message: string): void {
    this.show('error', message);
  }

  fromHttpError(err: unknown, fallback: string): void {
    const classified = classifyHttpError(err, fallback);

    if (classified) {
      this.show(classified.kind, classified.message);
    }
  }

  dismiss(id: number): void {
    const toast = this.stack().find((item) => item.id === id);

    if (!toast || toast.leaving) {
      return;
    }

    this.clearTimer(id);
    this.stack.update((toasts) =>
      toasts.map((item) => (item.id === id ? { ...item, leaving: true } : item)),
    );

    setTimeout(() => this.remove(id), TOAST_LEAVE_MS);
  }

  private show(type: ToastType, message: string): void {
    const duration = TOAST_DURATIONS[type];
    const existing = this.stack().find(
      (item) => !item.leaving && item.type === type && item.message === message,
    );

    // Telas que disparam requisições em paralelo (o Promise.all de Lançamentos) rejeitam várias
    // vezes com o mesmo texto: reiniciar o toast vivo evita empilhar clones.
    if (existing) {
      this.restartTimer(existing.id, duration);
      return;
    }

    const live = this.stack().filter((item) => !item.leaving);
    if (live.length >= TOAST_MAX) {
      this.dismiss(live[0].id);
    }

    const toast: Toast = {
      id: this.nextId++,
      type,
      title: TOAST_TITLES[type],
      message,
      duration,
      leaving: false,
    };

    this.stack.update((toasts) => [...toasts, toast]);
    this.restartTimer(toast.id, duration);
  }

  private restartTimer(id: number, duration: number | null): void {
    this.clearTimer(id);

    if (duration === null) {
      return;
    }

    this.timers.set(
      id,
      setTimeout(() => this.dismiss(id), duration),
    );
  }

  private clearTimer(id: number): void {
    const timer = this.timers.get(id);

    if (timer) {
      clearTimeout(timer);
      this.timers.delete(id);
    }
  }

  private remove(id: number): void {
    this.clearTimer(id);
    this.stack.update((toasts) => toasts.filter((item) => item.id !== id));
  }
}
