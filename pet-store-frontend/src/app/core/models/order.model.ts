import { CartItemType } from './cart.model';

export type OrderStatus = 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
export type PaymentStatus = 'PAID' | 'FAILED' | 'REFUNDED';
export type CardBrand = 'VISA' | 'MASTERCARD' | 'AMEX' | 'DISCOVER' | 'UNKNOWN';

export interface PaymentRequest {
  cardholderName: string;
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
}

export interface CheckoutRequest {
  recipientName: string;
  recipientPhone: string;
  shippingAddressLine1: string;
  shippingAddressLine2?: string;
  shippingCity: string;
  shippingState: string;
  shippingPostalCode: string;
  shippingCountry?: string;
  payment: PaymentRequest;
}

export interface OrderItemResponse {
  id: number;
  itemType: CartItemType;
  itemId?: number;
  title: string;
  subtitle?: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  photoUrl?: string | null;
}

export interface OrderResponse {
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  transactionId: string;
  cardBrand: CardBrand;
  cardLastFour: string;
  subtotal: number;
  taxAmount: number;
  shippingAmount: number;
  totalAmount: number;
  recipientName: string;
  recipientPhone: string;
  shippingAddressLine1: string;
  shippingAddressLine2?: string;
  shippingCity: string;
  shippingState: string;
  shippingPostalCode: string;
  shippingCountry: string;
  items: OrderItemResponse[];
  createdAt: string;
}

export interface CheckoutQuote {
  subtotal: number;
  shippingAmount: number;
  isFreeShipping: boolean;
  taxAmount: number;
  totalAmount: number;
  totalItems: number;
  hasPet: boolean;
}
