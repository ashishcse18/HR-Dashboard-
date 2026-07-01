import { Directive, ElementRef, HostListener, Input, Renderer2, inject } from '@angular/core';

@Directive({
  selector: '[appTooltip]',
  standalone: true,
})
export class TooltipDirective {
  @Input('appTooltip') tooltipTitle = '';
  private tooltipEl: HTMLSpanElement | null = null;

  private readonly el = inject(ElementRef);
  private readonly renderer = inject(Renderer2);

  @HostListener('mouseenter') onMouseEnter() {
    if (!this.tooltipTitle) return;
    this.showTooltip();
  }

  @HostListener('mouseleave') onMouseLeave() {
    this.hideTooltip();
  }

  private showTooltip() {
    this.tooltipEl = this.renderer.createElement('span');
    this.renderer.appendChild(this.tooltipEl, this.renderer.createText(this.tooltipTitle));

    this.renderer.appendChild(document.body, this.tooltipEl);
    this.renderer.addClass(this.tooltipEl, 'app-tooltip-bubble');

    const hostPos = this.el.nativeElement.getBoundingClientRect();

    this.renderer.setStyle(this.tooltipEl, 'position', 'absolute');
    this.renderer.setStyle(this.tooltipEl, 'z-index', '10000');

    const tooltipPos = this.tooltipEl!.getBoundingClientRect();

    const top = hostPos.top - tooltipPos.height - 8 + window.scrollY;
    const left = hostPos.left + (hostPos.width - tooltipPos.width) / 2 + window.scrollX;

    this.renderer.setStyle(this.tooltipEl, 'top', `${top}px`);
    this.renderer.setStyle(this.tooltipEl, 'left', `${left}px`);
  }

  private hideTooltip() {
    if (this.tooltipEl) {
      this.renderer.removeChild(document.body, this.tooltipEl);
      this.tooltipEl = null;
    }
  }
}
