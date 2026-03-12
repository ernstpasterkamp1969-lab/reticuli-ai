import type { Express } from "express";
import type { Server } from "http";
import { GoogleGenAI } from "@google/genai";
import * as fs from "fs";
import * as path from "path";

// ============================================================
// HISTORY OPSLAG
// ============================================================
const HISTORY_FILE = path.join(process.cwd(), "reti-history.json");
const MEMORY_FILE = path.join(process.cwd(), "reti-memory.json");

interface ConversationEntry {
  id: string;
  date: string;
  title: string;
  summary: string;
  messages: Array<{role: string, content: string}>;
  important: boolean;
  autoSaved: boolean;
  score: number;
}

interface RetiMemory {
  name: string | null;
  location: string | null;
  language: string | null;
  interests: string[];
  preferences: string[];
  facts: string[];
  lastUpdated: string;
}

function loadHistory(): ConversationEntry[] {
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      return JSON.parse(fs.readFileSync(HISTORY_FILE, "utf8"));
    }
  } catch {}
  return [];
}

function saveHistory(entries: ConversationEntry[]): void {
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(entries, null, 2));
}

function loadMemory(): RetiMemory {
  try {
    if (fs.existsSync(MEMORY_FILE)) {
      return JSON.parse(fs.readFileSync(MEMORY_FILE, "utf8"));
    }
  } catch {}
  return { name: null, location: null, language: null, interests: [], preferences: [], facts: [], lastUpdated: "" };
}

function saveMemory(memory: RetiMemory): void {
  fs.writeFileSync(MEMORY_FILE, JSON.stringify(memory, null, 2));
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// ============================================================
// HELPERS
// ============================================================
function nowIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function extractDates(text: string): string[] {
  const candidates = new Set<string>();
  const iso = text.match(/\b(19|20)\d{2}-\d{2}-\d{2}\b/g) ?? [];
  for (const d of iso) candidates.add(d);
  const monthName = text.match(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+(19|20)\d{2}\b/g) ?? [];
  for (const d of monthName) candidates.add(d);
  return Array.from(candidates.values());
}

function pickMostRecentDate(dates: string[]): string | null {
  if (dates.length === 0) return null;
  const isoLike = dates.filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d));
  if (isoLike.length > 0) { isoLike.sort(); return isoLike[isoLike.length - 1]; }
  return dates[dates.length - 1] ?? null;
}

// ============================================================
// RETRY HELPER — vangt fetch failed / ECONNREFUSED op bij koude start
// ============================================================
async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delayMs = 2000
): Promise<T> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      const isFetchError =
        err?.message?.includes("fetch failed") ||
        err?.cause?.code === "ECONNREFUSED" ||
        err?.cause?.code === "ETIMEDOUT";
      if (isFetchError && attempt < retries) {
        console.log(`Poging ${attempt}/${retries} mislukt (${err?.cause?.code ?? "fetch failed"}), wacht ${delayMs}ms...`);
        await new Promise((res) => setTimeout(res, delayMs));
      } else {
        throw err;
      }
    }
  }
  throw new Error("Alle pogingen mislukt");
}

// ============================================================
// GEHEUGEN: bouw context string voor systeem prompt
// ============================================================
function buildMemoryContext(memory: RetiMemory): string {
  const parts: string[] = [];
  if (memory.name) parts.push(`De gebruiker heet ${memory.name}.`);
  if (memory.location) parts.push(`De gebruiker woont/verblijft in ${memory.location}.`);
  if (memory.language) parts.push(`De voorkeurstaal is ${memory.language}.`);
  if (memory.interests.length > 0) parts.push(`Interesses: ${memory.interests.join(', ')}.`);
  if (memory.preferences.length > 0) parts.push(`Voorkeuren: ${memory.preferences.join(', ')}.`);
  if (memory.facts.length > 0) parts.push(`Andere feiten: ${memory.facts.join('. ')}.`);
  if (parts.length === 0) return "";
  return `\n\n[GEBRUIKERSGEHEUGEN — gebruik dit om persoonlijk te antwoorden]\n${parts.join('\n')}\n[EINDE GEHEUGEN]`;
}

