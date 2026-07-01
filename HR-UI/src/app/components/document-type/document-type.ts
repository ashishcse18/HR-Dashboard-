import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DocumentService } from '../../services/document.service';

@Component({
  selector: 'app-document-type',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './document-type.html',
  styleUrls: ['./document-type.css'],
})
export class DocumentTypeComponent {
  public readonly docService = inject(DocumentService);

  selectType(typeId: string): void {
    this.docService.selectType(typeId);
  }

  getTemplateCount(typeId: string): number {
    const folderId = this.docService.selectedFolderId();

    if (!folderId) {
      return 0;
    }

    if (folderId === 'tvm' || folderId === 'asminds') {
      return 1;
    }

    return 0;
  }
}
