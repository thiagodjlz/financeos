import { Component, computed, input, output } from '@angular/core';
import { PAGE_SIZE } from '../models';

@Component({
  selector: 'app-pagination',
  templateUrl: './pagination.html',
})
export class Pagination {
  readonly page = input.required<number>();
  readonly totalPages = input.required<number>();
  readonly totalItems = input.required<number>();
  readonly pageSize = input(PAGE_SIZE);

  readonly pageChange = output<number>();

  protected readonly firstItem = computed(() =>
    this.totalItems() ? (this.page() - 1) * this.pageSize() + 1 : 0,
  );
  protected readonly lastItem = computed(() => Math.min(this.page() * this.pageSize(), this.totalItems()));

  protected previous(): void {
    this.pageChange.emit(this.page() - 1);
  }

  protected next(): void {
    this.pageChange.emit(this.page() + 1);
  }
}
