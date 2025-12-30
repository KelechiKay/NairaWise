
import { GoogleGenAI, Type } from "@google/genai";
import { PlayerStats, Scenario, GameLog } from "./types";

const apiKey = (process.env as any).API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const getNextScenario = async (
  stats: PlayerStats,
  history: GameLog[]
): Promise<Scenario> => {
  const historyContext = history.slice(-3).map(h => `Week ${h.week}: ${h.decision}`).join('\n');

  const prompt = `
    Create a financial scenario for a Nigerian ${stats.job}.
    Current Stats: Balance ₦${stats.balance}, Savings ₦${stats.savings}, Debt ₦${stats.debt}, Happiness ${stats.happiness}%.
    Week: ${stats.currentWeek}.
    Nigerian Context: Focus on Ajo, Sapa, investment opportunities, and family pressures.
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
      systemInstruction: "You are a witty Nigerian financial expert. Focus on immersive scenarios and realistic slang."
    }
  });

  return JSON.parse(response.text || "{}");
};

export const getEndGameAnalysis = async (stats: PlayerStats, history: GameLog[]) => {
  const prompt = `Review performance: ₦${stats.balance} balance at Week ${stats.currentWeek}. Give a brief 'Wise Oga' review.`;
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt
  });
  return response.text || "Market is tough, keep pushing!";
};
