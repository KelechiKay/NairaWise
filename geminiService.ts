
import { GoogleGenAI, Type } from "@google/genai";
import { PlayerStats, Scenario, GameLog } from "./types";

export const getNextScenario = async (
  stats: PlayerStats,
  history: GameLog[]
): Promise<Scenario> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const historyContext = history.slice(-3).map(h => `Week ${h.week}: ${h.decision}`).join('\n');

  let phase = "SURVIVAL (Sapa Era)";
  if (stats.currentWeek > 50) phase = "GROWTH (Hustle Era)";
  if (stats.currentWeek > 150) phase = "EXPANSION (Oga Era)";
  if (stats.currentWeek > 300) phase = "LEGACY (Billionaire Era)";

  const prompt = `
    Create a financial scenario for a Nigerian citizen.
    
    PLAYER PERSONALIZATION:
    - NAME: ${stats.name}
    - JOB: ${stats.job}
    - MARITAL STATUS: ${stats.maritalStatus}
    - NUMBER OF KIDS: ${stats.numberOfKids}
    - MONTHLY INCOME: ₦${stats.salary.toLocaleString()}
    - CURRENT BALANCE: ₦${stats.balance.toLocaleString()}
    - SAVINGS/INVESTMENTS: ₦${stats.savings.toLocaleString()}
    - LOCATION: ${stats.city}
    - GAME PROGRESS: Week ${stats.currentWeek} (${phase})
    - CHALLENGE: ${stats.challenge}

    SCENARIO GUIDELINES:
    1. Financial Scaling: THE FINANCIAL IMPACTS MUST BE REALISTIC TO THE PLAYER'S INCOME.
    2. Investment Logic: Treat individual STOCKS and MUTUAL FUNDS as the primary wealth-building tools. 
    3. Family Dynamics: If married or has kids, incorporate scenarios about school fees, family events, or spouse's financial needs.
    4. Cultural Context: Use specific economic conditions of Nigeria.
    5. Slang: Use localized Nigerian Pidgin naturally.
    6. Choices: PROVIDE EXACTLY 4 DISTINCT CHOICES:
       - Prudent (Saving/Mutual Fund Investment)
       - Social/Family (Family/Black Tax/Status/School Fees)
       - Risky (Individual Stock Speculation/Betting)
       - Opportunistic (Quick flip/Side hustle)

    RECENT ACTIONS:
    ${historyContext}

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
            minItems: 4,
            maxItems: 4,
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
      systemInstruction: "You are NairaWise. Treat Equities and Mutual Funds as the core of your investment advice. The user sees them in a unified 'Invest' tab. Consider their family size and status."
    }
  });

  return JSON.parse(response.text || "{}");
};

export const getEndGameAnalysis = async (stats: PlayerStats, history: GameLog[]) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `
    The player has gone bankrupt (Sapa has won). 
    FINAL STATS:
    - Name: ${stats.name}
    - Family: ${stats.maritalStatus === 'married' ? `Married with ${stats.numberOfKids} kids` : 'Single'}
    - Job: ${stats.job}
    - Week reached: ${stats.currentWeek}
    - Total Wealth (Peak): ₦${(stats.balance + stats.savings).toLocaleString()}
    - Debt: ₦${stats.debt.toLocaleString()}
    
    Review their journey. Evaluate their use of Stocks vs Mutual Funds and how their family life impacted their finances. Be witty and wise. Use Nigerian slang.
  `;
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: { systemInstruction: "You are a wise Nigerian financial mentor." }
  });
  return response.text || "Oga, Sapa finally catch you! Your money don finish.";
};
