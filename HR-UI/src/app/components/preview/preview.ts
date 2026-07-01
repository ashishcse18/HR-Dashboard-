import { Component, inject, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DocumentService } from '../../services/document.service';
import { DownloadService } from '../../services/download.service';

@Component({
  selector: 'app-preview',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="preview-overlay animate-fade-in" *ngIf="isOpen">
      <div class="preview-modal card">
        <div class="modal-header justify-content-between">
          <div class="d-flex align-items-center gap-3">
            <div class="header-icon">
              <i class="fa-solid fa-file-pdf"></i>
            </div>
            <div>
              <h3>Document Print Preview</h3>
              <p>Verify details before finalizing download</p>
            </div>
          </div>
          <button class="close-btn" (click)="close.emit()">&times;</button>
        </div>

        <div class="modal-toolbar">
          <div class="toolbar-actions">
            <button class="btn btn-primary btn-sm" (click)="downloadPDF()">
              <i class="fa-solid fa-download"></i> Save PDF
            </button>
            <button class="btn btn-outline btn-sm" (click)="printDocument()">
              <i class="fa-solid fa-print"></i> Print
            </button>
          </div>

          <div class="zoom-controls">
            <button class="zoom-btn" (click)="adjustZoom(-10)"><i class="fa-solid fa-magnifying-glass-minus"></i></button>
            <span class="zoom-text">{{ zoom }}%</span>
            <button class="zoom-btn" (click)="adjustZoom(10)"><i class="fa-solid fa-magnifying-glass-plus"></i></button>
          </div>
        </div>

        <div class="modal-body">
          <div class="preview-page-container">
            <div
              id="preview-print-container"
              class="preview-page"
              [innerHTML]="cleanHtml"
              [style.transform]="'scale(' + (zoom / 100) + ')'"
              [style.transform-origin]="'top center'"
            ></div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .preview-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(46, 53, 62, 0.7);
      backdrop-filter: blur(4px);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }

    .preview-modal {
      width: 90%;
      max-width: 950px;
      height: 90vh;
      display: flex;
      flex-direction: column;
      padding: 1.5rem;
      border-radius: var(--radius-lg);
      background-color: var(--white);
      box-shadow: var(--shadow-lg);
      overflow: hidden;
    }

    .modal-header {
      border-bottom: 1px solid var(--border);
      padding-bottom: 1rem;
      display: flex;
      align-items: center;
    }

    .header-icon {
      width: 40px;
      height: 40px;
      border-radius: var(--radius-md);
      background-color: var(--danger-light);
      color: var(--danger);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
    }

    .close-btn {
      font-size: 2rem;
      border: none;
      background: transparent;
      color: var(--text-secondary);
      cursor: pointer;
      line-height: 1;
    }

    .close-btn:hover {
      color: var(--danger);
    }

    .modal-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 0;
      border-bottom: 1px solid var(--border);
    }

    .toolbar-actions {
      display: flex;
      gap: 0.5rem;
    }

    .zoom-controls {
      display: flex;
      align-items: center;
      background-color: var(--bg-main);
      border-radius: var(--radius-full);
      padding: 2px;
      border: 1px solid var(--border);
    }

    .zoom-btn {
      width: 26px;
      height: 26px;
      border-radius: var(--radius-full);
      border: none;
      background: transparent;
      color: var(--text-secondary);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
    }

    .zoom-btn:hover {
      background-color: var(--white);
      color: var(--primary);
    }

    .zoom-text {
      font-size: 0.8rem;
      font-weight: 700;
      padding: 0 8px;
      min-width: 45px;
      text-align: center;
    }

    .modal-body {
      flex: 1;
      overflow: auto;
      background-color: var(--dark);
      padding: 2rem;
      display: flex;
      justify-content: center;
    }

    .preview-page-container {
      width: 100%;
      display: flex;
      justify-content: center;
    }

    .preview-page {
      width: 210mm;
      min-height: 297mm;
      background-color: var(--white);
      padding: 20mm;
      box-shadow: 0 10px 25px rgba(0,0,0,0.5);
      box-sizing: border-box;
      text-align: left;
    }
  `]
})
export class PreviewComponent {
  private readonly docService = inject(DocumentService);
  private readonly downloadService = inject(DownloadService);

  @Input() isOpen = false;
  @Input() htmlContent = '';
  @Output() close = new EventEmitter<void>();

  public zoom = 75; // Smaller default zoom for preview popup

  public get cleanHtml(): string {
    let clean = this.htmlContent;
    clean = clean.replace(/contenteditable="true"/g, 'contenteditable="false"');
    clean = clean.replace(/class="doc-var"/g, 'style="font-weight: 600; border-bottom: none;"');
    return clean;
  }

  public adjustZoom(amount: number) {
    const newZoom = this.zoom + amount;
    if (newZoom >= 30 && newZoom <= 150) {
      this.zoom = newZoom;
    }
  }

  public async downloadPDF() {
    const name = this.docService.activeTemplateName();
    await this.downloadService.downloadAsPDF('preview-print-container', name);
  }

  public printDocument() {
    const printContent = document.getElementById('preview-print-container')?.innerHTML;
    const windowUrl = 'about:blank';
    const uniqueName = new Date().getTime().toString();
    const printWindow = window.open(windowUrl, uniqueName, 'left=50000,top=50000,width=0,height=0');

    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${this.docService.activeTemplateName()}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              table { width: 100%; border-collapse: collapse; }
              th, td { border: 1px solid #e1e5eb; padding: 8px; }
            </style>
          </head>
          <body>
            ${printContent}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }
  }
}
