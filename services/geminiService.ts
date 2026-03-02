import { GoogleGenAI } from "@google/genai";
import { Stats, PastRace, CompetitionTier, Stroke } from '../types';

const getAiClient = () => {
    // Ideally this comes from environment, but per instructions we use process.env.API_KEY directly in components or here.
    // However, the instructions say: "The API key must be obtained exclusively from the environment variable process.env.API_KEY"
    // and "Assume this variable is pre-configured".
    // We will initialize it when needed to ensure we pick up the key if it changes (though usually env vars are static).
    try {
        if (!process.env.API_KEY) {
            console.warn("API Key is missing for Gemini.");
            return null;
        }
        return new GoogleGenAI({ apiKey: process.env.API_KEY });
    } catch (e) {
        console.error("Failed to init Gemini", e);
        return null;
    }
};

export const generateCoachAdvice = async (stats: Stats, lastRace?: PastRace): Promise<string> => {
    const ai = getAiClient();
    if (!ai) return "El entrenador está en silencio (Configura tu API Key).";

    const prompt = `
        Actúa como un entrenador de natación de élite sarcástico pero motivador.
        Mis estadísticas actuales son:
        ${JSON.stringify(stats)}
        
        ${lastRace ? `Acabo de nadar un ${lastRace.distance}m ${lastRace.stroke} en ${lastRace.time.toFixed(2)}s quedando el número ${lastRace.rank} en un torneo ${lastRace.tier}.` : 'Aún no he competido.'}
        
        Dame un consejo breve (máximo 2 frases) sobre qué entrenar hoy.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
        });
        return response.text || "Sigue nadando, lo harás mejor.";
    } catch (error) {
        console.error("Error generating advice:", error);
        return "Concéntrate en tu respiración.";
    }
};

export const generateRaceCommentary = async (
    tier: CompetitionTier, 
    stroke: Stroke, 
    distance: number, 
    time: number, 
    rank: number
): Promise<string> => {
    const ai = getAiClient();
    if (!ai) return "Una carrera intensa.";

    const prompt = `
        Escribe un comentario estilo narrador de TV deportivo (muy breve, 1 párrafo) sobre mi última carrera.
        Competición: ${tier}
        Prueba: ${distance}m ${stroke}
        Mi Tiempo: ${time.toFixed(2)}s
        Posición: ${rank}º
        
        Hazlo emocionante.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
        });
        return response.text || "La grada ruge con el resultado.";
    } catch (error) {
        return "Final de la carrera.";
    }
};

export const generateRivalNames = async (tier: CompetitionTier, count: number): Promise<string[]> => {
    // Optional: Use AI to generate realistic names based on tier (National = Spanish names, World = International)
    // For performance, we might fallback to local if this fails or is slow, but let's try.
    const ai = getAiClient();
    if (!ai) return Array(count).fill("Nadador Desconocido");

    const prompt = `
        Genera una lista JSON de ${count} nombres de nadadores ficticios para una competición de nivel ${tier}.
        Solo devuelve el array de strings JSON. Ejemplo: ["Nombre 1", "Nombre 2"].
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });
        const json = JSON.parse(response.text || "[]");
        if (Array.isArray(json)) return json;
        return Array(count).fill("Rival Genérico");
    } catch (error) {
        return Array(count).fill("Rival Fuerte");
    }
};
