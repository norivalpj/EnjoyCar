import { GoogleGenAI } from "@google/genai";

export async function handler(event, context) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    let { prompt, response_json_schema } = JSON.parse(event.body || "{}");
    
    if (!process.env.GEMINI_API_KEY) {
      return { statusCode: 400, body: JSON.stringify({ error: "GEMINI_API_KEY is not configured." }) };
    }

    // Fix schema types to be uppercase as required by GenAI SDK
    const fixSchemaTypes = (schema) => {
      if (!schema || typeof schema !== 'object') return;
      if (schema.type && typeof schema.type === 'string') {
        schema.type = schema.type.toUpperCase();
      }
      if (schema.properties) {
        Object.values(schema.properties).forEach(fixSchemaTypes);
      }
      if (schema.items) {
        fixSchemaTypes(schema.items);
      }
    };
    if (response_json_schema) {
       fixSchemaTypes(response_json_schema);
    }
    
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const config = {
       responseMimeType: response_json_schema ? "application/json" : "text/plain",
    };
    if (response_json_schema) {
       config.responseSchema = response_json_schema;
    }
    
    let response;
    let attempt = 0;
    const maxRetries = 3;
    while (attempt < maxRetries) {
      try {
        response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config
        });
        break;
      } catch (err) {
        attempt++;
        if (attempt >= maxRetries || (!err.message?.includes("503") && !err.message?.includes("429"))) {
          throw err;
        }
        console.log(`Gemini API error ${err.message}, retrying attempt ${attempt}...`);
        await new Promise(r => setTimeout(r, 10000 * attempt));
      }
    }
    
    if (response_json_schema) {
       let parsed = {};
       try {
         let text = response.text || "";
         text = text.replace(/^```(json)?\n?/, "").replace(/\n?```$/, "").trim();
         parsed = JSON.parse(text);
       } catch (e) {
         console.warn("Failed to parse JSON cleanly, trying fallback", e);
       }
       return {
         statusCode: 200,
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify(parsed)
       };
    } else {
       return {
         statusCode: 200,
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ result: response.text })
       };
    }
  } catch (error) {
    console.error("/api/invoke-llm error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
}
