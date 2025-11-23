
import { ProductPassport, SupplyChainEvent } from '../types';

/**
 * Simulates fetching the immutable history using the same Seeded Random logic.
 * This ensures that "Manufacturing Node" data matches on both PCs if the ID is the same.
 */

class SeededRandom {
  private seed: number;
  constructor(seedStr: string) {
    let h = 0x811c9dc5;
    for (let i = 0; i < seedStr.length; i++) {
      h ^= seedStr.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    this.seed = h;
  }
  next() {
    this.seed = Math.imul(this.seed, 48271) % 2147483647;
    return (this.seed & 2147483647) / 2147483647;
  }
  pick<T>(array: T[]): T {
    return array[Math.floor(this.next() * array.length)];
  }
}

export const fetchProductPassport = async (uniqueId: string, productName: string): Promise<ProductPassport> => {
  // Simulate network handshake
  await new Promise(resolve => setTimeout(resolve, 1500));

  const rng = new SeededRandom(uniqueId);
  const now = new Date();
  const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();

  const factories = ['Factory Node 1 (Shenzhen)', 'Factory Node 2 (Vietnam)', 'Assembly Hub Alpha (India)'];
  const factory = rng.pick(factories);
  
  const mfgDaysAgo = 30 + Math.floor(rng.next() * 60); // 30-90 days ago

  const history: SupplyChainEvent[] = [
    {
      id: `EVT-${Math.floor(rng.next() * 100000).toString(16).toUpperCase()}`,
      timestamp: daysAgo(mfgDaysAgo),
      stage: 'MANUFACTURING',
      action: 'Component Assembly & QA Check',
      location: factory,
      actor: `Bot: Assembler-${Math.floor(rng.next() * 100)}`,
      hash: `0x${Math.floor(rng.next() * 1000000000).toString(16)}`
    },
    {
      id: `EVT-${Math.floor(rng.next() * 100000).toString(16).toUpperCase()}`,
      timestamp: daysAgo(mfgDaysAgo - 1),
      stage: 'MANUFACTURING',
      action: 'Digital Twin Created (Genesis Block)',
      location: factory,
      actor: 'Bot: Ledger-Architect',
      hash: `0x${Math.floor(rng.next() * 1000000000).toString(16)}`
    },
    {
      id: `EVT-${Math.floor(rng.next() * 100000).toString(16).toUpperCase()}`,
      timestamp: daysAgo(mfgDaysAgo - 5),
      stage: 'LOGISTICS',
      action: 'Departed Manufacturing Facility',
      location: 'Logistics Hub A',
      actor: 'System: Logistics-Relay',
      hash: `0x${Math.floor(rng.next() * 1000000000).toString(16)}`
    },
    {
      id: `EVT-${Math.floor(rng.next() * 100000).toString(16).toUpperCase()}`,
      timestamp: daysAgo(mfgDaysAgo - 10),
      stage: 'WAREHOUSE',
      action: 'Inbound Scan & Shelving',
      location: 'Regional Warehouse (Mumbai)',
      actor: 'Bot: Inventory-Scanner',
      hash: `0x${Math.floor(rng.next() * 1000000000).toString(16)}`
    },
    {
      id: `EVT-${Math.floor(rng.next() * 100000).toString(16).toUpperCase()}`,
      timestamp: daysAgo(Math.floor(rng.next() * 10)), // Recent retail event
      stage: 'RETAIL',
      action: 'Point of Sale Activation',
      location: 'Online Storefront',
      actor: 'System: Order-Dispatcher',
      hash: `0x${Math.floor(rng.next() * 1000000000).toString(16)}`
    }
  ];

  return {
    uniqueId: uniqueId,
    genesisHash: '0x' + Array(64).fill(0).map(() => Math.floor(rng.next() * 16).toString(16)).join(''),
    manufactureDate: daysAgo(mfgDaysAgo),
    originFactory: factory,
    history: history
  };
};
