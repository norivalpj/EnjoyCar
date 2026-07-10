import { GoogleGenAI } from "@google/genai";

export async function handler(event, context) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    let { file_url, file_base64, mime_type, json_schema } = body;
    
    if ((!file_url && !file_base64) || !json_schema) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing file_url / file_base64 or json_schema" }) };
    }

    // Fix schema types
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
    fixSchemaTypes(json_schema);

    if (!process.env.GEMINI_API_KEY) {
      return { statusCode: 500, body: JSON.stringify({ error: "GEMINI_API_KEY is not configured on Netlify." }) };
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    let finalBase64 = file_base64;
    let targetMimeType = mime_type || "image/jpeg";

    if (!finalBase64 && file_url) {
      const fileRes = await fetch(file_url, { signal: AbortSignal.timeout(15000) });
      if (!fileRes.ok) throw new Error("Failed to fetch the file from URL");
      
      const buffer = await fileRes.arrayBuffer();
      targetMimeType = (fileRes.headers.get("content-type") || "image/jpeg").split(';')[0].trim();
      if (targetMimeType === 'application/octet-stream' || targetMimeType === 'application/x-www-form-urlencoded') {
        const urlLower = file_url.toLowerCase();
        if (urlLower.includes('.pdf')) targetMimeType = 'application/pdf';
        else if (urlLower.includes('.png')) targetMimeType = 'image/png';
        else if (urlLower.includes('.jpg') || urlLower.includes('.jpeg')) targetMimeType = 'image/jpeg';
        else targetMimeType = 'image/jpeg';
      }
      finalBase64 = Buffer.from(buffer).toString("base64");
    }

    if (finalBase64 && finalBase64.startsWith('data:')) {
      const matches = finalBase64.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
      if (matches) {
         targetMimeType = matches[1];
         finalBase64 = matches[2];
      } else {
         finalBase64 = finalBase64.split(',')[1] || finalBase64;
      }
    }

    let response;
    let attempt = 0;
    const maxRetries = 3;
    while (attempt < maxRetries) {
      try {
        response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [{
            role: 'user',
            parts: [
              { inlineData: { data: finalBase64, mimeType: targetMimeType } },
              { text: "Extract the data requested in the JSON schema from this file. If it's a receipt/invoice, look for vehicle information, store info, etc." }
            ]
          }],
          config: {
            responseMimeType: "application/json",
            responseSchema: json_schema
          }
        });
        break;
      } catch (err) {
        attempt++;
        if (attempt >= maxRetries || (!err.message?.includes("503") && !err.message?.includes("429"))) {
          throw err;
        }
        await new Promise(r => setTimeout(r, 10000 * attempt));
      }
    }
    
    let parsed = {};
    try {
      let text = response.text || "";
      text = text.replace(/^```(json)?\n?/, "").replace(/\n?```$/, "").trim();
      parsed = JSON.parse(text);
    } catch (e) {
      return { statusCode: 500, body: JSON.stringify({ status: 'error', error: "Failed to parse JSON output" }) };
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify({ status: 'success', output: parsed }),
      headers: { "Content-Type": "application/json" }
    };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ status: 'error', error: error.message }) };
  }
}
