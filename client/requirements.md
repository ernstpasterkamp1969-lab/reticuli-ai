## Packages
(none needed)

## Notes
Uses existing shadcn/ui components in client/src/components/ui
Stores Groq + Hugging Face (+ optional Gemini) keys and LLM failover order in localStorage
Web Speech API is used for Speak button (pitch 0, rate 0.8)
Chat sendMessage endpoint is non-streaming and returns metadata: providerUsed, sourceDate, extractedDates, failoverTried
