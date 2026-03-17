import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const getGeminiResponse = async (
  message: string,
  context?: string
): Promise<string> => {
  try {
    const systemInstruction = `
      You are an expert AI Learning Assistant for BICMAS Academy.
      Your goal is to help trainees understand course material, clarify concepts, and answer questions related to their training.
      Keep answers concise, encouraging, and educational.
      
      Current Course Context: ${context || 'General Dashboard'}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: message,
      config: {
        systemInstruction: systemInstruction,
      },
    });

    return response.text || "I'm sorry, I couldn't generate a response at this time.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I am currently having trouble connecting to the learning database. Please try again later.";
  }
};
