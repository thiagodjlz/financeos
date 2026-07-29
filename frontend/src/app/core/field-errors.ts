import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';

export interface Violation {
  field: string;
  message: string;
}

export function extractViolations(err: unknown): Violation[] {
  if (!(err instanceof HttpErrorResponse)) {
    return [];
  }

  const body = err.error;
  if (!body || typeof body !== 'object' || !Array.isArray(body.violations)) {
    return [];
  }

  return body.violations;
}

export function collectFieldErrors(err: unknown, knownFields: readonly string[]): Map<string, string> {
  const errors = new Map<string, string>();

  for (const violation of extractViolations(err)) {
    const field = violation.field.split('.').pop() ?? '';
    if (knownFields.includes(field) && !errors.has(field)) {
      errors.set(field, violation.message);
    }
  }

  return errors;
}

// A ordem dos elementos com [name] no DOM é a ordem visual do formulário; o array
// violations[] chega na ordem dos rótulos do backend, que não é a mesma.
export function focusFirstInvalidField(form: HTMLElement | null | undefined, errors: Map<string, string>): void {
  if (!form || errors.size === 0) {
    return;
  }

  const controls = form.querySelectorAll<HTMLElement>('[name]');
  for (const control of Array.from(controls)) {
    const name = control.getAttribute('name') ?? '';
    if (errors.has(name)) {
      control.focus();
      return;
    }
  }
}

export class FieldErrorState {
  private readonly errors = signal<Map<string, string>>(new Map());

  constructor(private readonly knownFields: readonly string[]) {}

  invalid(field: string): boolean {
    return this.errors().has(field);
  }

  message(field: string): string {
    return this.errors().get(field) ?? '';
  }

  clear(field: string): void {
    if (!this.errors().has(field)) {
      return;
    }

    const remaining = new Map(this.errors());
    remaining.delete(field);
    this.errors.set(remaining);
  }

  reset(): void {
    this.errors.set(new Map());
  }

  apply(err: unknown): Map<string, string> {
    const collected = collectFieldErrors(err, this.knownFields);
    this.errors.set(collected);
    return collected;
  }
}
