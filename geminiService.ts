
import { GoogleGenAI, Type } from "@google/genai";
import { PlayerStats, Scenario, GameLog } from "./types";

export const getNextScenario = async (
  stats: PlayerStats,
  history: GameLog[]
): Promise<Scenario> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const historyContext = history.slice(-3).map(h => `Week ${h.week}: ${h.decision}`).join('\n');

  let phase = "SURVIVAL (Sapa Era)";
  if (stats.currentWeek > 500) phase = "LEGACY (Billionaire Era)";
  else if (stats.currentWeek > 200) phase = "EXPANSION (Oga Era)";
  else if (stats.currentWeek > 50) phase = "GROWTH (Hustle Era)";

  const prompt = `
    Create a financial scenario for a Nigerian citizen.
    PLAYER: ${stats.name}, ${stats.job} in ${stats.city}.
    WEEK: ${stats.currentWeek}/1000 (${phase}).
    STATS: Balance ₦${stats.balance}, Debt ₦${stats.debt}, Happiness ${stats.happiness}%.
    RECENT ACTIONS: ${historyContext}

    GUIDELINES:
    1. Local Flavor: Use specific economic conditions of ${stats.city}.
    2. Slang: Use localized Nigerian Pidgin naturally.
    3. Choices: Prudent, Social, Risky.
    RESPONSE FORMAT: JSON only.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          imageTheme: { type: Type.STRING },
          choices: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                text: { type: Type.STRING },
                consequence: { type: Type.STRING },
                impact: {
                  type: Type.OBJECT,
                  properties: {
                    balance: { type: Type.NUMBER },
                    savings: { type: Type.NUMBER },
                    debt: { type: Type.NUMBER },
                    happiness: { type: Type.NUMBER },
                  },
                  required: ["balance", "savings", "debt", "happiness"]
                }
              },
              required: ["text", "consequence", "impact"]
            }
          }
        },
        required: ["title", "description", "choices", "imageTheme"]
      },
      systemInstruction: "You are NairaWise, an immersive financial engine for Nigerians. Generate JSON only."
    }
  });

  return JSON.parse(response.text || "{}");
};

export const getEndGameAnalysis = async (stats: PlayerStats, history: GameLog[]) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Review this Nigerian's journey of ${stats.currentWeek} weeks. Net Assets: ₦${stats.balance + stats.savings - stats.debt}. Evaluate their performance with wit and wisdom.`;
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: { systemInstruction: "You are a wise Nigerian financial mentor." }
  });
  return response.text || "You fought well against Sapa!";
};