// ============================================================
// GEHEUGEN: update na gesprek via Gemini
// ============================================================
async function updateMemoryFromConversation(
  messages: Array<{role: string, content: string}>,
  currentMemory: RetiMemory
): Promise<void> {
  try {
    const convo = messages.slice(-6).map(m =>
      `${m.role === 'user' ? 'Gebruiker' : 'Reti'}: ${m.content}`
    ).join('\n');

    const prompt = `
Analyseer dit gesprek en extraheer persoonlijke informatie over de gebruiker.
Huidig geheugen: ${JSON.stringify(currentMemory)}

Gesprek:
${convo}

Geef ALLEEN JSON terug, geen tekst eromheen:
{
  "name": "<naam van gebruiker of null als onbekend>",
  "location": "<woonplaats/locatie of null>",
  "language": "<voorkeurstaal of null>",
  "new_interests": ["<nieuw interesse>"],
  "new_preferences": ["<nieuwe voorkeur>"],
  "new_facts": ["<nieuw feit over gebruiker>"]
}

Extraheer ALLEEN wat duidelijk in het gesprek staat. Geen aannames.`;

    const result = await callGemini(prompt);
    const clean = result.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    if (parsed.name) currentMemory.name = parsed.name;
    if (parsed.location) currentMemory.location = parsed.location;
    if (parsed.language) currentMemory.language = parsed.language;

    if (parsed.new_interests?.length) {
      for (const i of parsed.new_interests) {
        if (!currentMemory.interests.includes(i)) currentMemory.interests.push(i);
      }
    }
    if (parsed.new_preferences?.length) {
      for (const p of parsed.new_preferences) {
        if (!currentMemory.preferences.includes(p)) currentMemory.preferences.push(p);
      }
    }
    if (parsed.new_facts?.length) {
      for (const f of parsed.new_facts) {
        if (!currentMemory.facts.includes(f)) currentMemory.facts.push(f);
      }
    }

    currentMemory.lastUpdated = new Date().toISOString();
    saveMemory(currentMemory);
    console.log("✅ Geheugen bijgewerkt:", currentMemory.name || "onbekend");
  } catch (e) {
    console.log("Geheugen update mislukt:", e);
  }
}

// ============================================================
// GEMINI
// ============================================================
const gemini = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
  },
});

async function callGemini(prompt: string): Promise<string> {
  const resp = await withRetry(() =>
    gemini.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    })
  );
  return resp.text || "";
}

async function callGeminiVision(prompt: string, base64Image: string, mimeType: string): Promise<string> {
  const resp = await withRetry(() =>
    gemini.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{
        role: "user",
        parts: [
          { inlineData: { mimeType, data: base64Image } },
          { text: prompt }
        ]
      }],
    })
  );
  return resp.text || "";
}

// ============================================================
// GROQ
// ============================================================
async function callGroq(messages: Array<{role: string, content: string}>): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY niet geconfigureerd in Secrets");

  const response = await withRetry(() =>
    fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages,
        max_tokens: 1024,
      }),
    })
  );

  const data = await response.json() as any;
  if (!response.ok) throw new Error(data.error?.message || "Groq API fout");
  return data.choices[0].message.content;
}

// ============================================================
// FAILOVER: probeer Groq eerst, dan Gemini
// ============================================================
async function answerWithFailover(
  messages: Array<{role: string, content: string}>,
  plainPrompt: string
): Promise<{ content: string; providerUsed: string; sourceDate: string | null }> {

  try {
    const text = await callGroq(messages);
    const dates = extractDates(text);
    const sourceDate = pickMostRecentDate(dates);
    return { content: text, providerUsed: "groq", sourceDate };
  } catch (e) {
    console.log("Groq mislukt, probeer Gemini:", e);
  }

  try {
    const text = await callGemini(plainPrompt);
    const dates = extractDates(text);
    const sourceDate = pickMostRecentDate(dates);
    return { content: text, providerUsed: "gemini", sourceDate };
  } catch (e) {
    throw new Error("Alle providers mislukt: " + (e instanceof Error ? e.message : String(e)));
  }
}

