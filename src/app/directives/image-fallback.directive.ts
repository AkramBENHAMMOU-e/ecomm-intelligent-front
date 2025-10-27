import { Directive, ElementRef, Input, HostListener } from '@angular/core';

@Directive({
  selector: 'img[appImageFallback]',
  standalone: false
})
export class ImageFallbackDirective {
  @Input() fallbackSrc: string = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzZiNzI4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vbiBkaXNwb25pYmxlPC90ZXh0Pjwvc3ZnPg==';
  @Input() appImageFallback: string = '';

  private retryCount = 0;
  private maxRetries = 2;

  constructor(private el: ElementRef<HTMLImageElement>) {}

  @HostListener('error')
  onError(): void {
    this.retryCount++;
    
    if (this.retryCount <= this.maxRetries) {
      // Essayer de recharger l'image
      this.el.nativeElement.src = this.el.nativeElement.src;
    } else {
      // Utiliser l'image de fallback (data URI SVG)
      this.el.nativeElement.src = this.fallbackSrc;
      this.el.nativeElement.alt = 'Image non disponible';
      
      // Ajouter une classe CSS pour styliser l'image de fallback
      this.el.nativeElement.classList.add('image-fallback');
    }
  }

  @HostListener('load')
  onLoad(): void {
    // Réinitialiser le compteur de tentatives en cas de succès
    this.retryCount = 0;
    this.el.nativeElement.classList.remove('image-fallback');
  }
}
