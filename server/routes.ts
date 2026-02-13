import type { Express } from "express";
import type { Server } from "http";
import { z } from "zod";
import { api } from "@shared/routes";
import { storage } from "./storage";
import { GoogleGenAI } from "@google/genai";

function nowIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function extractDates(text: string): string[] {
  const candidates = new Set<string>();

  // YYYY-MM-DD
  const iso = text.match(/\b(19|20)\d{2}-\d{2}-\d{2}\b/g) ?? [];
  for (const d of iso) candidates.add(d);

  // YYYY/MM/DD
  const slash = text.match(/\b(19|20)\d{2}\/\d{2}\/\d{2}\b/g) ?? [];
  for (const d of slash) candidates.add(d.replaceAll("/", "-"));

  // Month name formats like "February 13, 2026" (English)
  const monthName =
    text.match(
      /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+(19|20)\d{2}\b/g,
    ) ?? [];
  for (const d of monthName) candidates.add(d);

  // Dutch-ish numeric: DD-MM-YYYY or DD/MM/YYYY
  const dmy = text.match(/\b\d{1,2}[-\/]\d{1,2}[-\/](19|20)\d{2}\b/g) ?? [];
  for (const d of dmy) candidates.add(d.replaceAll("/", "-"));

  return Array.from(candidates.values());
}

function pickMostRecentDate(dates: string[]): string | null {
  if (dates.length === 0) return null;
  // Prefer ISO dates for ordering if present
  const isoLike = dates
    .map((d) => d.trim())
    .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d));
  if (isoLike.length > 0) {
    isoLike.sort();
    return isoLike[isoLike.length - 1];
  }
  // Fallback: unknown formats, just return last mentioned
  return dates[dates.length - 1] ?? null;
}

// Gemini via AI Integrations (already configured by environment)
const gemini = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
  },
});

async function callGemini(prompt: string): Promise<string> {
  const resp = await gemini.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ],
  });
  return resp.text || "";
}

async function callGroq(_prompt: string, _apiKey: string): Promise<string> {
  // Placeholder: implemented as external call in a minimal way.
  // We keep it server-side to avoid exposing keys in logs.
  // Groq OpenAI-compatible endpoint:
  // https://api.groq.com/openai/v1/chat/completions
  throw new Error("GROQ_NOT_CONFIGURED");
}

async function callHuggingFace(_prompt: string, _apiKey: string): Promise<string> {
  // Placeholder: HF Inference API can vary by model.
  // For MVP, keep as failover stub until configured.
  throw new Error("HUGGINGFACE_NOT_CONFIGURED");
}

