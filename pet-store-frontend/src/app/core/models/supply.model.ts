export type SupplyCategory = 
  | 'FOOD' 
  | 'TOYS' 
  | 'HEALTHCARE' 
  | 'ACCESSORIES' 
  | 'GROOMING' 
  | 'BEDDING' 
  | 'OTHER';

export type SupplyStatus = 'ACTIVE' | 'OUT_OF_STOCK' | 'DISCONTINUED';

export interface Supply {
  id: number;
  sku: string;
  name: string;
  category: SupplyCategory;
  price: number;
  stockQuantity: number;
  lowStockThreshold: number;
  status: SupplyStatus;
  isLowStock: boolean;
  isOutOfStock: boolean;
  itemType: 'MULTIPLE';
  description?: string | null;
  photoUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SupplyCreateRequest {
  sku?: string;
  name: string;
  category: SupplyCategory;
  price: number;
  stockQuantity?: number;
  lowStockThreshold?: number;
  description?: string;
  photoUrl?: string | null;
}

export interface SupplyUpdateRequest {
  name: string;
  category: SupplyCategory;
  price: number;
  lowStockThreshold?: number;
  status?: SupplyStatus;
  description?: string;
  photoUrl?: string | null;
}

export interface SupplyStockAdjustmentRequest {
  adjustment: number;
  reason?: string;
}
