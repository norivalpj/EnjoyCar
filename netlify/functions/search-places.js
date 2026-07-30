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
    const prompt = `Você é um assistente de busca de locais no Google.
O usuário buscou por: "${query}".

Sua tarefa:
1. Se a busca parecer o nome de uma oficina específica (ex: "Tecno Auto Campinas"), busque os dados EXATOS dessa oficina e garanta que ela seja o primeiro resultado da lista.
2. Se a busca for genérica (ex: "centro", "campinas"), busque as melhores oficinas mecânicas na região.
3. Retorne até 5 oficinas reais encontradas.

Para cada oficina, retorne: nome, endereço completo, telefone (se disponível) e a nota (rating de 0 a 5).
Responda EXATAMENTE com este formato JSON puro, sem marcações markdown extra:
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