async function answerWithFailover(input: {
  prompt: string;
  providerOrder: ("gemini" | "groq" | "huggingface")[];
  groqKey?: string;
  hfKey?: string;
}): Promise<{
  content: string;
  providerUsed: "gemini" | "groq" | "huggingface";
  failoverTried: ("gemini" | "groq" | "huggingface")[];
  extractedDates: string[];
  sourceDate: string | null;
}> {
  const tried: ("gemini" | "groq" | "huggingface")[] = [];
  let lastErr: unknown = null;

  for (const provider of input.providerOrder) {
    tried.push(provider);
    const start = Date.now();
    try {
      let text = "";
      if (provider === "gemini") {
        text = await callGemini(input.prompt);
      } else if (provider === "groq") {
        text = await callGroq(input.prompt, input.groqKey || "");
      } else {
        text = await callHuggingFace(input.prompt, input.hfKey || "");
      }

      // Recentness check: ensure we mention source date priority explicitly.
      const extractedDates = extractDates(text);
      const sourceDate = pickMostRecentDate(extractedDates) ?? null;
      const dateBanner = sourceDate
        ? `\n\n[Recentheids-check] Meest recente datum in antwoord: ${sourceDate}.`
        : `\n\n[Recentheids-check] Geen datum gevonden; ik baseer me op algemene kennis tot en met ${nowIsoDate()}.`;

      return {
        content: `${text}${dateBanner}`,
        providerUsed: provider,
        failoverTried: tried,
        extractedDates,
        sourceDate,
      };
    } catch (err) {
      lastErr = err;
      const latencyMs = Date.now() - start;
      await storage.recordLlmRun({
        conversationId: 0,
        messageId: null,
        provider,
        ok: false,
        latencyMs,
        sourceDate: null,
        extractedDates: [],
        failureReason: err instanceof Error ? err.message : String(err),
      });
      continue;
    }
  }

  throw new Error(
    lastErr instanceof Error ? lastErr.message : "All providers failed",
  );
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.get(api.conversations.list.path, async (_req, res) => {
    const items = await storage.listConversations();
    res.json(items);
  });

  app.post(api.conversations.create.path, async (req, res) => {
    try {
      const input = api.conversations.create.input.parse(req.body);
      const created = await storage.createConversation(input);
      res.status(201).json(created);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0]?.message ?? "Invalid input",
          field: err.errors[0]?.path?.join("."),
        });
      }
      throw err;
    }
  });

  app.get(api.conversations.get.path, async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(404).json({ message: "Conversation not found" });
    }
    const conv = await storage.getConversation(id);
    if (!conv) {
      return res.status(404).json({ message: "Conversation not found" });
    }
    res.json(conv);
  });

  app.delete(api.conversations.delete.path, async (req, res) => {
    const id = Number(req.params.id);
    const existing = await storage.getConversation(id);
    if (!existing) {
      return res.status(404).json({ message: "Conversation not found" });
    }
    await storage.deleteConversation(id);
    res.status(204).send();
  });

  app.post(api.conversations.sendMessage.path, async (req, res) => {
    try {
      const conversationId = Number(req.params.id);
      const conv = await storage.getConversation(conversationId);
      if (!conv) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      const input = api.conversations.sendMessage.input.parse(req.body);

      // API keys are expected from client; do not persist them server-side.
      const groqKey =
        typeof req.headers["x-groq-key"] === "string"
          ? req.headers["x-groq-key"]
          : undefined;
      const hfKey =
        typeof req.headers["x-hf-key"] === "string"
          ? req.headers["x-hf-key"]
          : undefined;

      const providerOrder =
        input.providers && input.providers.length > 0
          ? input.providers
          : (["gemini", "groq", "huggingface"] as const);

      const prompt = `Je bent Reti (Reticuli), een persoonlijke AI-assistent. Antwoord in het Nederlands. Als je een datum noemt, wees precies.\n\nUser: ${input.content}`;

      const answered = await answerWithFailover({
        prompt,
        providerOrder: providerOrder as ("gemini" | "groq" | "huggingface")[],
        groqKey,
        hfKey,
      });

      const out = await storage.createMessageAndAnswer(
        conversationId,
        { content: input.content, providers: providerOrder as any },
        async () => ({
          assistantMessageId: null,
          content: answered.content,
          providerUsed: answered.providerUsed,
          sourceDate: answered.sourceDate,
          extractedDates: answered.extractedDates,
          failoverTried: answered.failoverTried,
        }),
      );

      res.json(out);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0]?.message ?? "Invalid input",
          field: err.errors[0]?.path?.join("."),
        });
      }
      throw err;
    }
  });

  app.post(api.imageLab.generate.path, async (req, res) => {
    try {
      const input = api.imageLab.generate.input.parse(req.body);
      let imageUrl = "";

      if (input.provider === "pollinations") {
        imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
          input.prompt,
        )}`;
      } else if (input.provider === "craiyon") {
        // Craiyon doesn't have a stable public unauthenticated API; keep as placeholder url
        // so UI can still show provider labeling. Backend returns 400 until implemented.
        return res.status(400).json({
          message: "Craiyon is momenteel niet beschikbaar via API in deze build.",
          field: "provider",
        });
      } else {
        // HuggingFace Diffusers (public Inference endpoints usually require token)
        return res.status(400).json({
          message:
            "Hugging Face Diffusers vereist doorgaans een token/model endpoint. Voeg dit later toe in instellingen.",
          field: "provider",
        });
      }

      const saved = await storage.createImageGeneration(
        { prompt: input.prompt, provider: input.provider },
        imageUrl,
      );

      res.json(saved);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0]?.message ?? "Invalid input",
          field: err.errors[0]?.path?.join("."),
        });
      }
      throw err;
    }
  });

  return httpServer;
}
