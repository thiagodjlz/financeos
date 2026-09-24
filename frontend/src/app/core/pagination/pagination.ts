import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-pagination',
  templateUrl: './pagination.html',
})
export class Pagination {
  readonly page = input.required<number>();
  readonly totalPages = input.required<number>();

  readonly pageChange = output<number>();

  protected previous(): void {
    this.pageChange.emit(this.page() - 1);
  }

  protected next(): void {
    this.pageChange.emit(this.page() + 1);
  }
}
