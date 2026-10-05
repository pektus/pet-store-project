export type CartItemType = 'PET' | 'SUPPLY';

export interface CartItem {
  id: number;
  itemType: CartItemType;
  itemId: number;
  title: string;
  subtitle?: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  photoUrl?: string | null;
  isAvailable: boolean;
  stockAvailable?: number;
  availabilityMessage?: string | null;
}

export interface Cart {
  cartId: number;
  sessionToken?: string;
  totalItems: number;
  totalPrice: number;
  canCheckout: boolean;
  items: CartItem[];
}

export interface AddToCartRequest {
  itemType: CartItemType;
  itemId: number;
  quantity: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}

export interface CartSyncItem {
  itemType: CartItemType;
  itemId: number;
  quantity: number;
}

export interface CartSyncRequest {
  items: CartSyncItem[];
}
