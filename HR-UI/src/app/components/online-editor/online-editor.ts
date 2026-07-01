import {
  Component,
  inject,
  OnInit,
  ViewChild,
  ElementRef,
  AfterViewInit,
  Output,
  EventEmitter,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DocumentService } from '../../services/document.service';
import { DownloadService } from '../../services/download.service';

@Component({
  selector: 'app-online-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './online-editor.html',
  styleUrl: './online-editor.css',
})
export class OnlineEditorComponent implements OnInit, AfterViewInit {
  public readonly docService = inject(DocumentService);
  private readonly downloadService = inject(DownloadService);

  @Output() triggerPreview = new EventEmitter<void>();
  @Output() navigateBack = new EventEmitter<void>();

  @ViewChild('pageElement') pageElement!: ElementRef<HTMLDivElement>;

  public zoom: number = 100;
  public dropdownOpen: boolean = false;

  public totalEarnings: string = '0';
  public totalDeductions: string = '0';
  public netSalary: string = '0';
  public newParticularName: string = '';
  public newParticularType: 'earning' | 'deduction' = 'earning';

  public ngOnInit() {
    this.calculatePayslipIfNeeded();
  }

  public ngAfterViewInit() {
    this.renderTemplateInEditor();
  }

  public goBack() {
    this.docService.selectFolder(null);
    this.navigateBack.emit();
  }

  public adjustZoom(amount: number) {
    const newZoom = this.zoom + amount;
    if (newZoom >= 50 && newZoom <= 150) {
      this.zoom = newZoom;
    }
  }

  public execCommand(command: string, value: string = '') {
    document.execCommand(command, false, value);
    this.saveEditorContent();
  }

  public insertTable() {
    const tableHTML = `
      <table style="width: 100%; border-collapse: collapse; margin-top: 15px; border: 1px solid #e1e5eb;">
        <thead>
          <tr style="background-color: #f7fafc;">
            <th style="border: 1px solid #e1e5eb; padding: 8px; text-align: left;">Header 1</th>
            <th style="border: 1px solid #e1e5eb; padding: 8px; text-align: left;">Header 2</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border: 1px solid #e1e5eb; padding: 8px;">Cell 1</td>
            <td style="border: 1px solid #e1e5eb; padding: 8px;">Cell 2</td>
          </tr>
        </tbody>
      </table>
    `;
    document.execCommand('insertHTML', false, tableHTML);
    this.saveEditorContent();
  }

  public getVariablesList(): string[] {
    const vars = this.docService.activeVariables();
    return Object.keys(vars).filter((key) => {
      if (this.docService.selectedTypeId() === 'payslip') {
        return !['totalEarnings', 'totalDeductions', 'netSalary', 'netSalaryWords'].includes(key);
      }
      return true;
    });
  }

  public formatLabel(key: string): string {
    const result = key.replace(/([A-Z])/g, ' $1');
    return result.charAt(0).toUpperCase() + result.slice(1);
  }

  public isDateField(key: string): boolean {
    return key.toLowerCase().includes('date');
  }

  public isNumberField(key: string): boolean {
    const numFields = [
      'salary',
      'basic',
      'hra',
      'conveyance',
      'special',
      'pf',
      'pt',
      'tax',
      'daysWorked',
    ];
    return numFields.includes(key);
  }

  public onVariableChange(key: string, value: string) {
    this.docService.updateVariable(key, value);
    this.updateSpanInEditor(key, value);
    this.docService.incrementEdits();

    if (this.docService.selectedTypeId() === 'payslip') {
      this.calculatePayslipIfNeeded();
    }
  }

  private updateSpanInEditor(key: string, value: string) {
    if (!this.pageElement) return;
    const spans = this.pageElement.nativeElement.querySelectorAll(`.doc-var[data-var="${key}"]`);
    spans.forEach((span) => {
      (span as HTMLElement).innerText = value;
    });
    this.saveEditorContent();
  }