// ============================================================
// WEB SEARCH via DuckDuckGo
// ============================================================
async function webSearch(query: string): Promise<string> {
  try {
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
    const res = await fetch(url);
    const data = await res.json() as any;

    let results: string[] = [];
    if (data.Abstract) results.push(data.Abstract);
    if (data.RelatedTopics?.length) {
      for (const t of data.RelatedTopics.slice(0, 4)) {
        if (t.Text) results.push(t.Text);
      }
    }
    if (data.Answer) results.push(`Antwoord: ${data.Answer}`);
    if (results.length === 0) return "";
    return `[WEB ZOEKRESULTATEN voor "${query}"]\n${results.join('\n')}\n[EINDE ZOEKRESULTATEN]`;
  } catch (e) {
    console.log("Web search fout:", e);
    return "";
  }
}

function needsWebSearch(message: string): boolean {
  const searchTriggers = [
    /nieuws|news|vandaag|gisteren|deze week|dit jaar|2024|2025|2026/i,
    /wie is|wat is|wanneer is|hoe laat|president|premier|minister|ceo|directeur/i,
    /uitslag|score|gewonnen|verloren|kampioen|stand|competitie/i,
    /prijs|koers|waarde|euro|dollar|bitcoin|crypto|aandeel|beurs/i,
    /benzine|inflatie|rente|hypotheek/i,
    /film|serie|album|boek|nummer 1|hitlijst/i,
    /winkels open|openingstijden|vlucht|trein|vertraging/i,
  ];
  return searchTriggers.some(r => r.test(message));
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {

  // --- CHAT ---
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, history } = req.body as {
        message: string;
        history: Array<{role: string, content: string}>;
      };

      if (!message?.trim()) {
        return res.status(400).json({ message: "Bericht mag niet leeg zijn" });
      }

      const memory = loadMemory();
      const memoryContext = buildMemoryContext(memory);

      let searchContext = "";
      if (needsWebSearch(message)) {
        console.log("Web search voor:", message);
        searchContext = await webSearch(message);
        if (searchContext) console.log("Search resultaat gevonden");
      }

      const weatherKeywords = /weer|temperature|temperatuur|regen|zon|wind|bewolkt|graden|forecast|weersvoorspelling|morgen.*weer|weer.*morgen|hoe laat.*zon|zonsondergang|zonsopgang|urla|seferihisar|izmir|istanbul|ankara|buiten|paraplu|jas|warm|koud|hot|cold/i;
      let weatherContext = "";
      if (weatherKeywords.test(message)) {
        try {
          const weatherRes = await fetch(
            "https://api.open-meteo.com/v1/forecast?latitude=38.1953&longitude=26.8355&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode,windspeed_10m_max,sunrise,sunset&current_weather=true&timezone=Europe%2FIstanbul&forecast_days=4&language=nl"
          );
          const weatherData = await weatherRes.json() as any;
          const current = weatherData.current_weather;
          const daily = weatherData.daily;
          const days = [0,1,2,3].map(i => ({
            label: new Date(Date.now() + i * 86400000).toLocaleDateString('nl-NL', { weekday:'long', day:'numeric', month:'long' }),
            max: daily.temperature_2m_max[i],
            min: daily.temperature_2m_min[i],
            rain: daily.precipitation_sum[i],
            wind: daily.windspeed_10m_max[i],
            sunrise: daily.sunrise[i]?.slice(11),
            sunset: daily.sunset[i]?.slice(11),
          }));

          weatherContext = `\n\n[ACTUELE WEERDATA - Seferihisar/Urla regio, Izmir - ${nowIsoDate()}]
Huidig: ${current.temperature}°C, windsnelheid ${current.windspeed} km/u
${days.map((d,i) => `${i===0?'Vandaag':i===1?'Morgen':d.label}: max ${d.max}°C / min ${d.min}°C, neerslag ${d.rain}mm, wind ${d.wind} km/u${i===0?`, zonsopgang ${d.sunrise}, zonsondergang ${d.sunset}`:''}`).join('\n')}
BELANGRIJK: Gebruik ALLEEN deze actuele data voor weervragen. Negeer je trainingskennis over het weer.`;
        } catch (e) {
          console.log("Weer API fout:", e);
        }
      }

      const systemPrompt = {
        role: "system",
        content: `Je bent Reti (Reticuli), een geavanceerde AI-assistent met een sci-fi persoonlijkheid. 
Je antwoordt altijd in het Nederlands, tenzij de gebruiker een andere taal spreekt.
Je bent mysterieus, intelligent en behulpzaam. Vandaag is het ${nowIsoDate()}.
BELANGRIJK: Verontschuldig je NOOIT dat je geen actuele info hebt. Geef gewoon het beste antwoord dat je kunt.
Voeg NOOIT zinnen toe zoals "helaas kan ik geen actuele info geven" of "raadpleeg een weersite". Gewoon antwoorden.
Eindig NOOIT met [Recentheids-check] of andere technische labels.
Als je de naam van de gebruiker weet, gebruik die dan af en toe persoonlijk in je antwoord.
Als een vraag vaag of onduidelijk is, stel dan ÉÉN gerichte vervolgvraag om beter te kunnen helpen. Niet meerdere vragen tegelijk — slechts één, kort en direct.
${memoryContext}
${searchContext ? `Gebruik deze actuele zoekresultaten:\n${searchContext}` : ''}
${weatherContext}`
      };

      const messages = [systemPrompt, ...(history || []), { role: "user", content: message }];
      const plainPrompt = `Je bent Reti, een AI assistent. Antwoord in het Nederlands. Vandaag is het ${nowIsoDate()}.
${memoryContext}
${searchContext ? `Actuele info:\n${searchContext}` : ''}
${weatherContext}
Gebruiker: ${message}`;

      const result = await answerWithFailover(messages, plainPrompt);
      const cleanContent = result.content.replace(/\n*\[Recentheids-check\][^\n]*/g, '').trim();

      const fullHistory = [...(history || []), { role: "user", content: message }, { role: "assistant", content: cleanContent }];
      updateMemoryFromConversation(fullHistory, memory).catch(() => {});

      res.json({
        content: cleanContent,
        providerUsed: result.providerUsed,
        sourceDate: result.sourceDate,
      });
    } catch (err) {
      console.error("Chat error:", err);
      res.status(500).json({ message: err instanceof Error ? err.message : "Server fout" });
    }
  });

  // --- GEHEUGEN OPHALEN ---
  app.get("/api/memory", (_req, res) => {
    res.json(loadMemory());
  });

  // --- GEHEUGEN WISSEN ---
  app.delete("/api/memory", (_req, res) => {
    const empty: RetiMemory = { name: null, location: null, language: null, interests: [], preferences: [], facts: [], lastUpdated: "" };
    saveMemory(empty);
    res.json({ cleared: true });
  });

  // --- FOTO ANALYSE ---
  app.post("/api/analyze-image", async (req, res) => {
    try {
      const { base64Image, mimeType, question } = req.body as {
        base64Image: string;
        mimeType: string;
        question?: string;
      };

      if (!base64Image) {
        return res.status(400).json({ message: "Geen afbeelding ontvangen" });
      }

      const prompt = question?.trim()
        ? `Analyseer deze afbeelding en beantwoord de vraag in het Nederlands: ${question}`
        : `Analyseer deze afbeelding uitgebreid in het Nederlands. Beschrijf wat je ziet, identificeer objecten, tekst, personen of plaatsen, en geef relevante informatie zoals Google Lens zou doen.`;

      const text = await callGeminiVision(prompt, base64Image, mimeType || "image/jpeg");
      res.json({ content: text, providerUsed: "gemini-vision" });
    } catch (err) {
      console.error("Image analyze error:", err);
      res.status(500).json({ message: err instanceof Error ? err.message : "Analyse mislukt" });
    }
  });

  // --- AFBEELDING PROXY ---
  app.get("/api/image-proxy", async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url) return res.status(400).json({ message: "Geen URL" });
      const response = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
      if (!response.ok) throw new Error(`Fout: ${response.status}`);
      const buffer = await response.arrayBuffer();
      const contentType = response.headers.get("content-type") || "image/jpeg";
      res.setHeader("Content-Type", contentType);
      res.setHeader("Cache-Control", "public, max-age=3600");
      res.send(Buffer.from(buffer));
    } catch (err) {
      res.status(500).json({ message: err instanceof Error ? err.message : "Proxy fout" });
    }
  });

  // --- AFBEELDING GENEREREN ---
  app.post("/api/generate-image", async (req, res) => {
    try {
      const { prompt } = req.body as { prompt: string };
      if (!prompt?.trim()) {
        return res.status(400).json({ message: "Prompt mag niet leeg zijn" });
      }

      let englishPrompt = prompt;
      try {
        englishPrompt = await callGroq([
          { role: "system", content: "Translate the following to English for an AI image generator. Return only the translated prompt, nothing else." },
          { role: "user", content: prompt }
        ]);
      } catch { }

      res.json({
        englishPrompt: englishPrompt.trim(),
        providers: [
          { name: "Ideogram", url: `https://ideogram.ai/t/explore`, description: "Gratis, hoge kwaliteit" },
          { name: "Leonardo.ai", url: `https://app.leonardo.ai/`, description: "150 gratis credits/dag" },
          { name: "Adobe Firefly", url: `https://firefly.adobe.com/`, description: "Gratis tier" },
          { name: "Microsoft Designer", url: `https://designer.microsoft.com/image-creator`, description: "Gratis met Microsoft account" },
          { name: "Playground AI", url: `https://playground.com/`, description: "Volledig gratis" },
        ]
      });
    } catch (err) {
      console.error("Image generate error:", err);
      res.status(500).json({ message: err instanceof Error ? err.message : "Fout" });
    }
  });

  // --- VIDEO PROVIDERS ---
  app.get("/api/video-providers", (_req, res) => {
    res.json([
      { id: "vidu", name: "Vidu", url: "https://www.vidu.com", badge: "Geen account nodig", free: true },
      { id: "vivago", name: "Vivago", url: "https://vivago.ai", badge: "Volledig gratis", free: true },
      { id: "pollo", name: "Pollo AI", url: "https://pollo.ai", badge: "50+ modellen gratis", free: true },
      { id: "kling", name: "Kling AI", url: "https://klingai.com", badge: "Dagelijkse gratis credits", free: true },
      { id: "pika", name: "Pika Labs", url: "https://pika.art", badge: "Gratis tier", free: true },
    ]);
  });

  // --- HISTORY: LIJST ---
  app.get("/api/history", (_req, res) => {
    const entries = loadHistory();
    res.json(entries.sort((a, b) => b.date.localeCompare(a.date)));
  });

  // --- HISTORY: OPSLAAN (auto) ---
  app.post("/api/history/save", async (req, res) => {
    try {
      const { messages } = req.body as { messages: Array<{role: string, content: string}> };
      if (!messages || messages.length < 2) return res.json({ saved: false });

      const convo = messages.map(m => `${m.role === 'user' ? 'Gebruiker' : 'Reti'}: ${m.content}`).join('\n');

      const assessment = await callGemini(`
Beoordeel dit gesprek. Geef een JSON antwoord (ALLEEN JSON, geen tekst eromheen):
{
  "score": <getal 1-10 hoe waardevol dit is om te onthouden>,
  "title": "<korte Nederlandse titel max 6 woorden>",
  "summary": "<Nederlandse samenvatting in 1-2 zinnen>"
}

Gesprek:
${convo.slice(0, 2000)}
      `);

      let score = 5, title = "Gesprek", summary = "";
      try {
        const clean = assessment.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(clean);
        score = parsed.score || 5;
        title = parsed.title || "Gesprek";
        summary = parsed.summary || "";
      } catch {}

      if (score < 6) return res.json({ saved: false, score });

      const entries = loadHistory();
      const entry: ConversationEntry = {
        id: generateId(),
        date: new Date().toISOString(),
        title,
        summary,
        messages,
        important: false,
        autoSaved: true,
        score,
      };
      entries.push(entry);
      saveHistory(entries);
      res.json({ saved: true, entry });
    } catch (err) {
      res.status(500).json({ message: err instanceof Error ? err.message : "Fout" });
    }
  });

  // --- HISTORY: STER TOGGLE ---
  app.post("/api/history/star/:id", (req, res) => {
    const entries = loadHistory();
    const entry = entries.find(e => e.id === req.params.id);
    if (!entry) return res.status(404).json({ message: "Niet gevonden" });
    entry.important = !entry.important;
    saveHistory(entries);
    res.json({ important: entry.important });
  });

  // --- HISTORY: HANDMATIG OPSLAAN ---
  app.post("/api/history/manual-save", async (req, res) => {
    try {
      const { messages } = req.body as { messages: Array<{role: string, content: string}> };
      if (!messages || messages.length < 2) return res.json({ saved: false });

      const convo = messages.map(m => `${m.role === 'user' ? 'Gebruiker' : 'Reti'}: ${m.content}`).join('\n');
      const assessment = await callGemini(`
Maak een titel en samenvatting voor dit gesprek. ALLEEN JSON:
{"title": "<max 6 woorden>", "summary": "<1-2 zinnen>"}
${convo.slice(0, 2000)}
      `);

      let title = "Opgeslagen gesprek", summary = "";
      try {
        const clean = assessment.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(clean);
        title = parsed.title || title;
        summary = parsed.summary || "";
      } catch {}

      const entries = loadHistory();
      const existing = entries.find(e =>
        e.messages.length === messages.length &&
        e.messages[0]?.content === messages[0]?.content
      );
      if (existing) {
        existing.important = true;
        saveHistory(entries);
        return res.json({ saved: true, entry: existing });
      }

      const entry: ConversationEntry = {
        id: generateId(),
        date: new Date().toISOString(),
        title,
        summary,
        messages,
        important: true,
        autoSaved: false,
        score: 10,
      };
      entries.push(entry);
      saveHistory(entries);
      res.json({ saved: true, entry });
    } catch (err) {
      res.status(500).json({ message: err instanceof Error ? err.message : "Fout" });
    }
  });

  // --- HISTORY: VERWIJDEREN ---
  app.delete("/api/history/:id", (req, res) => {
    const entries = loadHistory();
    const filtered = entries.filter(e => e.id !== req.params.id);
    saveHistory(filtered);
    res.json({ deleted: true });
  });

  // --- TTS PROXY ---
  app.get("/api/tts", async (req, res) => {
    try {
      const text = (req.query.text as string || '').slice(0, 200);
      const lang = (req.query.lang as string || 'nl').slice(0, 5);
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${lang.slice(0,2)}&client=tw-ob`;
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; Trident/5.0)' }
      });
      if (!response.ok) throw new Error('TTS fetch mislukt');
      const buffer = await response.arrayBuffer();
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.send(Buffer.from(buffer));
    } catch (err) {
      res.status(500).json({ message: 'TTS fout' });
    }
  });

  return httpServer;
}