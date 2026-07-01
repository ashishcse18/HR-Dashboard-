import { Component, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DocumentService } from '../../services/document.service';

@Component({
  selector: 'app-template-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="template-section animate-fade-in" *ngIf="(docService.selectedFolderId() && docService.selectedTypeId()) || docService.searchQuery()">
      <div class="section-header">
        <div class="header-icon">
          <i class="fa-solid fa-magnifying-glass" *ngIf="docService.searchQuery()"></i>
          <i class="fa-solid fa-list-check" *ngIf="!docService.searchQuery()"></i>
        </div>
        <div>
          <h2>{{ docService.searchQuery() ? 'Search Results' : 'Available Templates' }}</h2>
          <p>{{ docService.searchQuery() ? 'Found ' + docService.filteredTemplates().length + ' matching templates' : 'Choose a template to customize and download' }}</p>
        </div>
      </div>

      <div class="grid-3 mt-3" *ngIf="docService.filteredTemplates().length > 0; else noTemplates">
        @for (template of docService.filteredTemplates(); track template.id) {
          <div class="template-card card card-hover">
            <div class="template-header">
              <span class="file-type-icon">
                <i class="fa-solid fa-file-lines"></i>
              </span>
              <span class="badge badge-secondary">Ready to Edit</span>
            </div>
            
            <h4 class="template-title">{{ template.name }}</h4>
            <p class="template-description">{{ template.description }}</p>
            
            <div class="variables-count">
              <i class="fa-solid fa-square-poll-horizontal"></i>
              <span>{{ getObjectKeys(template.variables).length }} fields to fill</span>
            </div>
            
            <div class="template-actions">
              <button class="btn btn-outline btn-sm flex-grow-1" (click)="openTemplate(template.id)">
                <i class="fa-solid fa-pen-to-square"></i> Open in Editor
              </button>
            </div>
          </div>
        }
      </div>

      <ng-template #noTemplates>
        <div class="no-templates-card card">
          <div class="no-templates-icon">
            <i class="fa-solid fa-triangle-exclamation"></i>
          </div>
          <h3>{{ docService.searchQuery() ? 'No Matching Templates Found' : 'No Predefined Templates Found' }}</h3>
          <p>{{ docService.searchQuery() ? 'We could not find any templates matching your search criteria. Try a different term or upload an external file instead!' : 'There are no preloaded templates for this category. You can upload an external Word/PDF file to edit instead!' }}</p>
          <button class="btn btn-primary btn-sm mt-3" (click)="triggerUploadNavigation.emit()">
            <i class="fa-solid fa-file-upload"></i> Go to File Upload
          </button>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .template-section {
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
      background-color: var(--primary-light);
      color: var(--primary);
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
    
    .template-card {
      border: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      height: 220px;
    }
    
    .template-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
    }
    
    .file-type-icon {
      font-size: 1.5rem;
      color: var(--primary);
    }
    
    .template-title {
      font-size: 1.05rem;
      font-weight: 700;
      color: var(--dark);
      margin-bottom: 0.35rem;
    }
    
    .template-description {
      font-size: 0.8rem;
      color: var(--text-secondary);
      flex-grow: 1;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    
    .variables-count {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.8rem;
      color: var(--text-secondary);
      margin-bottom: 1rem;
      font-weight: 500;
    }
    
    .variables-count i {
      color: var(--secondary);
    }
    
    .template-actions {
      display: flex;
      gap: 0.5rem;
    }
    
    .flex-grow-1 {
      flex-grow: 1;
    }

    .no-templates-card {
      text-align: center;
      padding: 3rem;
      border: 1px dashed var(--border);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background-color: var(--white);
    }
    
    .no-templates-icon {
      font-size: 2.5rem;
      color: var(--warning);
      margin-bottom: 1rem;
    }
    
    .no-templates-card h3 {
      font-size: 1.25rem;
      margin-bottom: 0.5rem;
    }
    
    .no-templates-card p {
      font-size: 0.9rem;
      color: var(--text-secondary);
      max-width: 480px;
    }
  `]
})
export class TemplateListComponent {
  public readonly docService = inject(DocumentService);

  @Output() selectTemplate = new EventEmitter<void>();
  @Output() triggerUploadNavigation = new EventEmitter<void>();

  public openTemplate(templateId: string) {
    this.docService.loadTemplate(templateId);
    this.selectTemplate.emit();
  }

  public getObjectKeys(obj: any): string[] {
    return Object.keys(obj || {});
  }
}
