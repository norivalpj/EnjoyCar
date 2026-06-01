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
    try {
      const { file_url, json_schema } = req.body;
      if (!file_url || !json_schema) {
        return res.status(400).json({ error: "Missing file_url or json_schema" });
      }

      if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is not configured.");
      }

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      // Fetch the file as ArrayBuffer
      const fileRes = await fetch(file_url);
      if (!fileRes.ok) throw new Error("Failed to fetch the file from URL");
      
      const buffer = await fileRes.arrayBuffer();
      const mimeType = fileRes.headers.get("content-type") || "image/jpeg";
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  data: Buffer.from(buffer).toString("base64"),
                  mimeType
                }
              },
              { text: "Extract the data requested in the JSON schema from this file. If it's a receipt/invoice, look for vehicle information, store info, etc." }
            ]
          }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: json_schema
        }
      });
      
      let parsed = {};
      try {
        parsed = JSON.parse(response.text);
      } catch (e) {
        return res.status(500).json({ status: 'error', error: "Failed to parse JSON output" });
      }

      return res.json({ status: 'success', output: parsed });
    } catch (error) {
      console.error("/api/extract-data error:", error);
      res.status(500).json({ status: 'error', error: error.message });
    }
  });

  app.post("/api/invoke-llm", async (req, res) => {
    try {
      const { prompt, response_json_schema } = req.body;
      
      if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is not configured.");
      }
      
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const config = {
         responseMimeType: response_json_schema ? "application/json" : "text/plain",
      };
      if (response_json_schema) {
         config.responseSchema = response_json_schema;
      }
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config
      });
      
      if (response_json_schema) {
         let parsed = {};
         try {
           parsed = JSON.parse(response.text);
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
