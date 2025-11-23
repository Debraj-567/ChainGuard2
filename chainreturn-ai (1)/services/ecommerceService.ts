
import { OrderDetails } from '../types';

// Using "Canonical" Unsplash product images - these are the most reliable, high-uptime images used in demos globally.
const MOCK_PRODUCTS = [
  { 
    name: "Sony WH-1000XM5 Wireless Headphones", 
    category: "Electronics",
    price: 24990, 
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80" 
  },
  { 
    name: "Nike Air Max 270 Red", 
    category: "Footwear",
    price: 10495, 
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80" 
  },
  { 
    name: "Apple Watch Series 9 (Silver)", 
    category: "Electronics",
    price: 41900, 
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80" 
  },
  { 
    name: "Levis Men's Blue Denim Jeans", 
    category: "Fashion",
    price: 3299, 
    image: "https://images.unsplash.com/photo-1542272454315-5c0ea7386a00?auto=format&fit=crop&w=800&q=80" 
  },
  { 
    name: "Canon EOS Camera Kit", 
    category: "Electronics",
    price: 65999, 
    image: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80" 
  },
  {
    name: "MacBook Pro 14-inch",
    category: "Electronics",
    price: 114900,
    image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80"
  },
  {
    name: "Ray-Ban Classic Aviator",
    category: "Accessories",
    price: 8590,
    image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=800&q=80"
  },
  {
    name: "Travel Backpack (Grey)",
    category: "Fashion",
    price: 4500,
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80"
  },
  {
    name: "Skincare Essentials Set",
    category: "Beauty",
    price: 1200,
    image: "https://images.unsplash.com/photo-1556228720-19de7529c09d?auto=format&fit=crop&w=800&q=80"
  },
  {
    name: "Mechanical Gaming Keyboard",
    category: "Electronics",
    price: 4500,
    image: "https://images.unsplash.com/photo-1587829741301-dc798b91add1?auto=format&fit=crop&w=800&q=80"
  }
];

export const SUPPORTED_PLATFORMS = [
  { id: 'amazon', name: 'Amazon', color: 'bg-orange-500' },
  { id: 'flipkart', name: 'Flipkart', color: 'bg-blue-600' },
  { id: 'myntra', name: 'Myntra', color: 'bg-pink-600' },
  { id: 'ajio', name: 'Ajio', color: 'bg-slate-800' },
  { id: 'shopify', name: 'Direct Store', color: 'bg-green-600' }
];

// Deterministic Random Generator
// This ensures that if you enter "NIKE-123" on Computer A and Computer B, 
// you get the EXACT SAME results (Same product, same date, same user).
class SeededRandom {
  private seed: number;

  constructor(seedStr: string) {
    // Simple hash to integer
    let h = 0x811c9dc5;
    for (let i = 0; i < seedStr.length; i++) {
      h ^= seedStr.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    this.seed = h;
  }

  // Returns a number between 0 and 1
  next() {
    this.seed = Math.imul(this.seed, 48271) % 2147483647;
    return (this.seed & 2147483647) / 2147483647;
  }

  // Helper for ranges
  nextRange(min: number, max: number) {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  // Helper for array pick
  pick<T>(array: T[]): T {
    return array[Math.floor(this.next() * array.length)];
  }
}

export const fetchOrderDetails = async (platform: string, orderId: string): Promise<OrderDetails> => {
  // Simulate API Latency
  await new Promise(resolve => setTimeout(resolve, 800));

  if (!orderId || orderId.length < 3) {
    throw new Error("Invalid Order ID. Please check your receipt.");
  }

  // Initialize Seeded Random with the ID
  const rng = new SeededRandom(orderId.trim().toUpperCase());

  // Product Selection
  let productIndex = Math.floor(rng.next() * MOCK_PRODUCTS.length);
  
  // Keyword Overrides (Preserve these for specific demos)
  const idUpper = orderId.toUpperCase();
  if (idUpper.includes('NIKE')) productIndex = 1;
  else if (idUpper.includes('SONY')) productIndex = 0;
  else if (idUpper.includes('MAC')) productIndex = 5;
  else if (idUpper.includes('JEAN')) productIndex = 3;

  const product = MOCK_PRODUCTS[productIndex];

  // Deterministic Dates (0-60 days ago)
  const daysAgo = Math.floor(rng.next() * 60); 
  const purchaseDate = new Date(Date.now() - 1000 * 60 * 60 * 24 * daysAgo).toISOString().split('T')[0];

  // Deterministic Fulfillment
  const statusRoll = rng.next();
  const fulfillmentStatus = statusRoll > 0.95 ? 'Processing' : statusRoll > 0.90 ? 'Shipped' : 'Delivered';

  // Deterministic SKU
  const skuRandom = Math.floor(rng.next() * 10000);
  const sku = `${product.name.substring(0, 3).toUpperCase()}-${skuRandom}-${product.category.substring(0, 3).toUpperCase()}`;
  
  // Deterministic Serial
  const serialNumber = product.category === 'Electronics' 
    ? `SN${Math.floor(rng.next() * 10000000).toString(36).toUpperCase()}` 
    : undefined;

  // Deterministic User Context
  const userIdRandom = Math.floor(rng.next() * 100000).toString(16).toUpperCase();
  const userId = `USR-${userIdRandom}`;
  const userIp = `192.168.${Math.floor(rng.next() * 255)}.${Math.floor(rng.next() * 255)}`;
  const deviceId = `DEV-${Math.floor(rng.next() * 100000).toString(16)}`;
  const userEmail = `user.${userIdRandom.toLowerCase()}@example.com`;

  return {
    platform: SUPPORTED_PLATFORMS.find(p => p.id === platform)?.name || platform,
    orderId: orderId.toUpperCase(),
    productName: product.name,
    category: product.category,
    productImage: product.image,
    purchaseDate: purchaseDate,
    price: product.price,
    sku,
    serialNumber,
    fulfillmentStatus,
    userId,
    userEmail,
    userIp,
    deviceId
  };
};
