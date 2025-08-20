export enum Page {
  Dashboard,
  Products,
  Pos,
  Customers,
  Invoices,
  Expenses,
  Settings,
}

export interface Unit {
  id: number;
  name:string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  purchasePrice: number;
  unit: Unit;
  quantity: number;
  supplier: string;
  productionDate: string;
  expiryDate: string;
  barcode: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  notes: string;
  debt: number;
  invoiceCount: number;
  lastTransaction: string;
}

export interface InvoiceItem {
  product: Product;
  quantity: number;
  unit: Unit;
  price: number;
}

export enum PaymentType {
  Cash = 'نقدي',
  Credit = 'آجل',
  Partial = 'جزئي',
}

export interface Amount {
  type: 'percentage' | 'fixed';
  value: number;
}

export interface Invoice {
  id: string;
  date: string;
  time: string;
  customer: Customer | null;
  items: InvoiceItem[];
  subtotal: number;
  discount: Amount;
  tax: Amount;
  total: number;
  paymentType: PaymentType;
  amountPaid: number;
  isReturn?: boolean;
  originalInvoiceId?: string;
  // Returns tracking on same invoice
  returns?: { [productId: string]: number };
  refundedAmount?: number;
  // Audit: user who created the invoice
  createdById?: string;
  createdByName?: string;
}

export interface Expense {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
}

export interface User {
  id: string;
  name: string;
  password?: string;
  status: 'نشط' | 'غير نشط';
  permissions?: { [key in Page]?: boolean; };
}

export interface SystemSettings {
    systemName?: string;
    companyName: string;
    companyAddress: string;
    companyPhone: string;
    customInvoiceBarcode: string; // base64 image
    allowInvoiceEditing: boolean;
    enableStockAlerts: boolean;
    thankYouMessage?: string;
    barcodeText?: string;
    paperSize?: '58mm' | '80mm';
    // Sync Settings
    syncEnabled?: boolean;
    syncApiKey?: string;
    syncAuthDomain?: string;
    syncProjectId?: string;
    syncCollectionPrefix?: string; // e.g., 'pos'
    syncWhat?: {
      products?: boolean;
      customers?: boolean;
      invoices?: boolean;
      expenses?: boolean;
      users?: boolean;
      settings?: boolean;
    };
    lastSyncAt?: string; // ISO datetime
}