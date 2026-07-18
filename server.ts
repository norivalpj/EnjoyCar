import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // API endpoints
  app.post("/api/extract-data", async (req, res) => {
    console.log("-> /api/extract-data called with:", req.body ? Object.keys(req.body) : "nothing");
    try {
      let { file_url, file_base64, mime_type, json_schema, text_content } = req.body;
      if ((!file_url && !file_base64 && !text_content) || !json_schema) {
        console.log("Missing file_url / file_base64 / text_content or json_schema");
        return res.status(400).json({ error: "Missing file_url / file_base64 / text_content or json_schema" });
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
      fixSchemaTypes(json_schema);
      console.log("Fixed schema:", JSON.stringify(json_schema));

      if (!process.env.GEMINI_API_KEY) {
        console.error("GEMINI_API_KEY is not configured.");
        throw new Error("GEMINI_API_KEY is not configured.");
      }

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      let finalBase64 = file_base64;
      let targetMimeType = mime_type || "image/jpeg";

      if (!finalBase64 && file_url) {
        console.log("Fetching file from url:", file_url);
        const fileRes = await fetch(file_url, {
          signal: AbortSignal.timeout(15000) // 15 seconds max to download
        });
        if (!fileRes.ok) {
          console.error("Failed to fetch the file from URL", fileRes.status, fileRes.statusText);
          throw new Error("Failed to fetch the file from URL");
        }
        
        console.log("File fetched, reading buffer...");
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

      // If the file_base64 came with data URI prefix, remove it:
      if (finalBase64 && finalBase64.startsWith('data:')) {
        const commaIndex = finalBase64.indexOf(',');
        if (commaIndex !== -1) {
          const header = finalBase64.substring(0, commaIndex);
          const match = header.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64$/);
          if (match) {
            targetMimeType = match[1];
          }
          finalBase64 = finalBase64.substring(commaIndex + 1);
        }
      }

      console.log("Buffer read. MimeType:", targetMimeType, "Generating content with Gemini...");
      
      let parts = [];
      if (text_content) {
        parts.push({ text: `Extract the data requested in the JSON schema from the following document text:\n\n${text_content}` });
      } else {
        parts.push({
          inlineData: {
            data: finalBase64,
            mimeType: targetMimeType
          }
        });
        parts.push({ text: "Extract the data requested in the JSON schema from this file. If it's a receipt/invoice, look for vehicle information, store info, etc." });
      }
      
      let response;
      let attempt = 0;
      const maxRetries = 3;
      while (attempt < maxRetries) {
        try {
          response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
              {
                role: 'user',
                parts: parts
              }
            ],
            config: {
              responseMimeType: "application/json",
              responseSchema: json_schema
            }
          });
          break; // Success
        } catch (err) {
          attempt++;
          if (attempt >= maxRetries || (!err.message?.includes("503") && !err.message?.includes("429"))) {
            throw err;
          }
          console.log(`Gemini API error ${err.message}, retrying attempt ${attempt}...`);
          await new Promise(r => setTimeout(r, 10000 * attempt));
        }
      }
      console.log("Gemini response parsing...");
      
      let parsed = {};
      try {
        let text = response.text || "";
        // Remove markdown code blocks if present
        text = text.replace(/^```(json)?\n?/, "").replace(/\n?```$/, "").trim();
        parsed = JSON.parse(text);
      } catch (e) {
        console.error("Gemini output parsing failed:", response.text);
        return res.status(500).json({ status: 'error', error: "Failed to parse JSON output" });
      }
      
      console.log("Successfully extracted data. Returning to client.");
      return res.json({ status: 'success', output: parsed });
    } catch (error) {
      console.error("/api/extract-data error:", error);
      res.status(500).json({ status: 'error', error: error.message });
    }
  });

  app.post("/api/invoke-llm", async (req, res) => {
    try {
      let { prompt, response_json_schema } = req.body;
      
      if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is not configured.");
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
           return res.status(500).json({ error: "Failed to parse JSON" });
         }
         return res.json(parsed);
      }
      
      return res.json({ response: response.text });
    } catch (error) {
      console.error("/api/invoke-llm error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
