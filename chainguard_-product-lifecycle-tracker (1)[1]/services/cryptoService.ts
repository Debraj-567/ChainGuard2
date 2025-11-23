/**
 * Simple SHA-256 implementation using Web Crypto API
 */
export const sha256 = async (message: string): Promise<string> => {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
};

/**
 * Generates a random UID for products
 */
export const generateUID = (): string => {
  return 'PROD-' + Math.random().toString(36).substr(2, 9).toUpperCase() + '-' + Date.now().toString(36).toUpperCase();
};

/**
 * Hushes customer ID for privacy
 */
export const hashCustomerId = async (customerId: string): Promise<string> => {
  return await sha256(customerId + "SALT_SECRET_KEY");
};

/**
 * Simulates IPFS CID generation (Version 0 style Qm...)
 */
export const generateFakeIPFSCID = async (content: string): Promise<string> => {
    const hash = await sha256(content);
    // Simulate the multihash prefix for Qm... (not cryptographically accurate to IPFS algo, but sufficient for demo ID)
    return 'Qm' + hash.substring(0, 44); 
};