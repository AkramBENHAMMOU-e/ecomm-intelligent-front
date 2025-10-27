import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Product } from '../../models/product.model';
import { ProductService } from '../../services/product.service';
import { DescriptionGenerationService } from '../../services/description-generation.service';

@Component({
  selector: 'app-add-product',
  standalone: false,
  templateUrl: './add-product.html',
  styleUrls: ['./add-product.css']
})

export class AddProduct implements OnInit {
  // Inputs from parent
  @Input() product: Product = {
    id: undefined as any,
    name: '',
    description: '',
    price: 0,
    quantity: 1,
    category: '',
    image: '',
    brand: '',
    origin: '',
    region: '',
    process: '',
    roastLevel: '',
    tastingNotes: '',
    weight: 0,
    isActive: true
  };
  @Input() isEditMode = false;

  // Outputs to parent
  @Output() productSaved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  // Component state
  saving = false;
  error: string | null = null;
  success: string | null = null;
  generatingDescription = false;

  // Form validation
  formErrors: {[key: string]: string} = {};

  constructor(
    private productService: ProductService,
    private descriptionGenerationService: DescriptionGenerationService
  ) {}

  ngOnInit(): void {
    // No need to load product as it's passed via @Input
  }

  validateForm(): boolean {
    this.formErrors = {};
    let isValid = true;

    // Validate name
    if (!this.product.name?.trim()) {
      this.formErrors['name'] = 'Le nom du produit est requis';
      isValid = false;
    } else if (this.product.name.trim().length < 2) {
      this.formErrors['name'] = 'Le nom doit contenir au moins 2 caractères';
      isValid = false;
    }

    // Validate description
    // Description is optional - admin can choose to add manually or generate with AI
    if (this.product.description?.trim() && this.product.description.trim().length < 10) {
      this.formErrors['description'] = 'La description doit contenir au moins 10 caractères si elle est fournie';
      isValid = false;
    }

    // Validate price
    if (!this.product.price || this.product.price <= 0) {
      this.formErrors['price'] = 'Le prix doit être supérieur à 0';
      isValid = false;
    }

    // Validate quantity
    if (!this.product.quantity || this.product.quantity <= 0) {
      this.formErrors['quantity'] = 'La quantité doit être supérieure à 0';
      isValid = false;
    } else if (this.product.quantity > 9999) {
      this.formErrors['quantity'] = 'La quantité ne peut pas dépasser 9999';
      isValid = false;
    } else if (!Number.isInteger(this.product.quantity)) {
      this.formErrors['quantity'] = 'La quantité doit être un nombre entier';
      isValid = false;
    }

    // Validate category
    if (!this.product.category?.trim()) {
      this.formErrors['category'] = 'La catégorie est requise';
      isValid = false;
    }

    // Validate image URL (optional)
    if (this.product.image?.trim() && !this.isValidUrl(this.product.image)) {
      this.formErrors['image'] = 'L\'URL de l\'image n\'est pas valide';
      isValid = false;
    }

    return isValid;
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  onSubmit(): void {
    this.error = null;
    this.success = null;

    if (!this.validateForm()) {
      return;
    }

    this.saving = true;

    if (this.isEditMode) {
      this.updateProduct();
    } else {
      this.createProduct();
    }
  }

  private createProduct(): void {
    this.productService.addProduct(this.product).subscribe({
      next: (createdProduct) => {
        console.log('Product created successfully:', createdProduct);
        this.saving = false;
        this.success = 'Produit créé avec succès!';
        setTimeout(() => {
          this.productSaved.emit();
        }, 1000);
      },
      error: (err) => {
        console.error('Failed to create product', err);
        this.saving = false;
        this.error = 'Impossible de créer le produit. Veuillez réessayer.';
      }
    });
  }

  private updateProduct(): void {
    this.productService.updateProduct(this.product.id, this.product).subscribe({
      next: (updatedProduct) => {
        console.log('Product updated successfully:', updatedProduct);
        this.saving = false;
        this.success = 'Produit mis à jour avec succès!';
        setTimeout(() => {
          this.productSaved.emit();
        }, 1000);
      },
      error: (err) => {
        console.error('Failed to update product', err);
        this.saving = false;
        this.error = 'Impossible de mettre à jour le produit. Veuillez réessayer.';
      }
    });
  }

  onCancel(): void {
    this.cancelled.emit();
  }

  onReset(): void {
    this.formErrors = {};
    this.error = null;
    this.success = null;
  }

  /**
   * Génère une description automatique pour le produit en utilisant l'IA
   */
  generateDescription(): void {
    // Vérifier que les champs requis sont remplis
    if (!this.product.name?.trim()) {
      this.error = 'Veuillez d\'abord saisir le nom du produit';
      return;
    }

    if (!this.product.category?.trim()) {
      this.error = 'Veuillez d\'abord sélectionner une catégorie';
      return;
    }

    if (!this.product.price || this.product.price <= 0) {
      this.error = 'Veuillez d\'abord saisir un prix valide';
      return;
    }

    this.generatingDescription = true;
    this.error = null;

    this.descriptionGenerationService.generateDescriptionForProduct(
      this.product.name,
      this.product.category,
      this.product.price,
      this.product.quantity,
      this.product.brand,
      this.product.origin
    ).subscribe({
      next: (generatedDescription) => {
        this.product.description = generatedDescription;
        this.generatingDescription = false;
        this.success = 'Description générée avec succès !';
        
        // Effacer le message de succès après 3 secondes
        setTimeout(() => {
          this.success = null;
        }, 3000);
      },
      error: (err) => {
        console.error('Erreur lors de la génération de la description:', err);
        this.generatingDescription = false;
        this.error = 'Impossible de générer la description. Veuillez réessayer.';
      }
    });
  }
}