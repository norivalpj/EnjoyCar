import { GoogleGenAI } from "@google/genai";

export async function handler(event, context) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { query } = JSON.parse(event.body || "{}");
    
    if (!process.env.GEMINI_API_KEY) {
      return { 
        statusCode: 400, 
        body: JSON.stringify({ error: "GEMINI_API_KEY is not configured." }) 
      };
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const prompt = `Busque oficinas mecânicas próximas a: ${query}. 
Para cada oficina que você encontrar na internet, retorne: nome, endereço completo, telefone (se disponível) e a nota/avaliação (rating de 0 a 5).
Retorne até 5 oficinas reais encontradas no Google.
Responda EXATAMENTE com este formato JSON:
{
  "results": [
    {
      "name": "Nome da Oficina",
      "address": "Endereço",
      "phone": "Telefone",
      "rating": 4.5
    }
  ]
}`;

    let response;
    let attempt = 0;
    while (attempt < 3) {
      try {
        response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            tools: [{ googleSearch: {} }],
            temperature: 0.1
          }
        });
        break;
      } catch (err) {
        attempt++;
        if (attempt >= 3) throw err;
        await new Promise(r => setTimeout(r, 2000 * attempt));
      }
    }

    let parsed = { results: [] };
    try {
      let text = response.text || "";
      text = text.replace(/^```(json)?\n?/, "").replace(/\n?```$/, "").trim();
      parsed = JSON.parse(text);
    } catch (e) {
      console.error("Failed to parse Gemini JSON output for places:", response.text);
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed)
    };
  } catch (error) {
    console.error("/api/search-places error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
}
