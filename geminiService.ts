
import { GoogleGenAI, Type } from "@google/genai";
import { PlayerStats, Scenario, GameLog } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getNextScenario = async (
  stats: PlayerStats,
  history: GameLog[]
): Promise<Scenario> => {
  const historyContext = history.slice(-3).map(h => `Week ${h.week}: ${h.decision}`).join('\n');

  const prompt = `
    Create a highly localized financial scenario for a Nigerian citizen.
    
    PLAYER PROFILE:
    - Name: ${stats.name}
    - Age: ${stats.age}
    - Job: ${stats.job}
    - Location: ${stats.city}
    - Starting Challenge: ${stats.challenge}
    - Monthly Income: ₦${stats.salary.toLocaleString()}
    
    CURRENT GAME STATE:
    - Balance: ₦${stats.balance}
    - Debt: ₦${stats.debt}
    - Happiness: ${stats.happiness}%
    - Game Week: ${stats.currentWeek}

    GUIDELINES:
    1. City Matters: If they are in Lagos, talk about Danfo traffic, Third Mainland bridge, or high rent. If in Kano, talk about market trading and lower costs.
    2. Challenge Matters: If they have "Family Black Tax", include scenarios where relatives ask for money. If "Student Debt", include repayment pressures.
    3. Slang: Use localized Nigerian slang (e.g., 'Eko for Show' for Lagos, 'Oya' for general action).
    4. Difficulty: Scenarios should be harder if the salary is low relative to the city cost of living.
    5. Stocks: Occasionally trigger marketEvents for: 'lagos-gas', 'kano-textiles', 'nairatech', 'obudu-agri'.

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
          },
          marketEvent: {
            type: Type.OBJECT,
            properties: {
              headline: { type: Type.STRING },
              impact: { type: Type.STRING },
              stockId: { type: Type.STRING }
            },
            required: ["headline", "impact", "stockId"]
          }
        },
        required: ["title", "description", "choices", "imageTheme"]
      },
      systemInstruction: "You are the 'Wise Oga' financial engine. Your goal is to teach financial literacy via immersive roleplay."
    }
  });

  return JSON.parse(response.text || "{}");
};
