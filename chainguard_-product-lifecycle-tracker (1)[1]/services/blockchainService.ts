import { Block, Transaction, ProductStatus, ProductState, UserRole } from '../types';
import { sha256 } from './cryptoService';

const STORAGE_KEY = 'chainguard_chain_v2';

export class BlockchainService {
  public chain: Block[];
  public pendingTransactions: Transaction[];

  constructor() {
    this.chain = [];
    this.pendingTransactions = [];
    this.loadChain();
  }

  private async loadChain() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      this.chain = JSON.parse(stored);
    } else {
      await this.createGenesisBlock();
    }
  }

  private async createGenesisBlock() {
    const genesisBlock: Block = {
      index: 0,
      timestamp: Date.now(),
      data: [],
      previousHash: "0",
      hash: await sha256("GENESIS_BLOCK"),
      nonce: 0
    };
    this.chain = [genesisBlock];
    this.saveChain();
  }

  public saveChain() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.chain));
  }

  public async getLatestBlock(): Promise<Block> {
    if (this.chain.length === 0) await this.loadChain();
    return this.chain[this.chain.length - 1];
  }

  public async addTransaction(transaction: Transaction): Promise<void> {
    this.pendingTransactions.push(transaction);
    await this.mineBlock(); // Auto-mine for demo purposes immediately
  }

  private async mineBlock() {
    const latestBlock = await this.getLatestBlock();
    const index = latestBlock.index + 1;
    const timestamp = Date.now();
    const data = [...this.pendingTransactions];
    const previousHash = latestBlock.hash;
    let nonce = 0;
    let hash = await this.calculateHash(index, previousHash, timestamp, data, nonce);

    // Simple Proof of Work simulation (difficulty 2)
    while (hash.substring(0, 2) !== "00") {
        nonce++;
        hash = await this.calculateHash(index, previousHash, timestamp, data, nonce);
    }

    const newBlock: Block = {
      index,
      timestamp,
      data,
      previousHash,
      hash,
      nonce
    };

    this.chain.push(newBlock);
    this.pendingTransactions = [];
    this.saveChain();
  }

  private async calculateHash(index: number, previousHash: string, timestamp: number, data: Transaction[], nonce: number): Promise<string> {
    return sha256(index + previousHash + timestamp + JSON.stringify(data) + nonce);
  }

  // --- Read Operations ---

  public getAllProducts(): ProductState[] {
    const productMap = new Map<string, ProductState>();

    // Replay the blockchain to build state
    for (const block of this.chain) {
      for (const tx of block.data) {
        if (tx.type === 'REGISTRATION') {
          productMap.set(tx.productUid, {
            uid: tx.productUid,
            currentStatus: tx.status,
            history: [tx],
            metadata: tx.metadata!
          });
        } else if (tx.type === 'STATUS_UPDATE' || tx.type === 'REFUND_DECISION') {
            const product = productMap.get(tx.productUid);
            if (product) {
                product.currentStatus = tx.status;
                product.history.push(tx);
                // Update metadata if relevant (e.g., adding invoice on sale)
                if (tx.metadata?.invoice) {
                    product.metadata.invoice = tx.metadata.invoice;
                }
            }
        }
      }
    }
    return Array.from(productMap.values());
  }

  public getProductByUid(uid: string): ProductState | null {
    const products = this.getAllProducts();
    return products.find(p => p.uid === uid) || null;
  }

  // --- Smart Contract Logic (Validation) ---

  public validateTransition(product: ProductState, nextStatus: ProductStatus, role: UserRole): { valid: boolean; error?: string } {
    const current = product.currentStatus;

    // Manufacturer: Created -> Departed Manufacturer
    if (role === UserRole.MANUFACTURER) {
        if (nextStatus === ProductStatus.DEPARTED_MANUFACTURER && current === ProductStatus.PRODUCT_CREATED) return { valid: true };
    }

    // Warehouse: Departed Manufacturer -> Arrived Warehouse -> Departed Warehouse
    if (role === UserRole.WAREHOUSE) {
        if (nextStatus === ProductStatus.ARRIVED_WAREHOUSE && current === ProductStatus.DEPARTED_MANUFACTURER) return { valid: true };
        if (nextStatus === ProductStatus.DEPARTED_WAREHOUSE && current === ProductStatus.ARRIVED_WAREHOUSE) return { valid: true };
    }

    // Retailer: Departed Warehouse -> Arrived Shop -> Available for Sale -> Sold
    if (role === UserRole.RETAILER) {
        if (nextStatus === ProductStatus.ARRIVED_SHOP && current === ProductStatus.DEPARTED_WAREHOUSE) return { valid: true };
        if (nextStatus === ProductStatus.AVAILABLE_FOR_SALE && current === ProductStatus.ARRIVED_SHOP) return { valid: true };
        if (nextStatus === ProductStatus.SOLD_TO_CUSTOMER && current === ProductStatus.AVAILABLE_FOR_SALE) return { valid: true };
    }
    
    // System/Refund Logic (Phase 2)
    if (nextStatus === ProductStatus.REFUNDED) {
         if (current === ProductStatus.SOLD_TO_CUSTOMER) return { valid: true };
         return { valid: false, error: "Product must be SOLD before it can be REFUNDED." };
    }

    // Admin/Explorer can't move products in this model, only view
    return { valid: false, error: `Invalid transition from ${current} to ${nextStatus} by ${role}` };
  }

  // Phase 2: Refund Eligibility Check
  public checkRefundEligibility(product: ProductState): { eligible: boolean; reason?: string } {
      const history = product.history.map(tx => tx.status);
      
      // 1. Check Status
      if (product.currentStatus === ProductStatus.REFUNDED) {
          return { eligible: false, reason: "Product has already been refunded." };
      }
      if (product.currentStatus !== ProductStatus.SOLD_TO_CUSTOMER) {
          return { eligible: false, reason: "Product is not marked as 'Sold'. Refund denied." };
      }

      // 2. Verify Supply Chain Completeness (Anti-Fraud: Did it skip steps?)
      const requiredSteps = [
          ProductStatus.PRODUCT_CREATED,
          ProductStatus.DEPARTED_MANUFACTURER,
          // Note: Can skip strict warehouse checks if direct shipping allowed, but Phase 1 implies verified chain.
          // We will check for at least one Manufacturer and one Shop event.
          ProductStatus.AVAILABLE_FOR_SALE,
          ProductStatus.SOLD_TO_CUSTOMER
      ];

      const hasGap = requiredSteps.some(step => !history.includes(step));
      if (hasGap) {
           return { eligible: false, reason: "Supply Chain Gap Detected. Product history is incomplete." };
      }

      // 3. Invoice Verification
      if (!product.metadata.invoice) {
           return { eligible: false, reason: "No digital invoice found on blockchain." };
      }

      return { eligible: true };
  }
}

export const blockchainInstance = new BlockchainService();