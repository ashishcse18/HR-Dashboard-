import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DocumentService } from '../../services/document.service';
import { TooltipDirective } from '../../directives/tooltip.directive';
import { ShortenPipe } from '../../pipes/shorten.pipe';

@Component({
  selector: 'app-folder-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TooltipDirective, ShortenPipe],
  templateUrl: './folder-list.html',
  styleUrl: './folder-list.css',
})
export class FolderListComponent {
  public readonly docService = inject(DocumentService);
  private readonly fb = inject(FormBuilder);

  public isModalOpen = false;

  public companyForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(30)]],
    description: ['', [Validators.maxLength(100)]],
    color: ['#2563eb'],
  });

  public selectFolder(folderId: string) {
    this.docService.selectFolder(folderId);
  }

  public getTemplateCount(folderId: string): number {
    return this.docService.templates().filter((t) => t.companyId === folderId).length;
  }

  public openAddModal() {
    this.isModalOpen = true;
    this.companyForm.reset({
      name: '',
      description: '',
      color: '#2563eb',
    });
  }

  public closeModal() {
    this.isModalOpen = false;
  }

  public onSubmitCompany(event: Event) {
    event.preventDefault();
    if (this.companyForm.invalid) return;

    const { name, description, color } = this.companyForm.value;
    this.docService.addCompany(name.trim(), description ? description.trim() : '', color);
    this.isModalOpen = false;
  }

  public isCustomFolder(id: string): boolean {
    return !['tvm', 'asminds', 'jnj'].includes(id);
  }

  public isConfirmOpen = false;
  public deleteTargetId = '';

  public deleteCompany(id: string, event: Event) {
    event.stopPropagation();
    this.deleteTargetId = id;
    this.isConfirmOpen = true;
  }

  public closeConfirm() {
    this.isConfirmOpen = false;
    this.deleteTargetId = '';
  }

  public onConfirmDelete() {
    if (this.deleteTargetId) {
      this.docService.deleteCompany(this.deleteTargetId);
    }
    this.closeConfirm();
  }
}
