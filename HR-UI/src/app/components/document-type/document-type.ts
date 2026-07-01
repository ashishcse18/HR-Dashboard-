import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DocumentService } from '../../services/document.service';

@Component({
  selector: 'app-document-type',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="doc-type-section animate-fade-in" *ngIf="docService.selectedFolderId()">
      <div class="section-header">
        <div class="header-icon">
          <i class="fa-solid fa-file-invoice"></i>
        </div>
        <div>
          <h2>Document Category</h2>
          <p>Filter templates within <strong>{{ docService.selectedFolder()?.name }}</strong> directory</p>
        </div>
      </div>

      <div class="grid-4 mt-3">
        @for (type of docService.documentTypes(); track type.id) {
          <div
            class="type-tab card card-hover"
            [class.active]="docService.selectedTypeId() === type.id"
            (click)="selectType(type.id)"
          >
            <div class="type-icon-wrapper" [class.active-icon]="docService.selectedTypeId() === type.id">
              <i class="fa-solid" [ngClass]="type.icon"></i>
            </div>
            <div class="type-meta">
              <h4 class="type-name">{{ type.name }}</h4>
              <p class="type-desc">{{ type.description }}</p>
            </div>

            <div class="badge-count" *ngIf="getTemplateCount(type.id) > 0">
              {{ getTemplateCount(type.id) }}
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .doc-type-section {
      margin-top: 1.5rem;
      margin-bottom: 2rem;
    }

    .section-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1.25rem;
    }

    .header-icon {
      width: 44px;
      height: 44px;
      border-radius: var(--radius-md);
      background-color: var(--secondary-light);
      color: var(--secondary);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
    }

    .section-header h2 {
      font-size: 1.35rem;
      color: var(--dark);
    }

    .section-header p {
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    .mt-3 {
      margin-top: 0.75rem;
    }

    .type-tab {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.15rem 1.25rem;
      cursor: pointer;
      position: relative;
      border: 1px solid var(--border);
    }

    .type-tab.active {
      border-color: var(--primary);
      background-color: var(--primary-light);
    }

    .type-icon-wrapper {
      width: 42px;
      height: 42px;
      border-radius: var(--radius-md);
      background-color: var(--bg-main);
      color: var(--text-secondary);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
      transition: var(--transition-normal);
    }

    .type-icon-wrapper.active-icon {
      background-color: var(--primary);
      color: var(--white);
    }

    .type-meta {
      flex-grow: 1;
    }

    .type-name {
      font-size: 1rem;
      font-weight: 700;
      color: var(--dark);
    }

    .type-desc {
      font-size: 0.75rem;
      color: var(--text-secondary);
    }

    .badge-count {
      position: absolute;
      top: 10px;
      right: 12px;
      background-color: var(--dark);
      color: var(--white);
      font-size: 0.7rem;
      font-weight: 700;
      width: 18px;
      height: 18px;
      border-radius: var(--radius-full);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .type-tab.active .badge-count {
      background-color: var(--primary);
    }
  `]
})
export class DocumentTypeComponent {
  public readonly docService = inject(DocumentService);

  public selectType(typeId: string) {
    this.docService.selectType(typeId);
  }

  public getTemplateCount(typeId: string): number {
    const fId = this.docService.selectedFolderId();
    if (!fId) return 0;
    if (fId === 'tvm' || fId === 'asminds') return 1;
    return 0; 
  }
}
