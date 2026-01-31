
import { GoogleGenAI } from "@google/genai";

export const getTaxAdvice = async (query: string) => {
  try {
    // Fix: Using process.env.API_KEY directly as required by guidelines
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a helpful Indian Tax Assistant. Explain simply for a layperson (or an aged person) the following tax query: ${query}. Focus on Indian Income Tax laws.`,
      config: {
        systemInstruction: "You are a professional yet empathetic Indian Chartered Accountant assistant. Use simple English, avoid jargon where possible, and explain like you are talking to a senior citizen.",
        temperature: 0.7,
      }
    });
    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I'm sorry, I'm having trouble connecting to my tax knowledge base. Please contact our office directly.";
  }
};
