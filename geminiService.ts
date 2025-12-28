
import { GoogleGenAI, Type } from "@google/genai";
import { PlayerStats, Scenario, GameLog } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getNextScenario = async (
  stats: PlayerStats,
  history: GameLog[]
): Promise<Scenario> => {
  const historyContext = history.slice(-3).map(h => `Week ${h.week}: ${h.decision}`).join('\n');

  const prompt = `
    Create a financial scenario for a Nigerian ${stats.job}.
    Current Stats: Balance ₦${stats.balance}, Savings ₦${stats.savings}, Debt ₦${stats.debt}, Happiness ${stats.happiness}%.
    Week: ${stats.currentWeek}.

    Themes to include:
    - Ajo, Stocks, Fixed Deposits, Side Hustles, Sapa management.

    Market Integration:
    - Occasionally include a "marketEvent" property that affects fictional Nigerian stocks: 
      'lagos-gas' (Energy), 'kano-textiles' (Manufacturing), 'nairatech' (Tech), 'obudu-agri' (Agriculture).

    Rules:
    - Use Nigerian slang (Japa, Sapa, Owanbe, Aso-ebi, Urgent 2k).
    - 3 Choices: 1. Prudent/Investing 2. Social/Expensive 3. Risky/Quick-gain.

    Context:
    ${historyContext}
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
          },
          marketEvent: {
            type: Type.OBJECT,
            properties: {
              headline: { type: Type.STRING },
              impact: { type: Type.STRING, description: 'positive, negative, or neutral' },
              stockId: { type: Type.STRING, description: 'lagos-gas, kano-textiles, nairatech, or obudu-agri' }
            },
            required: ["headline", "impact", "stockId"]
          }
        },
        required: ["title", "description", "choices", "imageTheme"]
      },
      systemInstruction: "You are a witty Nigerian financial expert. Generate immersive JSON scenarios for NairaWise. Focus on investing and wealth building."
    }
  });

  return JSON.parse(response.text);
};

export const getEndGameAnalysis = async (stats: PlayerStats, history: GameLog[]) => {
  const prompt = `
    Final Review for Week ${stats.currentWeek}.
    Stats: ₦${stats.balance} bal, ₦${stats.savings} save, ₦${stats.debt} debt, ${stats.happiness}% happy.
    Review their decisions. Be a 'Wise Oga'.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
        systemInstruction: "You are a wise Nigerian mentor giving a quick performance review."
    }
  });

  return response.text;
};
