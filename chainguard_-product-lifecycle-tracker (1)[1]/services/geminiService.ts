import { GoogleGenAI } from "@google/genai";
import { ProductState } from '../types';

const getAiClient = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) return null;
    return new GoogleGenAI({ apiKey });
};

export const generateProductDescription = async (name: string, category: string): Promise<string> => {
    const ai = getAiClient();
    if (!ai) return "AI Description unavailable (Missing API Key).";

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Write a short, premium marketing description (max 2 sentences) for a product named "${name}" in the category "${category}".`,
        });
        return response.text || "No description generated.";
    } catch (error) {
        console.error("Gemini Error:", error);
        return "Failed to generate description.";
    }
};

export const auditProductHistory = async (product: ProductState): Promise<string> => {
    const ai = getAiClient();
    if (!ai) return "AI Audit unavailable.";

    try {
        const prompt = `
            Analyze the following supply chain history for a product. 
            Check for logical inconsistencies in timing or sequence. 
            The sequence should normally be: CREATED -> IN_TRANSIT_TO_WAREHOUSE -> RECEIVED_WAREHOUSE -> IN_TRANSIT_TO_RETAILER -> RECEIVED_RETAILER -> SOLD.
            
            Product Data: ${JSON.stringify(product, null, 2)}
            
            Return a short paragraph summarizing the journey and if it looks authentic.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text || "Audit complete.";
    } catch (error) {
        return "Audit failed due to API error.";
    }
};