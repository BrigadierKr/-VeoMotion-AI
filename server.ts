import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, GenerateVideosOperation } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // API Routes
  
  // 1. Start video generation
  app.post("/api/generate-video", async (req, res) => {
    try {
      const { prompt, image, lastFrame, referenceImages, resolution, aspectRatio, modelType } = req.body;
      
      const model = modelType === 'fast' ? 'veo-3.1-lite-generate-preview' : 'veo-3.1-generate-preview';
      
      const config: any = {
        numberOfVideos: 1,
        resolution: resolution || '720p',
        aspectRatio: aspectRatio || '16:9'
      };

      if (lastFrame) {
        config.lastFrame = {
          imageBytes: lastFrame.data,
          mimeType: lastFrame.mimeType
        };
      }

      if (referenceImages && referenceImages.length > 0) {
        config.referenceImages = referenceImages.map((img: any) => ({
          image: {
            imageBytes: img.data,
            mimeType: img.mimeType
          },
          referenceType: "ASSET"
        }));
      }

      const operation = await ai.models.generateVideos({
        model,
        prompt,
        image: image ? {
          imageBytes: image.data,
          mimeType: image.mimeType
        } : undefined,
        config
      });

      res.json({ operationName: operation.name });
    } catch (error: any) {
      console.error("Video generation start error:", error);
      
      // Check for credit exhaustion (billing issue)
      if (error.message?.includes("credits are depleted") || error.code === 429 || error.status === "RESOURCE_EXHAUSTED") {
        return res.status(429).json({ 
          error: "billing_exhausted",
          message: "Your AI Studio credits are depleted. Please check your project billing.",
          link: "https://ai.studio/projects"
        });
      }
      
      res.status(500).json({ error: error.message });
    }
  });

  // 2. Poll video status
  app.post("/api/video-status", async (req, res) => {
    try {
      const { operationName } = req.body;
      const op = new GenerateVideosOperation();
      op.name = operationName;
      const updated = await ai.operations.getVideosOperation({ operation: op });
      res.json({ done: updated.done, response: updated.response });
    } catch (error: any) {
      console.error("Video status poll error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // 3. Download/Stream video
  app.get("/api/video-download/:operationName(*)", async (req, res) => {
    try {
      const { operationName } = req.params;
      const op = new GenerateVideosOperation();
      op.name = operationName;
      const updated = await ai.operations.getVideosOperation({ operation: op });
      
      const uri = updated.response?.generatedVideos?.[0]?.video?.uri;
      if (!uri) {
        return res.status(404).json({ error: "Video URI not found or generation not finished" });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      const videoRes = await fetch(uri, {
        headers: { 'x-goog-api-key': apiKey as string },
      });

      if (!videoRes.ok) {
        throw new Error(`Failed to fetch video from Gemini: ${videoRes.statusText}`);
      }

      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Content-Disposition', `attachment; filename="generated-video.mp4"`);

      if (videoRes.body) {
        const reader = videoRes.body.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(value);
        }
        res.end();
      } else {
        res.status(500).json({ error: "Video source body is empty" });
      }
    } catch (error: any) {
      console.error("Video download error:", error);
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
