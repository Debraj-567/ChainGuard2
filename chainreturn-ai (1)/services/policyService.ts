
import { OrderDetails, AnalysisResult } from '../types';

export interface PolicyResult {
  status: 'APPROVED' | 'DECLINED' | 'MANUAL_REVIEW';
  reason: string;
}

const HIGH_RISK_CATEGORIES = ['Electronics', 'Jewelry', 'Beauty', 'Watches'];

export const evaluateReturnPolicy = (order: OrderDetails, analysis: AnalysisResult): PolicyResult => {
  
  // --- PRIORITY: FRAUD RISK ASSESSMENT ---
  // If fraud service detected critical issues, block immediately.
  if (analysis.fraudRisk) {
    const risk = analysis.fraudRisk;
    
    if (risk.riskLevel === 'CRITICAL') {
      return {
        status: 'DECLINED',
        reason: `Security Block: Critical Risk Detected (${risk.detectedPatterns.join(', ')})`
      };
    }

    if (risk.flags.isSyndicate) {
      return {
        status: 'DECLINED',
        reason: `Security Block: Network Anomaly Linked to Fraud Ring ${risk.networkGraphId}`
      };
    }

    if (risk.flags.isSerialReturner && analysis.estimatedRefund > 5000) {
        return {
            status: 'MANUAL_REVIEW',
            reason: 'Serial Returner Policy: High value return requires agent approval.'
        };
    }

    if (risk.flags.isWardrobing) {
        return {
            status: 'DECLINED',
            reason: 'Policy Violation: Item usage pattern indicates Wardrobing.'
        };
    }
  }


  // --- RULE 1: Inventory Signal (Anti-Fraud) ---
  if (order.fulfillmentStatus !== 'Delivered') {
    return {
      status: 'DECLINED',
      reason: `Inventory Signal Alert: Item status is '${order.fulfillmentStatus}'. Cannot return item that has not been marked Delivered.`
    };
  }

  // --- RULE 2: Serial Number Match (Electronics) ---
  if (order.category === 'Electronics' && order.serialNumber) {
    if (analysis.authenticityScore < 80) {
      return {
        status: 'DECLINED',
        reason: `Serial Number Mismatch: Device serial (${order.serialNumber}) could not be verified or matched.`
      };
    }
  }

  // --- RULE 3: SKU Match (Visual) ---
  if (analysis.condition === 'Product Mismatch') {
    return { 
      status: 'MANUAL_REVIEW', 
      reason: 'SKU Mismatch: Visual identification does not match sold SKU. Holding for manual inspection.' 
    };
  }

  // --- RULE 4: Refund Window Check (30 Days) ---
  const purchaseDate = new Date(order.purchaseDate);
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - purchaseDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays > 30) {
    return { 
      status: 'DECLINED', 
      reason: `Return Window Expired. Purchased ${diffDays} days ago (Max 30).` 
    };
  }

  // --- RULE 5: Condition Check ---
  if (analysis.condition === 'Damaged') {
    return { 
      status: 'DECLINED', 
      reason: 'Policy violation: Damaged items are not eligible for instant refund.' 
    };
  }

  // --- NEW RULE: Receipt Verification ---
  if (!order.receiptVerified) {
    // If it's a high risk category and no receipt -> Decline
    if (HIGH_RISK_CATEGORIES.includes(order.category)) {
        return {
            status: 'DECLINED',
            reason: 'Missing Receipt: High-risk items require valid proof of purchase.'
        };
    }
    // If it's normal category but no receipt -> Hold
    return {
        status: 'MANUAL_REVIEW',
        reason: 'Receipt missing or invalid. Proof of purchase check failed.'
    };
  }

  // --- RULE 6: Category Sensitivity & Risk Check ---
  const isHighRisk = HIGH_RISK_CATEGORIES.includes(order.category);
  
  if (isHighRisk && analysis.authenticityScore < 50) {
    return { 
      status: 'DECLINED', 
      reason: 'High Risk Alert: Security score too low for high-risk category.' 
    };
  }

  if (isHighRisk && analysis.condition !== 'New') {
    return { 
      status: 'MANUAL_REVIEW', 
      reason: `High Value ${order.category} item condition is "${analysis.condition}". Review required.` 
    };
  }

  // --- RULE 7: General Authenticity Threshold ---
  // If receipt is verified, we can lower the threshold slightly as we trust the user more
  const threshold = order.receiptVerified ? 60 : 80; 

  if (analysis.authenticityScore < threshold) {
    return { 
      status: 'MANUAL_REVIEW', 
      reason: 'AI Verification low confidence. Human inspection required.' 
    };
  }

  // If all pass
  return { 
    status: 'APPROVED', 
    reason: 'Instant Refund Approved: Receipt Valid & Condition Verified.' 
  };
};
