
import { AnalysisResult, OrderDetails, FraudRiskReport } from '../types';

/**
 * Simulates an advanced AI Fraud Detection Engine.
 * Checks for: Wardrobing, Serial Returns, Syndicates, Device Spoofing, etc.
 */
export const analyzeFraudPatterns = async (
  order: OrderDetails, 
  aiAnalysis: AnalysisResult
): Promise<FraudRiskReport> => {
  
  // Simulate network latency for "Graph Analysis" and "Database Lookups"
  await new Promise(resolve => setTimeout(resolve, 1200));

  let riskScore = 0;
  const detectedPatterns: string[] = [];
  const flags = {
    isWardrobing: false,
    isSerialReturner: false,
    isSyndicate: false,
    isDeviceSpoofing: false,
    isAccountHopping: false,
    isFakeReceipt: false
  };

  // 1. Wardrobing Check
  // Logic: Fashion/Electronics item + "Used" condition + High Price
  if (['Fashion', 'Electronics', 'Footwear'].includes(order.category)) {
    if (aiAnalysis.condition === 'Used' || aiAnalysis.condition === 'Like New') {
      riskScore += 25;
      flags.isWardrobing = true;
      detectedPatterns.push('Potential Wardrobing (Wear & Return)');
    }
  }

  // 2. Serial Returner Check (Simulated History)
  // Random chance or triggered by Order ID containing "SERIAL"
  const isSerialTrigger = order.orderId.includes('SERIAL') || Math.random() < 0.15;
  if (isSerialTrigger) {
    riskScore += 30;
    flags.isSerialReturner = true;
    detectedPatterns.push('Serial Returner Pattern (High Frequency)');
  }

  // 3. Syndicate / Organized Fraud Check (Network Graph)
  // Triggered by Order ID "SYNDICATE" or very low random chance
  const isSyndicateTrigger = order.orderId.includes('SYNDICATE') || Math.random() < 0.05;
  if (isSyndicateTrigger) {
    riskScore += 50;
    flags.isSyndicate = true;
    detectedPatterns.push('Syndicate Link Detected (Known Fraud Ring IP)');
  }

  // 4. Device / IP Spoofing
  // Triggered by Order ID "IP" or random chance
  const isDeviceTrigger = order.orderId.includes('IP') || Math.random() < 0.1;
  if (isDeviceTrigger) {
    riskScore += 20;
    flags.isDeviceSpoofing = true;
    detectedPatterns.push('Device Fingerprint Anomaly (VPN/Emulator)');
  }

  // 5. Account Hopping (Cross-Store Abuse)
  // Triggered if User ID looks like a temporary hash (simulated)
  const isHoppingTrigger = Math.random() < 0.08;
  if (isHoppingTrigger) {
    riskScore += 15;
    flags.isAccountHopping = true;
    detectedPatterns.push('Account Hopping (Linked to banned accounts)');
  }

  // 6. Fake Receipt (from Gemini Analysis)
  if (order.receiptVerified === false) {
    riskScore += 40;
    flags.isFakeReceipt = true;
    detectedPatterns.push('Invalid/Manipulated Receipt');
  }

  // 7. High Value Category Fraud
  if (['Jewelry', 'Electronics'].includes(order.category) && order.price > 50000) {
    if (aiAnalysis.authenticityScore < 85) {
        riskScore += 20;
        detectedPatterns.push('High-Value Asset Risk');
    }
  }

  // Determine Risk Level
  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
  if (riskScore >= 80) riskLevel = 'CRITICAL';
  else if (riskScore >= 50) riskLevel = 'HIGH';
  else if (riskScore >= 20) riskLevel = 'MEDIUM';

  return {
    riskScore: Math.min(riskScore, 100),
    riskLevel,
    detectedPatterns,
    flags,
    networkGraphId: flags.isSyndicate ? `RING-${Math.floor(Math.random() * 9000) + 1000}` : undefined
  };
};
