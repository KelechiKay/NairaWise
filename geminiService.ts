
import { GoogleGenAI, Type } from "@google/genai";
import { PlayerStats, Scenario, GameLog } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getNextScenario = async (
  stats: PlayerStats,
  history: GameLog[]
): Promise<Scenario> => {
  const historyContext = history.slice(-5).map(h => `Week ${h.week}: ${h.decision}`).join('\n');

  // Determine complexity phase
  let phase = "SURVIVAL (Sapa Era)";
  if (stats.currentWeek > 500) phase = "LEGACY (Billionaire Era)";
  else if (stats.currentWeek > 200) phase = "EXPANSION (Oga Era)";
  else if (stats.currentWeek > 50) phase = "GROWTH (Hustle Era)";

  const prompt = `
    Create a highly complex financial scenario for a Nigerian citizen.
    
    PLAYER PROFILE:
    - Name: ${stats.name}
    - Age: ${stats.age}
    - Job: ${stats.job}
    - Location: ${stats.city}
    - Challenge: ${stats.challenge}
    - Monthly Income: ₦${stats.salary.toLocaleString()}
    
    GAME PROGRESS:
    - Current Week: ${stats.currentWeek} / 1000
    - Phase: ${phase}
    - Balance: ₦${stats.balance}
    - Debt: ₦${stats.debt}
    - Happiness: ${stats.happiness}%

    GUIDELINES FOR COMPLEXITY:
    1. ${phase === "SURVIVAL (Sapa Era)" ? "Focus on micro-decisions: transportation, daily food, family requests, and small savings." : ""}
    2. ${phase === "GROWTH (Hustle Era)" ? "Focus on side-businesses, formal investments, tax management, and skill acquisition." : ""}
    3. ${phase === "EXPANSION (Oga Era)" ? "Focus on real estate, institutional debt, family legacies, and industry competition." : ""}
    4. ${phase === "LEGACY (Billionaire Era)" ? "Focus on macro-economic shifts, national politics, philanthropy, and wealth preservation." : ""}
    
    5. CITY IMPACT: Reflect ${stats.city}'s specific economy (e.g., Lagos traffic/tech vs Kano trade/agri).
    6. CHALLENGE: If they have "Black Tax", the relatives must be more persistent as they get richer.
    7. CHOICES: Provide 3 distinct strategies:
       A: Prudent & Long-term (low immediate gain, high future stability)
       B: Social & High-status (high happiness/network, high cost)
       C: Risky & Aggressive (chance of massive gain or total loss)

    RESPONSE FORMAT: JSON only.
    Recent History:
    ${historyContext}
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
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
            }
          }
        },
        required: ["title", "description", "choices", "imageTheme"]
      },
      systemInstruction: "You are the 'Supreme Financial Oracle' of Nigeria. Your goal is to simulate the complex reality of building wealth in Nigeria over 1000 weeks."
    }
  });

  return JSON.parse(response.text || "{}");
};
