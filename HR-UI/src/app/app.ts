import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DocumentService } from './services/document.service';
import { AuthService } from './services/auth.service';

import { FolderListComponent } from './components/folder-list/folder-list';
import { DocumentTypeComponent } from './components/document-type/document-type';
import { TemplateListComponent } from './components/template-list/template-list';
import { OnlineEditorComponent } from './components/online-editor/online-editor';
import { UploadDocumentComponent } from './components/upload-document/upload-document';
import { PreviewComponent } from './components/preview/preview';
import { AuthComponent } from './components/auth/auth';
import { SignupComponent } from './components/signup/signup';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    FolderListComponent,
    DocumentTypeComponent,
    TemplateListComponent,
    OnlineEditorComponent,
    UploadDocumentComponent,
    PreviewComponent,
    AuthComponent,
    SignupComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  public readonly docService = inject(DocumentService);
  public readonly authService = inject(AuthService);

  public readonly sidebarOpen = signal<boolean>(false);
  public readonly isRegistering = signal<boolean>(false);

  public toggleSidebar() {
    this.sidebarOpen.set(!this.sidebarOpen());
  }

  // Navigation active tab
  public readonly activeTab = signal<'dashboard' | 'folders' | 'upload' | 'editor'>('dashboard');

  public previewOpen = false;

  public readonly stats = computed(() => {
    return {
      totalFolders: this.docService.folders().length,
      totalTemplates: this.docService.templates().length,
      totalDownloads: this.docService.downloadCount(),
      recentEdits: this.docService.editCount()
    };
  });

  public readonly recentActivities = computed(() => {
    const log = this.docService.activityLog();
    if (log.length === 0) {
      return [
        { text: 'No activity yet — start by selecting a template or uploading a document!', time: '', icon: 'fa-circle-info', type: 'info' }
      ];
    }
    return log.slice(0, 8).map(entry => ({
      text: entry.text,
      time: this.docService.getRelativeTime(entry.timestamp),
      icon: entry.icon,
      type: entry.type
    }));
  });

  public onTemplateSelected() {
    this.activeTab.set('editor');
  }

  public navigateToUpload() {
    this.activeTab.set('upload');
  }

  public navigateToFolders() {
    this.activeTab.set('folders');
  }

  public onUploadCompleted() {
    this.activeTab.set('editor');
  }

  public togglePreview(open: boolean) {
    this.previewOpen = open;
  }

  public selectTab(tab: 'dashboard' | 'folders' | 'upload' | 'editor') {
    this.activeTab.set(tab);
    if (tab !== 'folders') {
      this.docService.searchQuery.set('');
    } else {
      this.docService.selectFolder(null);
    }
  }

  public onSearch(event: Event) {
    const query = (event.target as HTMLInputElement).value;
    this.docService.searchQuery.set(query);
    if (query.trim() && this.activeTab() !== 'folders') {
      this.activeTab.set('folders');
    }
  }

  public triggerSearch() {
    if (this.activeTab() !== 'folders') {
      this.activeTab.set('folders');
    }
  }

  public clearActivityLog() {
    this.docService.clearActivityLog();
  }

  public onAvatarSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.authService.updateAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  public logout() {
    this.authService.logout();
    this.activeTab.set('dashboard');
  }

  public get activeHtmlContent(): string {
    return this.docService.activeHtml();
  }
}
