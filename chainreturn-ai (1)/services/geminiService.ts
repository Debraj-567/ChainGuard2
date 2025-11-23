
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, ReceiptAnalysis, BotOpinion, OrderDetails } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeReceipt = async (
  base64Data: string,
  mimeType: string,
  expectedPlatform: string
): Promise<ReceiptAnalysis> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data
            }
          },
          {
            text: `Analyze this image. Is it a valid purchase receipt or invoice? 
            
            Check for:
            1. Merchant Name (Look for "${expectedPlatform}" or similar).
            2. A visible Date.
            3. List of items.

            Return JSON.`
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isValid: { type: Type.BOOLEAN, description: "True if it looks like a genuine receipt." },
            merchantName: { type: Type.STRING },
            date: { type: Type.STRING },
            confidenceScore: { type: Type.NUMBER, description: "0-100 score of document clarity" },
            itemsFound: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ['isValid', 'merchantName', 'date', 'confidenceScore', 'itemsFound']
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as ReceiptAnalysis;
    }
    throw new Error("No receipt analysis returned");
  } catch (error) {
    console.error("Receipt analysis failed:", error);
    // Default fallback to allow flow to continue but flagged as invalid
    return {
      isValid: false,
      merchantName: "Unknown",
      date: "Unknown",
      confidenceScore: 0,
      itemsFound: []
    };
  }
};

export const consultExternalBot = async (
  botName: string,
  botRole: string,
  systemInstruction: string,
  orderDetails: OrderDetails,
  analysisResult: AnalysisResult
): Promise<BotOpinion> => {
  try {
    const prompt = `
      CASE DETAILS:
      Product: ${orderDetails.productName} (${orderDetails.category})
      Price: ₹${orderDetails.price}
      Condition Detected: ${analysisResult.condition}
      Receipt Verified: ${orderDetails.receiptVerified}
      Fraud Risk Level: ${analysisResult.fraudRisk?.riskLevel}
      Estimated Refund: ₹${analysisResult.estimatedRefund}

      YOUR TASK:
      Based on your System Instructions (Role: ${botRole}), do you APPROVE, DECLINE, or WARNING this return?
      Provide a short comment explaining why.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { text: prompt },
      config: {
        systemInstruction: systemInstruction, // Inject the external bot's personality
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            status: { type: Type.STRING, enum: ['APPROVED', 'DECLINED', 'WARNING'] },
            comment: { type: Type.STRING }
          },
          required: ['status', 'comment']
        }
      }
    });

    if (response.text) {
      const result = JSON.parse(response.text);
      return {
        botName,
        role: botRole,
        status: result.status,
        comment: result.comment
      };
    }
    throw new Error("Bot refused to answer");
  } catch (error) {
    return {
      botName,
      role: botRole,
      status: 'WARNING',
      comment: "Connection unstable. Bot could not be reached."
    };
  }
};

export const analyzeReturnVideo = async (
  base64Data: string, 
  mimeType: string, 
  expectedProductName?: string,
  expectedPrice?: number,
  receiptVerified: boolean = false
): Promise<AnalysisResult> => {
  
  // Enhanced prompt to fix "Product Mismatch" errors
  const contextPrompt = expectedProductName 
    ? `CONTEXT: The user is returning a "${expectedProductName}" (₹${expectedPrice}).
       RECEIPT STATUS: ${receiptVerified ? "VALID RECEIPT PROVIDED (High Trust)" : "NO VALID RECEIPT (Low Trust)"}.
       
       VERIFICATION TASK: 
       1. Identify the item.
       2. COMPARE strictly against "${expectedProductName}".
       3. **IMPORTANT**: Be generous with visual matching. If the item is the correct category and looks reasonably similar (e.g. correct brand, correct type of object), mark it as a match. 
       4. ONLY set 'Product Mismatch' if it is undeniable (e.g., a brick instead of a phone, or a banana instead of a shoe).
       5. If receipt is valid, lean towards trusting the user unless damage is obvious.`
    : `Identify the item in the image.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data
            }
          },
          {
            text: `You are an expert product quality assurance AI. 
            ${contextPrompt}
            
            Analyze the image/video.
            
            Outputs:
            - itemType: What you see.
            - condition: 'New', 'Like New', 'Used', 'Damaged', or 'Product Mismatch'.
            - estimatedRefund: In INR. 
              ${expectedPrice ? `Original Price: ₹${expectedPrice}.` : ''}
              Rules:
              - Mismatch/Damaged = 0.
              - New = 100% of original.
              - Like New = 90%.
              - Used = 60%.
              - If 'Product Mismatch', set refund to 0.
            
            Provide reasoning.`
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            itemType: { type: Type.STRING },
            condition: { type: Type.STRING, enum: ['New', 'Like New', 'Used', 'Damaged', 'Product Mismatch'] },
            defects: { type: Type.ARRAY, items: { type: Type.STRING } },
            authenticityScore: { type: Type.NUMBER },
            estimatedRefund: { type: Type.NUMBER },
            reasoning: { type: Type.STRING }
          },
          required: ['itemType', 'condition', 'defects', 'authenticityScore', 'estimatedRefund', 'reasoning']
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as AnalysisResult;
    }
    throw new Error("No analysis result returned");
  } catch (error) {
    console.error("Gemini analysis failed:", error);
    return {
      itemType: "Analysis Failed",
      condition: "Used",
      defects: ["Unable to verify due to API error"],
      authenticityScore: 0,
      estimatedRefund: 0,
      reasoning: "Analysis failed due to network or API configuration."
    };
  }
};
