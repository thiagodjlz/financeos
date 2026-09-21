import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DocumentationArea, DocumentationSection } from '../../core/models';
import { DocumentationService } from '../../core/services/documentation.service';
import { ToastService } from '../../core/services/toast.service';

function sectionTexts(section: DocumentationSection): string[] {
  const texts = [section.title];

  section.blocks.forEach((block) => {
    if (block.text) {
      texts.push(block.text);
    }

    texts.push(...block.items);

    if (block.table) {
      texts.push(...block.table.columns);
      block.table.rows.forEach((row) => texts.push(...row));
    }
  });

  return texts;
}

function matches(texts: string[], term: string): boolean {
  return texts.some((text) => text.toLowerCase().includes(term));
}

function filterArea(area: DocumentationArea, term: string): DocumentationArea | null {
  if (!term) {
    return area;
  }

  if (matches([area.title, area.summary], term)) {
    return area;
  }

  const sections = area.sections.filter((section) => matches(sectionTexts(section), term));

  return sections.length ? { ...area, sections } : null;
}

@Component({
  selector: 'app-documentation',
  imports: [CommonModule, FormsModule],
  templateUrl: './documentation.html',
  styleUrl: './documentation.scss',
})
export class Documentation implements OnInit {
  private readonly documentationService = inject(DocumentationService);
  private readonly toast = inject(ToastService);

  protected readonly loading = signal(false);
  protected readonly search = signal('');
  protected readonly selectedAreaId = signal<string | null>(null);

  protected readonly content = this.documentationService.content;

  // A introdução e as áreas são renderizadas pelo mesmo caminho: o componente nunca decide nada por
  // id ou título de área, e por isso acrescentar uma área nova não encosta neste arquivo.
  private readonly allAreas = computed<DocumentationArea[]>(() => {
    const content = this.content();
    return content ? [content.introduction, ...content.areas] : [];
  });

  protected readonly visibleAreas = computed<DocumentationArea[]>(() => {
    const term = this.search().trim().toLowerCase();

    return this.allAreas()
      .map((area) => filterArea(area, term))
      .filter((area): area is DocumentationArea => area !== null);
  });

  protected readonly activeArea = computed<DocumentationArea | null>(() => {
    const areas = this.visibleAreas();
    const selected = this.selectedAreaId();

    return areas.find((area) => area.id === selected) ?? areas[0] ?? null;
  });

  ngOnInit(): void {
    void this.load();
  }

  private async load(): Promise<void> {
    this.loading.set(true);

    try {
      await this.documentationService.load();
    } catch (err) {
      this.toast.fromHttpError(err, 'Não foi possível carregar a documentação.');
    } finally {
      this.loading.set(false);
    }
  }

  protected selectArea(id: string): void {
    this.selectedAreaId.set(id);
  }

  protected onSearchChange(term: string): void {
    this.search.set(term);
  }

  protected trackById(_index: number, area: DocumentationArea): string {
    return area.id;
  }
}
