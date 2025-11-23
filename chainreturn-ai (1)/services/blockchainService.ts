import { AnalysisResult, Block } from "../types";

// Simple hash function simulation for demo purposes
const simpleHash = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).padStart(64, '0'); // Fake SHA-256 look
};

export const createReturnBlock = async (prevHash: string, data: AnalysisResult, index: number): Promise<Block> => {
  // Simulate network latency for "Mining"
  await new Promise(resolve => setTimeout(resolve, 1500));

  const timestamp = new Date().toISOString();
  const dataString = JSON.stringify(data);
  const rawString = `${index}${prevHash}${timestamp}${dataString}`;
  const hash = simpleHash(rawString);

  return {
    index,
    timestamp,
    data,
    previousHash: prevHash,
    hash
  };
};

export const GENESIS_BLOCK: Block = {
  index: 0,
  timestamp: new Date().toISOString(),
  data: {
    itemType: "GENESIS",
    condition: "New",
    defects: [],
    authenticityScore: 100,
    estimatedRefund: 0,
    reasoning: "System Initialization"
  },
  previousHash: "0000000000000000000000000000000000000000000000000000000000000000",
  hash: "000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f"
};