  public onEditorInput(event: Event) {
    const target = event.target as HTMLElement;
    const spans = target.querySelectorAll('.doc-var');
    spans.forEach((span) => {
      const key = span.getAttribute('data-var');
      const val = (span as HTMLElement).innerText;
      if (key) {
        this.docService.activeVariables()[key] = val;
      }
    });
    this.docService.incrementEdits();

    if (this.docService.selectedTypeId() === 'payslip') {
      this.calculatePayslipIfNeeded();
    }

    this.saveEditorContent();
  }

  private saveEditorContent() {
    if (this.pageElement) {
      this.docService.activeHtml.set(this.pageElement.nativeElement.innerHTML);
    }
  }

  private renderTemplateInEditor() {
    if (!this.pageElement) return;

    let html = this.docService.activeHtml();
    const vars = this.docService.activeVariables();

    Object.keys(vars).forEach((key) => {
      const placeholder = `{{${key}}}`;
      const value = vars[key] || '';
      const regex = new RegExp(placeholder.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g');
      html = html.replace(
        regex,
        `<span class="doc-var" data-var="${key}" contenteditable="true">${value}</span>`,
      );
    });

    this.pageElement.nativeElement.innerHTML = html;
    this.saveEditorContent();
  }

  public toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  public async downloadPDF() {
    this.dropdownOpen = false;
    const name = this.docService.activeTemplateName();

    const btn = document.querySelector('.download-dropdown button');
    if (btn) btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> downloading...';

    const sheet = this.pageElement.nativeElement;
    sheet.classList.add('rendering-pdf');

    await this.downloadService.downloadAsPDF(
      this.pageElement.nativeElement.id || 'editor-sheet-print',
      name,
    );
    this.docService.incrementDownloads();

    sheet.classList.remove('rendering-pdf');
    if (btn)
      btn.innerHTML =
        '<i class="fa-solid fa-download"></i> Download <i class="fa-solid fa-chevron-down text-xs"></i>';
  }

  public downloadWordHTML() {
    this.dropdownOpen = false;
    const name = this.docService.activeTemplateName();
    let printHTML = this.pageElement.nativeElement.innerHTML;
    printHTML = printHTML.replace(/contenteditable="true"/g, '');
    printHTML = printHTML.replace(
      /class="doc-var"/g,
      'style="font-weight: 600; border-bottom: none;"',
    );

    printHTML = printHTML.replace(/padding:\s*40px/g, 'padding: 0px');
    printHTML = printHTML.replace(/padding:\s*30px/g, 'padding: 0px');
    printHTML = printHTML.replace(/padding:\s*20px/g, 'padding: 0px');

    this.downloadService.downloadAsWordHTML(printHTML, name);
    this.docService.incrementDownloads();
  }

  public async downloadNativeDocx() {
    this.dropdownOpen = false;
    const name = this.docService.activeTemplateName();
    const type = this.docService.selectedTypeId() || 'letter';

    await this.downloadService.downloadAsNativeDocx(this.docService.activeVariables(), type, name);
    this.docService.incrementDownloads();
  }

  private calculatePayslipIfNeeded() {
    if (this.docService.selectedTypeId() !== 'payslip') return;

    const sheet = this.pageElement?.nativeElement;
    if (!sheet) return;

    const earningElems = sheet.querySelectorAll('.val-earning');
    let earningsSum = 0;
    earningElems.forEach((el: Element) => {
      const text = (el as HTMLElement).innerText.trim().replace(/,/g, '');
      earningsSum += parseFloat(text) || 0;
    });

    const deductionElems = sheet.querySelectorAll('.val-deduction');
    let deductionsSum = 0;
    deductionElems.forEach((el: Element) => {
      const text = (el as HTMLElement).innerText.trim().replace(/,/g, '');
      deductionsSum += parseFloat(text) || 0;
    });

    const net = earningsSum - deductionsSum;

    this.totalEarnings = earningsSum.toFixed(2);
    this.totalDeductions = deductionsSum.toFixed(2);
    this.netSalary = net.toFixed(2);

    setTimeout(() => {
      this.updateElementVal('val-totalEarnings', this.totalEarnings);
      this.updateElementVal('val-totalDeductions', this.totalDeductions);
      this.updateElementVal('val-netSalary', this.netSalary);
    }, 30);
  }

  public addParticularRow() {
    const name = this.newParticularName.trim();
    const type = this.newParticularType;
    if (!name) return;

    const sheet = this.pageElement?.nativeElement;
    if (!sheet) return;

    const totalRow = sheet.querySelector('#payslip-total-row');
    const tableBody = sheet.querySelector('#payslip-table-body');
    if (!tableBody || !totalRow) return;

    const tr = document.createElement('tr');
    const cellStyle = 'padding: 8px; border: 1px solid #cbd5e1;';
    const emptyStyle = `${cellStyle} font-weight: 500; color: #a0aec0;`;
    const valStyle = `${cellStyle} text-align: right; font-weight: 600;`;

    if (type === 'earning') {
      tr.innerHTML = `
        <td style="${cellStyle} font-weight: 500;">${name}</td>
        <td style="${valStyle}" class="val-earning" contenteditable="true">0.00</td>
        <td style="${emptyStyle}">-</td>
        <td style="${cellStyle} text-align: right; color: #a0aec0;">0</td>
      `;
    } else {
      tr.innerHTML = `
        <td style="${emptyStyle}">-</td>
        <td style="${cellStyle} text-align: right; color: #a0aec0;">0</td>
        <td style="${cellStyle} font-weight: 500;">${name}</td>
        <td style="${valStyle}" class="val-deduction" contenteditable="true">0.00</td>
      `;
    }

    tableBody.insertBefore(tr, totalRow);
    this.newParticularName = '';
    this.calculatePayslipIfNeeded();
  }

  private updateElementVal(id: string, value: string) {
    if (!this.pageElement) return;
    const elem = this.pageElement.nativeElement.querySelector(`#${id}`);
    if (elem) {
      (elem as HTMLElement).innerText = value;
    }
  }

  private numberToWords(num: number): string {
    const a = [
      '',
      'One ',
      'Two ',
      'Three ',
      'Four ',
      'Five ',
      'Six ',
      'Seven ',
      'Eight ',
      'Nine ',
      'Ten ',
      'Eleven ',
      'Twelve ',
      'Thirteen ',
      'Fourteen ',
      'Fifteen ',
      'Sixteen ',
      'Seventeen ',
      'Eighteen ',
      'Nineteen ',
    ];
    const b = [
      '',
      '',
      'Twenty',
      'Thirty',
      'Forty',
      'Fifty',
      'Sixty',
      'Seventy',
      'Eighty',
      'Ninety',
    ];

    if ((num = Math.floor(num)) === 0) return 'Zero';

    const n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return '';

    let str = '';
    str +=
      Number(n[1]) != 0
        ? (a[Number(n[1])] || b[Number(n[1].substr(0, 1))] + ' ' + a[Number(n[1].substr(1))]) +
          'Crore '
        : '';
    str +=
      Number(n[2]) != 0
        ? (a[Number(n[2])] || b[Number(n[2].substr(0, 1))] + ' ' + a[Number(n[2].substr(1))]) +
          'Lakh '
        : '';
    str +=
      Number(n[3]) != 0
        ? (a[Number(n[3])] || b[Number(n[3].substr(0, 1))] + ' ' + a[Number(n[3].substr(1))]) +
          'Thousand '
        : '';
    str +=
      Number(n[4]) != 0
        ? (a[Number(n[4])] || b[Number(n[4].substr(0, 1))] + ' ' + a[Number(n[4].substr(1))]) +
          'Hundred '
        : '';
    str +=
      Number(n[5]) != 0
        ? (str != '' ? 'and ' : '') +
          (a[Number(n[5])] || b[Number(n[5].substr(0, 1))] + ' ' + a[Number(n[5].substr(1))])
        : '';
    return str.trim();
  }
}
