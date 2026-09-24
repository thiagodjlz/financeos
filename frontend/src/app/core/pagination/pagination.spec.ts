import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Pagination } from './pagination';

@Component({
  imports: [Pagination],
  template: `<app-pagination [page]="page()" [totalPages]="totalPages()" (pageChange)="changes.push($event)" />`,
})
class Host {
  readonly page = signal(1);
  readonly totalPages = signal(2);
  readonly changes: number[] = [];
}

describe('Pagination', () => {
  let fixture: ComponentFixture<Host>;

  beforeEach(() => {
    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
  });

  function buttons(): HTMLButtonElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('.pagination button'));
  }

  it('mostra "Página X de Y" e desabilita "Anterior" na primeira página', () => {
    const [previous, next] = buttons();

    expect(fixture.nativeElement.querySelector('.pagination-status').textContent.trim()).toBe('Página 1 de 2');
    expect(previous.textContent?.trim()).toBe('Anterior');
    expect(previous.disabled).toBe(true);
    expect(next.textContent?.trim()).toBe('Próxima');
    expect(next.disabled).toBe(false);

    next.click();
    expect(fixture.componentInstance.changes).toEqual([2]);
  });

  it('desabilita "Próxima" na última página', () => {
    fixture.componentInstance.page.set(2);
    fixture.detectChanges();
    const [previous, next] = buttons();

    expect(next.disabled).toBe(true);
    expect(previous.disabled).toBe(false);

    previous.click();
    expect(fixture.componentInstance.changes).toEqual([1]);
  });

  it('some quando não há registros', () => {
    fixture.componentInstance.totalPages.set(0);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.pagination')).toBeNull();
  });
});
