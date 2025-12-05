import { GoogleGenAI } from "@google/genai";

let client: GoogleGenAI | null = null;

const getClient = () => {
  if (!client && process.env.API_KEY) {
    client = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return client;
};

export const generateSaturnResponse = async (userPrompt: string): Promise<string> => {
  const ai = getClient();
  if (!ai) {
    return "Please configure your API Key to access the ship's AI database.";
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userPrompt,
      config: {
        systemInstruction: "You are the onboard AI for a futuristic spacecraft observing Saturn. Keep responses concise (under 50 words), scientific, yet awe-inspiring. Focus on the physics of the rings and the planet's composition.",
      }
    });
    return response.text || "Data stream interrupted.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Communication systems offline. Unable to retrieve data.";
  }
};
