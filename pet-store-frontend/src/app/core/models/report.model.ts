export type SalesPeriod = 'DAY' | 'WEEK' | 'MONTH';

export interface SalesDataPoint {
  periodLabel: string;
  grossRevenue: number;
  refundAmount: number;
  netRevenue: number;
  ordersCount: number;
  petsCount: number;
  suppliesCount: number;
}

export interface SalesReport {
  period: SalesPeriod;
  grossRevenue: number;
  refundAmount: number;
  netRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  petsAdopted: number;
  suppliesSold: number;
  dataPoints: SalesDataPoint[];
}

export interface LowStockAlert {
  sku: string;
  name: string;
  stockQuantity: number;
  lowStockThreshold: number;
  unitPrice: number;
}

export interface PetCategoryBreakdown {
  category: string;
  total: number;
  available: number;
  adopted: number;
  adoptionRate: number;
}

export interface InventoryReport {
  totalPets: number;
  availablePets: number;
  adoptedPets: number;
  totalSupplySkus: number;
  inStockSuppliesCount: number;
  lowStockSuppliesCount: number;
  outOfStockSuppliesCount: number;
  totalSuppliesStockUnits: number;
  totalSuppliesValuation: number;
  lowStockAlerts: LowStockAlert[];
  petCategoryBreakdown: PetCategoryBreakdown[];
}
