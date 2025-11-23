export enum UserRole {
  MANUFACTURER = 'Manufacturer',
  WAREHOUSE = 'Warehouse',
  RETAILER = 'Retailer',
  CUSTOMER = 'Customer', // For public verification view
  EXPLORER = 'Chain Explorer', // Admin
  ADMIN = 'System Admin'
}

export enum ProductStatus {
  PRODUCT_CREATED = 'PRODUCT_CREATED',
  DEPARTED_MANUFACTURER = 'DEPARTED_MANUFACTURER',
  ARRIVED_WAREHOUSE = 'ARRIVED_WAREHOUSE',
  DEPARTED_WAREHOUSE = 'DEPARTED_WAREHOUSE',
  ARRIVED_SHOP = 'ARRIVED_SHOP', // Displayed as "Stocked"
  AVAILABLE_FOR_SALE = 'AVAILABLE_FOR_SALE',
  SOLD_TO_CUSTOMER = 'SOLD_TO_CUSTOMER',
  REFUNDED = 'REFUNDED' // New status for Phase 2
}

export interface InvoiceData {
  invoiceId: string;
  productUid: string;
  productName: string;
  category: string;
  batchNumber: string;
  price: string;
  currency: string;
  purchaseDate: string;
  shopName: string;
  shopLocation: string;
  customerIdHash: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
}

export interface ProductMetadata {
  name: string;
  category: string;
  manufactureDate: string;
  batchNumber: string;
  manufacturer: string;
  model?: string;
  serialNumber?: string;
  warranty?: string;
  expiryDate?: string;
  imageHash?: string; // SHA256 of the image data
  imageUrl?: string; // Base64 data for demo display
  ipfsCid?: string; // Simulated IPFS Content ID
  details?: string; // AI Generated description
  invoice?: InvoiceData; // Full invoice object upon sale
}

export interface RefundRecord {
    requestId: string;
    timestamp: number;
    status: 'APPROVED' | 'REJECTED';
    rejectionReason?: string;
    refundAmount?: string;
}

export interface Transaction {
  id: string; // Transaction ID
  timestamp: number;
  type: 'REGISTRATION' | 'STATUS_UPDATE' | 'REFUND_DECISION';
  productUid: string;
  actor: string; // The entity performing action
  status: ProductStatus;
  metadata?: ProductMetadata; // Only present on registration
  location?: string;
  notes?: string;
  refundData?: RefundRecord; // Present if type is REFUND_DECISION
}

export interface Block {
  index: number;
  timestamp: number;
  data: Transaction[];
  previousHash: string;
  hash: string;
  nonce: number;
}

export interface ProductState {
  uid: string;
  currentStatus: ProductStatus;
  history: Transaction[];
  metadata: ProductMetadata;
}