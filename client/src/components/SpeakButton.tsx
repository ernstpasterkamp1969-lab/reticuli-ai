import { useEffect, useMemo, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function pickDeepVoice(voices: SpeechSynthesisVoice[]) {
  if (!voices.length) return null;

  const preferred = voices
    .filter((v) => !v.localService || v.localService) // keep all; some browsers set localService
    .sort((a, b) => {
      // try to bias toward "deep" hints
      const score = (v: SpeechSynthesisVoice) => {
        const name = `${v.name} ${v.lang}`.toLowerCase();
        let s = 0;
        if (name.includes("male")) s += 2;
        if (name.includes("deep")) s += 3;
        if (name.includes("bass")) s += 3;
        if (name.includes("david")) s += 1;
        if (name.includes("daniel")) s += 1;
        if (name.includes("english")) s += 0.5;
        return s;
      };
      return score(b) - score(a);
    });

  return preferred[0] ?? voices[0];
}

export default function SpeakButton({
  text,
  testId,
}: {
  text: string;
  testId: string;
}) {
  const [supported] = useState(() => typeof window !== "undefined" && "speechSynthesis" in window);
  const [speaking, setSpeaking] = useState(false);
  const [ready, setReady] = useState(false);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    if (!supported) return;

    const synth = window.speechSynthesis;

    const load = () => {
      const voices = synth.getVoices?.() ?? [];
      voiceRef.current = pickDeepVoice(voices);
      setReady(true);
    };

    load();
    synth.onvoiceschanged = () => load();

    return () => {
      synth.onvoiceschanged = null;
      synth.cancel();
    };
  }, [supported]);

  const canSpeak = useMemo(() => supported && ready && text.trim().length > 0, [supported, ready, text]);

  function onSpeak() {
    if (!supported) return;

    const synth = window.speechSynthesis;
    if (speaking) {
      synth.cancel();
      setSpeaking(false);
      return;
    }

    synth.cancel();
    const utter = new SpeechSynthesisUtterance(text);

    // "Optimus Prime style": deep & slow
    utter.pitch = 0; // lowest possible per requirement
    utter.rate = 0.8;
    utter.volume = 1;

    if (voiceRef.current) utter.voice = voiceRef.current;

    utter.onstart = () => setSpeaking(true);
    utter.onend = () => setSpeaking(false);
    utter.onerror = () => setSpeaking(false);

    synth.speak(utter);
  }

  return (
    <Button
      data-testid={testId}
      onClick={onSpeak}
      disabled={!canSpeak}
      variant="secondary"
      size="sm"
      className={cn(
        "h-9 rounded-xl border border-border/70 bg-card/35 px-3",
        "hover:bg-card/55 hover:border-border",
        "active:translate-y-0",
        "transition-all duration-200",
        speaking ? "glow-ring" : "",
      )}
      title={supported ? (speaking ? "Stop" : "Speak") : "Speech not supported"}
    >
      {speaking ? <VolumeX className="mr-2 h-4 w-4" /> : <Volume2 className="mr-2 h-4 w-4" />}
      <span className="mono text-xs">{speaking ? "Stop" : "Speak"}</span>
    </Button>
  );
}
