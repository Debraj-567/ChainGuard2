
export enum ReturnStep {
  ORDER_LOOKUP = 'ORDER_LOOKUP',
  SUPPLY_CHAIN_SYNC = 'SUPPLY_CHAIN_SYNC',
  RECEIPT_UPLOAD = 'RECEIPT_UPLOAD',
  RECEIPT_ANALYZING = 'RECEIPT_ANALYZING',
  UPLOAD = 'UPLOAD',
  ANALYZING = 'ANALYZING',
  FRAUD_CHECK = 'FRAUD_CHECK',
  MULTI_AGENT_CONSENSUS = 'MULTI_AGENT_CONSENSUS',
  BLOCKCHAIN_SYNC = 'BLOCKCHAIN_SYNC',
  COMPLETE = 'COMPLETE',
  DASHBOARD = 'DASHBOARD'
}

export interface User {
  name: string;
  email: string;
  avatar: string;
}

export interface ExternalBot {
  id: string;
  name: string;
  role: 'Legal' | 'Finance' | 'Logistics' | 'Supervisor';
  systemInstruction: string;
  isConnected: boolean;
}

export interface BotOpinion {
  botName: string;
  role: string;
  status: 'APPROVED' | 'DECLINED' | 'WARNING';
  comment: string;
}

export interface ReceiptAnalysis {
  isValid: boolean;
  merchantName: string;
  date: string;
  confidenceScore: number;
  itemsFound: string[];
}

// New Interfaces for Supply Chain Integration
export interface SupplyChainEvent {
  id: string;
  timestamp: string;
  stage: 'MANUFACTURING' | 'WAREHOUSE' | 'LOGISTICS' | 'RETAIL';
  action: string;
  location: string;
  actor: string; // The Bot or System Name
  hash: string;
}

export interface ProductPassport {
  uniqueId: string; // The immutable ID from Phase 1
  genesisHash: string;
  manufactureDate: string;
  originFactory: string;
  history: SupplyChainEvent[];
}

export interface OrderDetails {
  platform: string;
  orderId: string;
  productName: string;
  category: string; 
  productImage?: string;
  purchaseDate: string;
  price: number;
  // Item-Level Check Fields
  sku: string;
  serialNumber?: string;
  fulfillmentStatus: 'Processing' | 'Shipped' | 'Delivered';
  // Supply Chain Link
  productPassport?: ProductPassport;
  // New Field
  receiptVerified?: boolean;
  // User Context for Fraud
  userId: string;
  userEmail: string;
  userIp: string;
  deviceId: string;
}

export interface AnalysisResult {
  itemType: string;
  condition: 'New' | 'Like New' | 'Used' | 'Damaged' | 'Product Mismatch';
  defects: string[];
  authenticityScore: number;
  estimatedRefund: number;
  reasoning: string;
  // Business Rule Results
  policyStatus?: 'APPROVED' | 'DECLINED' | 'MANUAL_REVIEW';
  policyReason?: string;
  // Fraud Results
  fraudRisk?: FraudRiskReport;
  // Multi-Agent Results
  botConsensus?: BotOpinion[];
}

export interface FraudRiskReport {
  riskScore: number; // 0-100
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  detectedPatterns: string[];
  flags: {
    isWardrobing: boolean;
    isSerialReturner: boolean;
    isSyndicate: boolean;
    isDeviceSpoofing: boolean;
    isAccountHopping: boolean;
    isFakeReceipt: boolean;
  };
  networkGraphId?: string; // ID of the fraud ring if detected
}

export interface Block {
  index: number;
  timestamp: string;
  data: AnalysisResult;
  previousHash: string;
  hash: string;
  orderDetails?: OrderDetails;
}

export interface Transaction {
  id: string;
  status: 'Pending' | 'Verified' | 'Refunded';
  amount: number;
  product: string;
  hash: string;
}
