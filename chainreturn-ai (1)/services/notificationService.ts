
import { Block } from '../types';

export interface EmailContent {
  to: string;
  subject: string;
  body: string;
}

export const sendEmailNotification = async (to: string, subject: string, body: string): Promise<boolean> => {
  console.log(`[EMAIL SERVICE] ----------------------------------------------------`);
  console.log(`[EMAIL SERVICE] Sending email to: ${to}`);
  console.log(`[EMAIL SERVICE] Subject: ${subject}`);
  console.log(`[EMAIL SERVICE] Body:\n${body}`);
  console.log(`[EMAIL SERVICE] ----------------------------------------------------`);
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));
  return true;
};

export const generateReturnEmail = (block: Block): EmailContent | null => {
  const { orderDetails, data, hash, previousHash, timestamp, index } = block;
  if (!orderDetails) return null;

  const status = data.policyStatus;
  const refundAmount = data.estimatedRefund;
  const reason = data.policyReason;

  let subject = '';
  let message = '';

  switch (status) {
    case 'APPROVED':
      subject = `✅ Smart Contract Executed: Refund Approved for Order #${orderDetails.orderId}`;
      message = `Great news! Your return for order #${orderDetails.orderId} has been verified by the blockchain. A refund of ₹${refundAmount.toLocaleString()} has been released via smart contract.`;
      break;
    case 'DECLINED':
      subject = `⛔ Smart Contract Result: Return Declined for Order #${orderDetails.orderId}`;
      message = `We processed your return request for order #${orderDetails.orderId}. The consensus mechanism has declined the request. Reason: ${reason || 'Policy Violation'}.`;
      break;
    case 'MANUAL_REVIEW':
      subject = `⚠ Smart Contract Alert: Manual Review Required for Order #${orderDetails.orderId}`;
      message = `Your return request for order #${orderDetails.orderId} has been flagged for human verification. The smart contract could not automatically execute. Reason: ${reason}`;
      break;
    default:
      subject = `Return Update: Order #${orderDetails.orderId}`;
      message = `Update regarding your return.`;
  }

  const contractBody = `
Dear ${orderDetails.userId},

${message}

=============================================
      BLOCKCHAIN CONTRACT RECEIPT
=============================================

Transaction Details:
--------------------
Block Index:      ${index}
Timestamp:        ${timestamp}
Product SKU:      ${orderDetails.sku}
Condition:        ${data.condition}
Risk Score:       ${data.fraudRisk?.riskScore || 0}/100

Smart Contract Output:
----------------------
Status:           ${status}
Auth Score:       ${data.authenticityScore}
Refund Value:     ₹${refundAmount}

Cryptographic Proof:
--------------------
Block Hash: 
${hash}

Previous Block Hash:
${previousHash}

This email serves as your immutable proof of transaction. 
You can verify this block on the ChainReturn Explorer using your Hash ID.

Regards,
ChainReturn Decentralized System
`;

  return {
    to: orderDetails.userEmail,
    subject,
    body: contractBody
  };
};

export const sendReturnStatusEmail = async (userEmail: string, block: Block) => {
  const content = generateReturnEmail(block);
  if (content) {
    return sendEmailNotification(content.to, content.subject, content.body);
  }
  return false;
};
