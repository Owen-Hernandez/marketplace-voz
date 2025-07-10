import { GoogleGenerativeAI } from "@google/generative-ai";

// Configuración segura (usa tu API KEY en .env.local)
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Modelo rápido

export async function simpleGeminiCall(prompt) {
  try {
    const result = await model.generateContent(
      `Como asistente de Amazon, resume en MENOS de 15 palabras la búsqueda: "${prompt}"`
    );
    return result.response.text();
  } catch (error) {
    console.error("Error en Gemini:", error);
    return prompt; //devuelve el texto original si falla
  }
}