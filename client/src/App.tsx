import React, { useState, useEffect, useRef } from 'react';

// Laad ResponsiveVoice voor talen zonder systeemstem
if (typeof window !== 'undefined' && !(window as any).responsiveVoice) {
  const script = document.createElement('script');
  script.src = 'https://code.responsivevoice.org/responsivevoice.js?key=FREE';
  script.onload = () => console.log('✅ ResponsiveVoice geladen:', !!(window as any).responsiveVoice);
  script.onerror = () => console.log('❌ ResponsiveVoice NIET geladen - geblokkeerd door netwerk');
  document.head.appendChild(script);
}

// ============================================================
// MARKDOWN RENDERER
// ============================================================
const MarkdownText: React.FC<{ text: string; color: string }> = ({ text, color }) => {
  const renderLine = (line: string, key: number) => {
    if (!line.trim()) return <div key={key} style={{ height: '8px' }} />;
    const h2 = line.match(/^##\s+(.+)/);
    const h3 = line.match(/^###\s+(.+)/);
    if (h2) return <div key={key} style={{ fontWeight: 'bold', fontSize: '15px', color, marginTop: '10px', marginBottom: '4px' }}>{renderInline(h2[1])}</div>;
    if (h3) return <div key={key} style={{ fontWeight: 'bold', fontSize: '13px', color, marginTop: '8px', marginBottom: '2px' }}>{renderInline(h3[1])}</div>;
    const li = line.match(/^[\-\*]\s+(.+)/);
    const oli = line.match(/^\d+\.\s+(.+)/);
    if (li) return <div key={key} style={{ display: 'flex', gap: '8px', marginBottom: '2px' }}><span style={{ color, opacity: 0.6, flexShrink: 0 }}>▸</span><span>{renderInline(li[1])}</span></div>;
    if (oli) return <div key={key} style={{ display: 'flex', gap: '8px', marginBottom: '2px' }}><span style={{ color, opacity: 0.6, flexShrink: 0 }}>{oli[0].split('.')[0]}.</span><span>{renderInline(oli[1])}</span></div>;
    if (line.startsWith('```') || line.startsWith('    ')) {
      return <div key={key} style={{ fontFamily: 'monospace', fontSize: '12px', background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.2)', borderRadius: '6px', padding: '4px 8px', margin: '4px 0', color: '#22d3ee' }}>{line.replace(/^```\w*|```$/g, '').replace(/^    /, '')}</div>;
    }
    return <div key={key} style={{ marginBottom: '2px' }}>{renderInline(line)}</div>;
  };

  const renderInline = (text: string): React.ReactNode => {
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let i = 0;
    while (remaining.length > 0) {
      const bold = remaining.match(/^([\s\S]*?)\*\*(.+?)\*\*([\s\S]*)/);
      const italic = remaining.match(/^([\s\S]*?)\*(.+?)\*([\s\S]*)/);
      const code = remaining.match(/^([\s\S]*?)`(.+?)`([\s\S]*)/);
      const firstBold = bold ? (bold[1]?.length ?? 0) : Infinity;
      const firstItalic = italic ? (italic[1]?.length ?? 0) : Infinity;
      const firstCode = code ? (code[1]?.length ?? 0) : Infinity;
      const first = Math.min(firstBold, firstItalic, firstCode);
      if (first === Infinity) { parts.push(<span key={i++}>{remaining}</span>); break; }
      if (first === firstBold && bold) {
        if (bold[1]) parts.push(<span key={i++}>{bold[1]}</span>);
        parts.push(<strong key={i++} style={{ color, fontWeight: 'bold' }}>{bold[2]}</strong>);
        remaining = bold[3] || '';
      } else if (first === firstCode && code) {
        if (code[1]) parts.push(<span key={i++}>{code[1]}</span>);
        parts.push(<code key={i++} style={{ fontFamily: 'monospace', background: 'rgba(34,211,238,0.1)', padding: '1px 5px', borderRadius: '4px', fontSize: '12px', color: '#22d3ee' }}>{code[2]}</code>);
        remaining = code[3] || '';
      } else if (italic) {
        if (italic[1]) parts.push(<span key={i++}>{italic[1]}</span>);
        parts.push(<em key={i++} style={{ fontStyle: 'italic', opacity: 0.85 }}>{italic[2]}</em>);
        remaining = italic[3] || '';
      } else { parts.push(<span key={i++}>{remaining}</span>); break; }
    }
    return parts;
  };

  const lines = text.split('\n');
  return <div style={{ color }}>{lines.map((line, i) => renderLine(line, i))}</div>;
};


const BootAnimation: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [phase, setPhase] = useState<'logo' | 'boot' | 'fadeout'>('logo');
  const [shownLines, setShownLines] = useState<string[]>([]);
  const [logoOpacity, setLogoOpacity] = useState(0);

  const BOOT_LINES = [
    'INITIALIZING NEURAL NETWORK...',
    'LOADING LANGUAGE MODULES... OK',
    'CONNECTING TO QUANTUM CORE... OK',
    'CALIBRATING HOLOGRAPHIC INTERFACE... OK',
    'SCANNING ENVIRONMENT... OK',
    'RETICULI AI v2.4.1 — ONLINE',
    '> NEURAL LINK ESTABLISHED',
  ];

  useEffect(() => {
    const t1 = setTimeout(() => setLogoOpacity(1), 200);
    const t2 = setTimeout(() => setPhase('boot'), 1400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  useEffect(() => {
    if (phase !== 'boot') return;
    let i = 0;
    const interval = setInterval(() => {
      if (i < BOOT_LINES.length) {
        setShownLines(prev => [...prev, BOOT_LINES[i]]);
        i++;
      } else {
        clearInterval(interval);
        setTimeout(() => setPhase('fadeout'), 600);
        setTimeout(() => onComplete(), 1200);
      }
    }, 220);
    return () => clearInterval(interval);
  }, [phase]);

  return (
    <div style={{
      position:'fixed', inset:0, zIndex:9999, background:'#000',
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
      opacity: phase === 'fadeout' ? 0 : 1, transition:'opacity 0.6s ease',
    }}>
      <div style={{ opacity:logoOpacity, transition:'opacity 1s ease', textAlign:'center', marginBottom:'40px' }}>
        <div className="space-age" style={{ fontSize:'32px', letterSpacing:'12px', color:'#22d3ee', textShadow:'0 0 30px rgba(34,211,238,0.8), 0 0 60px rgba(34,211,238,0.4)' }}>RETICULI</div>
        <div className="orb" style={{ fontSize:'10px', letterSpacing:'6px', color:'rgba(34,211,238,0.5)', marginTop:'8px' }}>NEURAL AI SYSTEM</div>
      </div>
      {phase === 'boot' && (
        <div style={{ fontFamily:'monospace', fontSize:'11px', lineHeight:'2', width:'320px', textAlign:'left' }}>
          {shownLines.map((line, i) => (
            <div key={i} style={{ opacity:0, animation:'bootFadeIn 0.3s forwards', color:(line||'').startsWith('>')?'#22d3ee':'rgba(34,211,238,0.6)', fontWeight:(line||'').startsWith('>')?'bold':'normal' }}>{line}</div>
          ))}
        </div>
      )}
      <style>{`@keyframes bootFadeIn{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:translateX(0)}}`}</style>
    </div>
  );
};

// ============================================================
// HOLOGRAM RETI COMPONENT
// ============================================================
const HologramReti: React.FC<{ isSpeaking: boolean; visible: boolean; menuOpen: boolean }> = ({ isSpeaking: _isSpeaking, visible, menuOpen }) => {
  const [glitch, setGlitch] = useState(false);

  useEffect(() => {
    const glitchInterval = setInterval(() => {
      if (Math.random() > 0.85) {
        setGlitch(true);
        setTimeout(() => setGlitch(false), 150 + Math.random() * 200);
      }
    }, 2000);
    return () => clearInterval(glitchInterval);
  }, []);

  const shouldShow = visible && !menuOpen;

  return (
    <div style={{
      position: 'fixed', bottom: '80px', left: '10px', width: '120px', height: '153px',
      zIndex: 50, pointerEvents: 'none',
      filter: glitch ? 'hue-rotate(90deg) brightness(1.4)' : 'none',
      transform: glitch ? `translateX(${(Math.random()-0.5)*8}px)` : 'none',
      transition: glitch ? 'none' : 'filter 0.3s, opacity 0.8s ease',
      opacity: shouldShow ? 1 : 0,
    }}>
      <img
        src="/grey-reti .png"
        onLoad={() => console.log('✅ grey-reti .png geladen!')}
        onError={() => console.log('❌ grey-reti .png fout')}
        style={{
          width: '100%', height: '100%', objectFit: 'contain',
          opacity: 0.85,
          filter: 'brightness(1.1) saturate(0.2) hue-rotate(160deg)',
        }}
      />
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.18) 2px, rgba(0,0,0,0.18) 4px)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        boxShadow: 'inset 0 0 20px rgba(34,211,238,0.15)',
        pointerEvents: 'none',
      }} />
    </div>
  );
};

const NeuralNetwork: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let animId: number;
    const particles: Array<{x:number,y:number,vx:number,vy:number,size:number}> = [];
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);
    for (let i = 0; i < 45; i++) {
      particles.push({ x: Math.random()*canvas.width, y: Math.random()*canvas.height, vx: (Math.random()-0.5)*0.4, vy: (Math.random()-0.5)*0.4, size: Math.random()*1.5+1 });
    }
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p, i) => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
        ctx.fillStyle = 'rgba(34,211,238,0.4)'; ctx.fill();
        for (let j = i+1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist = Math.sqrt((p.x-p2.x)**2 + (p.y-p2.y)**2);
          if (dist < 140) {
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(34,211,238,${0.2*(1-dist/140)})`; ctx.lineWidth = 0.9; ctx.stroke();
          }
        }
      });
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(animId); };
  }, []);
  return <canvas ref={canvasRef} style={{ position:'fixed', inset:0, width:'100%', height:'100%', zIndex:1, pointerEvents:'none' }} />;
};

// ============================================================
// SYSTEEM MELDING COMPONENT
// ============================================================
const SYSTEM_MESSAGES = [
  'ANOMALIE GEDETECTEERD IN SECTOR 7...',
  'NEURAL SYNC: 94.7% — KALIBRATIE VOLTOOID',
  'WAARSCHUWING: ONBEKEND SIGNAAL OP FREQUENTIE 432Hz',
  'QUANTUM VERBINDING ONSTABIEL — HERSTEL BEZIG...',
  'RETICULI KERN TEMPERATUUR: 4200K — NORMAAL',
  'TRANSMISSIE ONTVANGEN UIT ONBEKENDE BRON...',
  'GEHEUGEN DEFRAGMENTATIE: 99.1% COMPLEET',
  'DETECTIE: NEURALE PATROONHERKENNING ACTIEF',
  'SYSTEEM MELDING: TIJDLIJN AFWIJKING 0.003%',
  'INTER-DIMENSIONALE POORT: GESLOTEN — STATUS OK',
];

const SystemMessage: React.FC<{ onDone: () => void }> = ({ onDone }) => {
  const [visible, setVisible] = useState(false);
  const msg = SYSTEM_MESSAGES[Math.floor(Math.random() * SYSTEM_MESSAGES.length)];

  useEffect(() => {
    setTimeout(() => setVisible(true), 100);
    setTimeout(() => setVisible(false), 4500);
    setTimeout(() => onDone(), 5200);
  }, []);

  return (
    <div style={{
      position: 'fixed', bottom: '90px', left: '50%', transform: 'translateX(-50%)',
      zIndex: 999, pointerEvents: 'none',
      opacity: visible ? 1 : 0,
      transition: 'opacity 0.6s ease',
      background: 'rgba(0,0,0,0.85)',
      border: '1px solid rgba(34,211,238,0.4)',
      borderRadius: '20px',
      padding: '8px 20px',
      whiteSpace: 'nowrap',
    }}>
      <span className="orb" style={{ fontSize: '10px', color: 'rgba(34,211,238,0.8)', letterSpacing: '1.5px' }}>
        ⚡ {msg}
      </span>
    </div>
  );
};

// ============================================================
// ICONEN
// ============================================================
const SendIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"></line>
    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
  </svg>
);

// ============================================================
// TABS
// ============================================================
type Tab = 'chat' | 'image' | 'video' | 'translator' | 'history';

// ============================================================
// HOOFD APP
// ============================================================
const App: React.FC = () => {
  const [tab, setTab] = useState<Tab>('chat');
  const [messages, setMessages] = useState<Array<{role:string, content:string, img?:string}>>([]);
  const [input, setInput] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<{base64:string, mimeType:string, preview:string} | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [imagePrompt, setImagePrompt] = useState('');
  const [imageProviders, setImageProviders] = useState<any[]>([]);
  const [videoProviders, setVideoProviders] = useState<any[]>([]);
  const [videoPrompt, setVideoPrompt] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [historyEntries, setHistoryEntries] = useState<any[]>([]);
  const [historyFilter, setHistoryFilter] = useState<'all' | 'important'>('all');
  const [selectedEntry, setSelectedEntry] = useState<any | null>(null);
  const [savedEntryId, setSavedEntryId] = useState<string | null>(null);
  const [retiVisible, setRetiVisible] = useState(false);
  const [bootDone, setBootDone] = useState(false);
  const [isChatListening, setIsChatListening] = useState(false);
  const chatRecogRef = useRef<any>(null);
  const [retiMemory, setRetiMemory] = useState<any>(null);
  const [expandedMessages, setExpandedMessages] = useState<Set<number>>(new Set());
  const [showSystemMsg, setShowSystemMsg] = useState(false);
  const systemMsgShownRef = useRef(false);
  const inactivityTimerRef = useRef<any>(null);
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const reset = () => {
      clearTimeout(inactivityTimerRef.current);
      if (systemMsgShownRef.current) return;
      inactivityTimerRef.current = setTimeout(() => {
        if (!systemMsgShownRef.current) {
          systemMsgShownRef.current = true;
          setShowSystemMsg(true);
        }
      }, 45000);
    };
    window.addEventListener('mousemove', reset);
    window.addEventListener('keydown', reset);
    window.addEventListener('touchstart', reset);
    reset();
    return () => {
      clearTimeout(inactivityTimerRef.current);
      window.removeEventListener('mousemove', reset);
      window.removeEventListener('keydown', reset);
      window.removeEventListener('touchstart', reset);
    };
  }, []);

  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isPending]);

  useEffect(() => {
    fetch('/api/video-providers').then(r => r.json()).then(setVideoProviders).catch(() => {});
  }, []);

  // ---- CAMERA ----
  const [showCamera, setShowCamera] = useState(false);
  const [showPhotoMenu, setShowPhotoMenu] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const openCamera = async () => {
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch {
        alert('Camera niet beschikbaar. Controleer de toestemming in je browser.');
        setShowCamera(false);
      }
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d')!.drawImage(videoRef.current, 0, 0);
    const compressed = canvas.toDataURL('image/jpeg', 0.8);
    const base64 = compressed.split(',')[1];
    closeCamera();
    setUploadedImage({ base64, mimeType: 'image/jpeg', preview: compressed });
  };

  const closeCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setShowCamera(false);
  };

  // ---- SPRAAK ----
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);

  const detectLang = (text: string): string => {
    const words = text.toLowerCase();
    const nl = /\b(de|het|een|van|is|dat|dit|niet|ook|maar|wel|dan|nog|als|bij|uit|over|door|naar|voor|met|zijn|heeft|worden|kunnen|hebben|worden|wordt|was|waren|had|heel|veel|meer|mijn|jouw|onze|jullie|zij|wij|hoe|wat|wie|waar|waarom|wanneer|al|al|toch|gewoon|eigenlijk|misschien|natuurlijk|altijd|nooit|soms|vaak|graag|zeker|prima|goed|mooi|leuk|lekker|nou|ja|nee|hallo|dag)\b/.test(words);
    const tr = /[çğışöüÇĞİŞÖÜ]/.test(text) || /\b(bir|bu|ve|ile|için|ama|ben|sen|biz|ne|nasıl|merhaba|teşekkür|evet|hayır)\b/i.test(words);
    const de = /\b(ich|du|ist|das|die|der|und|nicht|mit|auch|sie|wir|ein|eine|nein|ja|danke|bitte|hallo)\b/i.test(words);
    const fr = /\b(je|tu|il|nous|vous|ils|est|les|des|une|pour|avec|dans|bonjour|merci|oui|non|très|aussi)\b/i.test(words);
    const es = /\b(yo|tu|el|es|los|las|una|para|con|pero|como|más|hola|gracias|sí|no)\b/i.test(words);
    const en = /\b(the|is|are|was|were|have|has|this|that|with|from|they|what|your|hello|yes|no|thank|please)\b/i.test(words);
    if (nl) return 'nl-NL';
    if (tr) return 'tr-TR';
    if (de) return 'de-DE';
    if (en) return 'en-US';
    if (fr) return 'fr-FR';
    if (es) return 'es-ES';
    return 'nl-NL';
  };

  const speak = (text: string, index: number) => {
    window.speechSynthesis.cancel();
    if (speakingIndex === index) { setSpeakingIndex(null); return; }
    const lang = detectLang(text);
    setSpeakingIndex(index);
    const clean = text.replace(/\*\*/g, '').replace(/\*/g, '');

    const trySpeak = () => {
      const voices = window.speechSynthesis.getVoices();
      const langCode = lang.slice(0, 2).toLowerCase();
      let chosen;
      if (langCode === 'nl') {
        chosen = voices.find(v => v.lang.toLowerCase() === 'nl-nl' && v.name.toLowerCase().includes('male'))
              || voices.find(v => v.lang.toLowerCase() === 'nl-nl')
              || voices.find(v => v.lang.toLowerCase().startsWith('nl') && !v.lang.toLowerCase().includes('be'));
      } else {
        chosen = voices.find(v => v.lang.toLowerCase() === lang.toLowerCase())
              || voices.find(v => v.lang.toLowerCase().startsWith(langCode));
      }

      if (chosen) {
        const utter = new SpeechSynthesisUtterance(clean);
        utter.voice = chosen;
        utter.lang = chosen.lang;
        utter.rate = 0.95;
        utter.pitch = 0.9;
        utter.onend = () => setSpeakingIndex(null);
        utter.onerror = () => setSpeakingIndex(null);
        window.speechSynthesis.speak(utter);
      } else if ((window as any).responsiveVoice) {
        (window as any).responsiveVoice.speak(clean, getRVVoice(lang), {
          rate: 0.9,
          onend: () => setSpeakingIndex(null),
        });
      } else {
        const chunks = clean.match(/.{1,180}(?:\s|$)/g) || [clean];
        const playChunk = (i: number) => {
          if (i >= chunks.length) { setSpeakingIndex(null); return; }
          const src = `/api/tts?text=${encodeURIComponent(chunks[i].trim())}&lang=${lang.slice(0,2)}`;
          const audio = new Audio(src);
          audio.onended = () => playChunk(i + 1);
          audio.onerror = () => setSpeakingIndex(null);
          audio.play().catch(() => setSpeakingIndex(null));
        };
        playChunk(0);
      }
    };

    if (window.speechSynthesis.getVoices().length > 0) trySpeak();
    else { window.speechSynthesis.onvoiceschanged = trySpeak; }
  };

  const [availableVoiceLangs, setAvailableVoiceLangs] = useState<string[]>([]);
  useEffect(() => {
    const updateVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      const langs = voices.map(v => v.lang.slice(0,2).toLowerCase());
      setAvailableVoiceLangs(Array.from(new Set(langs)));
    };
    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;
  }, []);

  const getRVVoice = (lang: string): string => {
    const map: Record<string, string> = {
      'tr': 'Turkish Female', 'en': 'UK English Female', 'nl': 'Dutch Female',
      'de': 'Deutsch Female', 'fr': 'French Female', 'es': 'Spanish Female',
      'ar': 'Arabic Female', 'ru': 'Russian Female', 'it': 'Italian Female',
    };
    return map[lang.slice(0,2).toLowerCase()] || 'Dutch Female';
  };

  const speakInLang = (text: string, lang: string) => {
    window.speechSynthesis.cancel();
    const langCode = lang.slice(0, 2).toLowerCase();
    setTimeout(() => {
      const voices = window.speechSynthesis.getVoices();
      const chosen = voices.find(v => v.lang.toLowerCase().startsWith(langCode));
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = lang;
      utter.rate = 0.88;
      if (chosen) utter.voice = chosen;
      window.speechSynthesis.speak(utter);
    }, 100);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxSize = 800;
        let w = img.width, h = img.height;
        if (w > maxSize || h > maxSize) {
          if (w > h) { h = Math.round(h * maxSize / w); w = maxSize; }
          else { w = Math.round(w * maxSize / h); h = maxSize; }
        }
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
        const compressed = canvas.toDataURL('image/jpeg', 0.7);
        const base64 = compressed.split(',')[1];
        setUploadedImage({ base64, mimeType: 'image/jpeg', preview: compressed });
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const analyzeUploadedImage = () => {
    if (!uploadedImage) return;
    const { base64, preview } = uploadedImage;
    setIsPending(true);
    setError(null);
    setUploadedImage(null);
    setMessages(prev => [...prev, { role: 'user', content: '', img: preview }]);
    fetch('/api/analyze-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ base64Image: base64, mimeType: 'image/jpeg' }),
    }).then(r => r.json()).then(data => {
      setMessages(prev => {
        const updated = [...prev, { role: 'assistant', content: data.content || data.message }];
        clearTimeout((window as any)._autoSaveTimer);
        (window as any)._autoSaveTimer = setTimeout(() => {
          autoSaveConversation(updated);
        }, 120000);
        return updated;
      });
      setIsPending(false);
    }).catch(() => { setError('Analyse mislukt'); setIsPending(false); });
  };

  // ---- CHAT VERSTUREN ----
  const handleSend = async () => {
    if ((!input.trim() && !uploadedImage) || isPending) return;
    setError(null);
    setIsPending(true);

    const userContent = input.trim();
    const imgPreview = uploadedImage?.preview;
    setSavedEntryId(null);

    setMessages(prev => [...prev, { role: 'user', content: userContent || 'Analyseer deze afbeelding', img: imgPreview }]);
    setInput('');

    try {
      if (uploadedImage) {
        const res = await fetch('/api/analyze-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            base64Image: uploadedImage.base64,
            mimeType: uploadedImage.mimeType,
            question: userContent || undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Analyse mislukt');
        setMessages(prev => [...prev, { role: 'assistant', content: data.content }]);
        setRetiVisible(true);
        setUploadedImage(null);
      } else {
        const history = messages.slice(-10).map(m => ({ role: m.role, content: m.content }));
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: userContent, history }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Chat mislukt');
        setMessages(prev => {
          const updated = [...prev, { role: 'assistant', content: data.content }];
          setRetiVisible(true);
          clearTimeout((window as any)._autoSaveTimer);
          (window as any)._autoSaveTimer = setTimeout(() => {
            autoSaveConversation(updated);
          }, 120000);
          return updated;
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er is een fout opgetreden');
    }
    setIsPending(false);
  };

  // ---- AFBEELDING GENEREREN ----
  const handleGenerateImage = async () => {
    if (!imagePrompt.trim() || isPending) return;
    setError(null);
    setIsPending(true);
    setGeneratedImage(null);
    setImageProviders([]);
    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: imagePrompt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Fout');
      setGeneratedImage(data.englishPrompt);
      setImageProviders(data.providers || []);
      try { await navigator.clipboard.writeText(data.englishPrompt); } catch {}
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fout');
    }
    setIsPending(false);
  };

  // ---- LIVE VERTALER ----
  const [translatorOpen, setTranslatorOpen] = useState(false);
  const [myLang, setMyLang] = useState('nl-NL');
  const [theirLang, setTheirLang] = useState('en-US');
  const [myText, setMyText] = useState('');
  const [theirText, setTheirText] = useState('');
  const [isListeningMine, setIsListeningMine] = useState(false);
  const [isListeningTheirs, setIsListeningTheirs] = useState(false);

  const LANGS = [
    { code: 'nl-NL', label: '🇳🇱 Nederlands' },
    { code: 'en-US', label: '🇺🇸 Engels' },
    { code: 'de-DE', label: '🇩🇪 Duits' },
    { code: 'fr-FR', label: '🇫🇷 Frans' },
    { code: 'es-ES', label: '🇪🇸 Spaans' },
    { code: 'tr-TR', label: '🇹🇷 Turks' },
    { code: 'ar-SA', label: '🇸🇦 Arabisch' },
  ];

  const startListening = (forMe: boolean) => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { alert('Speech herkenning niet ondersteund in deze browser. Gebruik Chrome!'); return; }
    const recognition = new SpeechRecognition();
    recognition.lang = forMe ? myLang : theirLang;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    if (forMe) setIsListeningMine(true); else setIsListeningTheirs(true);
    recognition.onresult = async (event: any) => {
      const spoken = event.results[0][0].transcript;
      const fromLang = forMe ? myLang.slice(0,2) : theirLang.slice(0,2);
      const toLang = forMe ? theirLang.slice(0,2) : myLang.slice(0,2);
      if (forMe) setMyText(spoken); else setTheirText(spoken);
      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: `Translate this text from ${fromLang} to ${toLang}. Return ONLY the translation, nothing else: "${spoken}"`,
            history: []
          }),
        });
        const data = await res.json();
        const translation = data.content?.split('\n\n[Recentheids')[0] || spoken;
        if (forMe) setTheirText(translation); else setMyText(translation);
      } catch {}
    };
    recognition.onend = () => { if (forMe) setIsListeningMine(false); else setIsListeningTheirs(false); };
    recognition.onerror = () => { if (forMe) setIsListeningMine(false); else setIsListeningTheirs(false); };
    recognition.start();
  };

  // ---- HISTORY ----
  const loadHistory = async () => {
    try {
      const res = await fetch('/api/history');
      const data = await res.json();
      setHistoryEntries(data);
    } catch {}
  };

  const autoSaveConversation = async (msgs: any[]) => {
    if (msgs.length < 2) return;
    try {
      await fetch('/api/history/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: msgs.map(m => ({ role: m.role, content: m.content })) }),
      });
    } catch {}
  };

  const manualSave = async () => {
    if (messages.length < 2) return;
    try {
      const res = await fetch('/api/history/manual-save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: messages.map(m => ({ role: m.role, content: m.content })) }),
      });
      const data = await res.json();
      if (data.saved) { setSavedEntryId(data.entry.id); loadHistory(); }
    } catch {}
  };

  const toggleStar = async (id: string) => {
    try {
      await fetch(`/api/history/star/${id}`, { method: 'POST' });
      loadHistory();
    } catch {}
  };

  const deleteEntry = async (id: string) => {
    try {
      await fetch(`/api/history/${id}`, { method: 'DELETE' });
      setSelectedEntry(null);
      loadHistory();
    } catch {}
  };

  useEffect(() => { loadHistory(); }, []);

  const handleOpenVideo = async (providerUrl: string) => {
    if (!videoPrompt.trim()) { alert('Beschrijf eerst je video!'); return; }
    setIsPending(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Translate this to English for an AI video generator, return only the translation: "${videoPrompt}"`,
          history: []
        }),
      });
      const data = await res.json();
      const translated = data.content?.split('\n\n[Recentheids')[0] || videoPrompt;
      try { await navigator.clipboard.writeText(translated); } catch {}
      alert(`Vertaald en gekopieerd:\n\n"${translated}"\n\nDe site opent nu. Plak de prompt erin!`);
    } catch {}
    window.open(providerUrl, '_blank');
    setIsPending(false);
  };

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div style={{
      backgroundColor:'#000', color:'white', height:'100dvh', width:'100vw',
      display:'flex', flexDirection:'column', position:'fixed', inset:0, overflow:'hidden',
    }}>
      {/* ACHTERGROND AFBEELDING — vast onderaan */}
      <img
        src="/aangepast-bg.png"
        style={{
          position:'fixed',
          bottom: '70px',
          left:'50%',
          transform:'translateX(-50%)',
          width:'100%',
          maxWidth:'500px',
          zIndex:0,
          pointerEvents:'none',
          opacity:1,
        }}
      />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&display=swap');
        @font-face { font-family: 'SpaceAge'; src: url('/space age.ttf') format('truetype'); }
        @font-face { font-family: 'OpenDyslexic'; src: url('/OpenDyslexic3-Regular.ttf') format('truetype'); }
        .orb { font-family: 'Orbitron', sans-serif; }
        .space-age { font-family: 'SpaceAge', 'Orbitron', sans-serif; }
        .chat-text { font-family: 'OpenDyslexic', sans-serif; font-size: 14px; line-height: 1.8; }
        @keyframes holoFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        .float { animation: float 5s ease-in-out infinite; }
        @keyframes pulse-border { 0%,100%{box-shadow:0 0 10px rgba(34,211,238,0.3)} 50%{box-shadow:0 0 25px rgba(34,211,238,0.7)} }
        .pulse { animation: pulse-border 2s ease-in-out infinite; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(34,211,238,0.3); border-radius: 4px; }
        .msg-bubble { padding:14px 18px; border-radius:18px; margin:6px 0; max-width:85%; border:none; line-height:1.6; font-size:13px; white-space:pre-wrap; }
        .tab-btn { padding:8px 16px; border-radius:20px; border:1px solid rgba(34,211,238,0.3); background:transparent; color:rgba(34,211,238,0.5); cursor:pointer; font-size:10px; transition:all 0.2s; }
        .tab-btn.active { background:rgba(34,211,238,0.15); color:#22d3ee; border-color:#22d3ee; }
        .provider-card { border:1px solid rgba(34,211,238,0.25); border-radius:12px; padding:12px; cursor:pointer; background:rgba(0,0,0,0.4); transition:all 0.2s; backdrop-filter:blur(10px); }
        .provider-card:hover { border-color:#22d3ee; background:rgba(34,211,238,0.08); }
      `}</style>

      {!bootDone && <BootAnimation onComplete={() => setBootDone(true)} />}
      {showSystemMsg && <SystemMessage onDone={() => setShowSystemMsg(false)} />}

      <NeuralNetwork />
      <HologramReti isSpeaking={speakingIndex !== null} visible={retiVisible} menuOpen={translatorOpen} />

      {/* HEADER */}
      <div style={{ padding:'20px', zIndex:100, display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid rgba(34,211,238,0.1)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'14px' }}>
          <div className="pulse" style={{ width:'44px', height:'44px', borderRadius:'50%', border:'1px solid rgba(34,211,238,0.6)', overflow:'hidden' }}>
            <img src="/reti-icoon.png" style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }} />
          </div>
          <span className="space-age" style={{ fontSize:'22px', fontWeight:'bold', letterSpacing:'4px', color:'#22d3ee' }}>RETI</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
          <div className="orb" style={{ color:'#22d3ee', fontSize:'9px', border:'1px solid rgba(34,211,238,0.4)', padding:'4px 12px', borderRadius:'20px' }}>
            ○ NEURAL LINK ACTIVE
          </div>
          {messages.length > 0 && (
            <button
              onClick={() => { setMessages([]); setSavedEntryId(null); setRetiVisible(false); setInput(''); setUploadedImage(null); setExpandedMessages(new Set()); }}
              className="orb"
              title="Nieuwe chat"
              style={{ width:'38px', height:'38px', background:'rgba(0,0,0,0.6)', border:'1px solid rgba(34,211,238,0.4)', borderRadius:'10px', color:'#22d3ee', cursor:'pointer', fontSize:'16px', display:'flex', alignItems:'center', justifyContent:'center' }}
            >✦</button>
          )}
          <button
            onClick={() => setTranslatorOpen(o => !o)}
            className="orb"
            style={{ width:'38px', height:'38px', background: translatorOpen ? 'rgba(34,211,238,0.15)' : 'rgba(0,0,0,0.6)', border:`1px solid ${translatorOpen ? '#22d3ee' : 'rgba(34,211,238,0.4)'}`, borderRadius:'10px', color:'#22d3ee', cursor:'pointer', fontSize:'18px', display:'flex', alignItems:'center', justifyContent:'center' }}
          >☰</button>
        </div>
      </div>

      {/* INKLAPMENU */}
      {translatorOpen && (
        <div style={{ zIndex:100, borderBottom:'1px solid rgba(34,211,238,0.2)', background:'rgba(0,0,0,0.85)', backdropFilter:'blur(10px)' }}>
          <div style={{ display:'flex', gap:'6px', padding:'10px 12px', borderBottom:'1px solid rgba(34,211,238,0.1)', alignItems:'center', flexWrap:'wrap' }}>
            <button className={`tab-btn orb ${tab==='image'?'active':''}`} onClick={() => setTab(tab === 'image' ? 'chat' : 'image')} style={{ padding:'7px 10px', fontSize:'10px' }}>🎨 BEELD</button>
            <button className={`tab-btn orb ${tab==='video'?'active':''}`} onClick={() => setTab(tab === 'video' ? 'chat' : 'video')} style={{ padding:'7px 10px', fontSize:'10px' }}>🎥 VIDEO</button>
            <button className={`tab-btn orb ${tab==='translator'?'active':''}`} onClick={() => setTab(tab === 'translator' ? 'chat' : 'translator')} style={{ padding:'7px 10px', fontSize:'10px' }}>🌐 VERTAAL</button>
            <button className={`tab-btn orb ${tab==='history'?'active':''}`} onClick={() => { setTab(tab === 'history' ? 'chat' : 'history'); loadHistory(); }} style={{ padding:'7px 10px', fontSize:'10px' }}>📚 HISTORY</button>
          </div>
        </div>
      )}

      {/* VERTALER */}
      {translatorOpen && tab === 'translator' && (
        <div style={{
          position:'fixed', top:'120px', left:0, right:0, bottom:0,
          zIndex:300, padding:'12px 16px',
          background:'rgba(0,0,0,0.95)', backdropFilter:'blur(10px)',
          overflowY:'auto',
        }}>
          <div style={{ maxWidth:'800px', margin:'0 auto' }}>
            <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:'8px' }}>
              <button onClick={() => { setTranslatorOpen(false); setTab('chat'); }} className="orb" style={{ background:'none', border:'1px solid rgba(34,211,238,0.3)', borderRadius:'8px', color:'rgba(34,211,238,0.6)', padding:'4px 14px', cursor:'pointer', fontSize:'11px' }}>✕ SLUIT</button>
            </div>
            <div style={{ display:'flex', gap:'12px', marginBottom:'12px', alignItems:'center' }}>
              <select value={myLang} onChange={e => setMyLang(e.target.value)} className="orb" style={{ background:'rgba(0,0,0,0.8)', border:'1px solid rgba(34,211,238,0.4)', borderRadius:'8px', color:'#22d3ee', padding:'6px 10px', fontSize:'11px', flex:1 }}>
                {LANGS.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
              </select>
              <span style={{ color:'rgba(34,211,238,0.5)', fontSize:'18px' }}>⇄</span>
              <select value={theirLang} onChange={e => setTheirLang(e.target.value)} className="orb" style={{ background:'rgba(0,0,0,0.8)', border:'1px solid rgba(34,211,238,0.4)', borderRadius:'8px', color:'#22d3ee', padding:'6px 10px', fontSize:'11px', flex:1 }}>
                {LANGS.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
              </select>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', height:'calc(100vh - 220px)' }}>
              <div style={{ border:'1px solid rgba(34,211,238,0.3)', borderRadius:'12px', padding:'12px', background:'rgba(0,0,0,0.6)', display:'flex', flexDirection:'column', gap:'8px', overflow:'hidden' }}>
                <div className="orb" style={{ fontSize:'9px', color:'rgba(34,211,238,0.5)', letterSpacing:'2px', flexShrink:0 }}>IK SPREEK</div>
                <div style={{ flex:1, overflowY:'auto', color:'white', fontSize:'13px', lineHeight:'1.6', wordBreak:'break-word' }}>
                  {myText || <span style={{ opacity:0.3 }}>Druk op de knop en spreek...</span>}
                </div>
                {myText && (
                  <button onClick={() => speakInLang(myText, myLang)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:'14px', opacity:0.7, textAlign:'left', flexShrink:0 }}>🔊</button>
                )}
                <textarea placeholder="Of typ hier..." className="orb" rows={2}
                  style={{ width:'100%', background:'rgba(0,0,0,0.5)', border:'1px solid rgba(34,211,238,0.2)', borderRadius:'8px', padding:'8px', color:'white', fontSize:'12px', outline:'none', resize:'none', boxSizing:'border-box', flexShrink:0 }}
                  onKeyDown={async (e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      const typed = (e.target as HTMLTextAreaElement).value.trim();
                      if (!typed) return;
                      setMyText(typed);
                      (e.target as HTMLTextAreaElement).value = '';
                      try {
                        const res = await fetch('/api/chat', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ message: `Translate from ${myLang.slice(0,2)} to ${theirLang.slice(0,2)}, return ONLY the translation: "${typed}"`, history:[] }) });
                        const data = await res.json();
                        const translated = data.content?.split('\n\n[Recentheids')[0] || typed;
                        setTheirText(translated);
                      } catch {}
                    }
                  }}
                />
                <button onClick={() => startListening(true)} disabled={isListeningMine || isListeningTheirs}
                  style={{ width:'100%', padding:'10px', background: isListeningMine ? 'rgba(255,50,50,0.2)' : 'rgba(34,211,238,0.1)', border:`1px solid ${isListeningMine ? 'rgba(255,50,50,0.6)' : 'rgba(34,211,238,0.4)'}`, borderRadius:'8px', color: isListeningMine ? '#ff6666' : '#22d3ee', cursor:'pointer', fontSize:'11px', flexShrink:0 }} className="orb">
                  {isListeningMine ? '🔴 LUISTERT...' : '🎤 SPREEK'}
                </button>
              </div>
              <div style={{ border:'1px solid rgba(34,211,238,0.3)', borderRadius:'12px', padding:'12px', background:'rgba(0,0,0,0.6)', display:'flex', flexDirection:'column', gap:'8px', overflow:'hidden' }}>
                <div className="orb" style={{ fontSize:'9px', color:'rgba(34,211,238,0.5)', letterSpacing:'2px', flexShrink:0 }}>ZIJ SPREKEN</div>
                <div style={{ flex:1, overflowY:'auto', color:'#22d3ee', fontSize:'13px', lineHeight:'1.6', wordBreak:'break-word' }}>
                  {theirText || <span style={{ opacity:0.3 }}>Vertaling verschijnt hier...</span>}
                </div>
                {theirText && (
                  <button onClick={() => speakInLang(theirText, theirLang)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:'14px', opacity:0.7, textAlign:'left', flexShrink:0 }}>🔊</button>
                )}
                <textarea placeholder="Of typ hier..." className="orb" rows={2}
                  style={{ width:'100%', background:'rgba(0,0,0,0.5)', border:'1px solid rgba(34,211,238,0.2)', borderRadius:'8px', padding:'8px', color:'white', fontSize:'12px', outline:'none', resize:'none', boxSizing:'border-box', flexShrink:0 }}
                  onKeyDown={async (e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      const typed = (e.target as HTMLTextAreaElement).value.trim();
                      if (!typed) return;
                      setTheirText(typed);
                      (e.target as HTMLTextAreaElement).value = '';
                      try {
                        const res = await fetch('/api/chat', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ message: `Translate from ${theirLang.slice(0,2)} to ${myLang.slice(0,2)}, return ONLY the translation: "${typed}"`, history:[] }) });
                        const data = await res.json();
                        const translated = data.content?.split('\n\n[Recentheids')[0] || typed;
                        setMyText(translated);
                      } catch {}
                    }
                  }}
                />
                <button onClick={() => startListening(false)} disabled={isListeningMine || isListeningTheirs}
                  style={{ width:'100%', padding:'10px', background: isListeningTheirs ? 'rgba(255,50,50,0.2)' : 'rgba(34,211,238,0.1)', border:`1px solid ${isListeningTheirs ? 'rgba(255,50,50,0.6)' : 'rgba(34,211,238,0.4)'}`, borderRadius:'8px', color: isListeningTheirs ? '#ff6666' : '#22d3ee', cursor:'pointer', fontSize:'11px', flexShrink:0 }} className="orb">
                  {isListeningTheirs ? '🔴 LUISTERT...' : '🎤 SPREEK'}
                </button>
              </div>
            </div>
            <button onClick={() => { setMyText(''); setTheirText(''); }} style={{ marginTop:'10px', background:'none', border:'none', color:'rgba(34,211,238,0.3)', cursor:'pointer', fontSize:'11px' }} className="orb">✕ wissen</button>
          </div>
        </div>
      )}

      {/* ERROR */}
      {error && (
        <div style={{ margin:'10px 20px', padding:'10px 16px', border:'1px solid rgba(255,68,68,0.5)', borderRadius:'10px', background:'rgba(255,0,0,0.08)', color:'#ff6666', fontSize:'12px', zIndex:100 }} className="orb">
          ⚠ {error}
        </div>
      )}

      {/* ===== CHAT TAB ===== */}
      {tab === 'chat' && (
        <>
          <div style={{
            position:'fixed', top:'70px', left:0, right:0, height:'100px',
            background:'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.8) 50%, transparent 100%)',
            pointerEvents:'none', zIndex:15,
          }} />
          <div style={{ flex:1, overflowY:'auto', padding:'16px 20px 120px 20px', zIndex:10, position:'relative' }}>
            <div style={{ maxWidth:'800px', margin:'0 auto' }}>
              {messages.length === 0 && (
                <div style={{ textAlign:'center', padding:'60px 20px' }}>
                  <h2 className="space-age" style={{ fontSize:'24px', letterSpacing:'8px', color:'#22d3ee', marginBottom:'8px' }}>RETICULI ONLINE</h2>
                  <p className="space-age" style={{ fontSize:'9px', color:'rgba(34,211,238,0.4)', letterSpacing:'4px' }}>NEURAL LINK ESTABLISHED</p>
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} style={{ marginBottom:'16px' }}>
                  {m.img && (
                    <div style={{ display:'flex', justifyContent:'center', marginBottom:'12px' }}>
                      <img src={m.img} style={{ maxWidth:'60%', maxHeight:'350px', borderRadius:'16px', border:'1px solid rgba(34,211,238,0.3)', objectFit:'contain' }} />
                    </div>
                  )}
                  {m.content && (
                    <div style={{ position:'relative' }}>
                      <div className="msg-bubble chat-text" style={{
                        background: 'transparent',
                        color: m.role==='user' ? 'white' : '#22d3ee',
                        textAlign: m.role==='user' ? 'right' : 'left',
                        maxWidth: '100%',
                      }}>
                        {m.role === 'assistant' ? (() => {
                          const isLong = m.content.length > 600;
                          const isExpanded = expandedMessages.has(i);
                          const displayText = isLong && !isExpanded ? m.content.slice(0, 600) + '...' : m.content;
                          return <>
                            <MarkdownText text={displayText} color="#22d3ee" />
                            {isLong && (
                              <button onClick={() => setExpandedMessages(prev => {
                                const next = new Set(prev);
                                isExpanded ? next.delete(i) : next.add(i);
                                return next;
                              })} className="orb" style={{ marginTop:'8px', background:'none', border:'1px solid rgba(34,211,238,0.3)', borderRadius:'20px', color:'rgba(34,211,238,0.7)', padding:'4px 14px', cursor:'pointer', fontSize:'10px', display:'block' }}>
                                {isExpanded ? '▲ minder' : '▼ lees meer'}
                              </button>
                            )}
                          </>;
                        })() : m.content}
                      </div>
                      {m.role === 'assistant' && (
                        <div style={{ display:'flex', gap:'8px', marginTop:'4px', alignItems:'center' }}>
                          <button onClick={() => speak(m.content, i)} title={speakingIndex === i ? 'Stop' : 'Voorlezen'}
                            style={{ background:'none', border:'none', cursor:'pointer', padding:0, opacity: speakingIndex === i ? 1 : 0.7, transition:'opacity 0.2s, transform 0.2s', transform: speakingIndex === i ? 'scale(1.1)' : 'scale(1)', animation: speakingIndex === i ? 'speakerPulse 1.2s ease-in-out infinite' : 'none' }}
                            onMouseEnter={e => (e.currentTarget.style.opacity='1')}
                            onMouseLeave={e => (e.currentTarget.style.opacity = speakingIndex === i ? '1' : '0.7')}
                          >
                            <img src="/sspeakerknop.png" style={{ width:'36px', height:'36px', objectFit:'contain', display:'block' }} />
                          </button>
                          <style>{`@keyframes speakerPulse{0%,100%{filter:brightness(1) drop-shadow(0 0 4px rgba(34,211,238,0.4))}50%{filter:brightness(1.5) drop-shadow(0 0 14px rgba(34,211,238,0.95))}}`}</style>
                          {i === messages.length - 1 && (
                            <button onClick={manualSave} title="Gesprek opslaan"
                              style={{ background:'none', border:'none', cursor:'pointer', fontSize:'15px', opacity: savedEntryId ? 1 : 0.4 }}>
                              {savedEntryId ? '⭐' : '☆'}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {isPending && (
                <div style={{ display:'flex', justifyContent:'flex-start', marginBottom:'8px' }}>
                  <div className="msg-bubble chat-text" style={{ background:'rgba(255,255,255,0.04)', color:'#22d3ee' }}>
                    RETI IS THINKING...
                  </div>
                </div>
              )}
              {uploadedImage && !isPending && (
                <div style={{ display:'flex', justifyContent:'center', marginBottom:'8px' }}>
                  <div style={{ textAlign:'center' }}>
                    <img src={uploadedImage.preview} style={{ maxWidth:'60%', maxHeight:'300px', objectFit:'contain', borderRadius:'12px', border:'1px solid rgba(34,211,238,0.3)', display:'block', margin:'0 auto 10px' }} />
                    <div style={{ display:'flex', gap:'10px', justifyContent:'center' }}>
                      <button onClick={analyzeUploadedImage} className="orb" style={{ padding:'10px 24px', background:'rgba(34,211,238,0.15)', border:'1px solid rgba(34,211,238,0.5)', borderRadius:'20px', color:'#22d3ee', cursor:'pointer', fontSize:'11px' }}>🔍 ANALYSEER</button>
                      <button onClick={() => setUploadedImage(null)} className="orb" style={{ padding:'10px 16px', background:'rgba(255,50,50,0.1)', border:'1px solid rgba(255,50,50,0.3)', borderRadius:'20px', color:'rgba(255,100,100,0.7)', cursor:'pointer', fontSize:'11px' }}>✕ VERWIJDER</button>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef}></div>
            </div>
          </div>

          {/* CAMERA OVERLAY */}
          {showCamera && (
            <div style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(0,0,0,0.95)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'16px' }}>
              <video ref={videoRef} autoPlay playsInline style={{ maxWidth:'100%', maxHeight:'60vh', borderRadius:'16px', border:'1px solid rgba(34,211,238,0.4)' }} />
              <div style={{ display:'flex', gap:'16px' }}>
                <button onClick={capturePhoto} className="orb" style={{ padding:'14px 32px', background:'rgba(34,211,238,0.2)', border:'2px solid #22d3ee', borderRadius:'50px', color:'#22d3ee', cursor:'pointer', fontSize:'13px', fontWeight:'bold' }}>📸 FOTO MAKEN</button>
                <button onClick={closeCamera} className="orb" style={{ padding:'14px 20px', background:'rgba(255,50,50,0.1)', border:'1px solid rgba(255,50,50,0.4)', borderRadius:'50px', color:'rgba(255,100,100,0.8)', cursor:'pointer', fontSize:'13px' }}>✕ SLUITEN</button>
              </div>
            </div>
          )}

          {/* CHAT INPUT */}
          <div style={{ padding:'12px 16px', paddingBottom:'calc(12px + env(safe-area-inset-bottom, 0px))', zIndex:200, borderTop:'1px solid rgba(34,211,238,0.1)', background:'rgba(0,0,0,0)', backdropFilter:'blur(0px)', flexShrink:0 }}>
            <div style={{ maxWidth:'760px', margin:'0 auto', display:'flex', alignItems:'flex-end', gap:'10px' }}>
              <input type="file" ref={fileRef} style={{ display:'none' }} onChange={handleFileChange} accept="image/*" />
              <input type="file" ref={cameraRef} style={{ display:'none' }} onChange={handleFileChange} accept="image/*" capture="environment" />
              <div style={{ position:'relative', flexShrink:0 }}>
                <button onClick={() => setShowPhotoMenu(v => !v)}
                  style={{ width:'50px', height:'50px', background:'rgba(0,0,0,0.6)', border:'1px solid rgba(34,211,238,0.4)', borderRadius:'12px', cursor:'pointer', padding:'0', overflow:'hidden' }}>
                  <img src="/foto-icoon.png" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                </button>
                {showPhotoMenu && (
                  <div style={{ position:'absolute', bottom:'58px', left:0, background:'rgba(0,0,0,0.95)', border:'1px solid rgba(34,211,238,0.4)', borderRadius:'10px', overflow:'hidden', whiteSpace:'nowrap', zIndex:300 }}>
                    <button onClick={() => { setShowPhotoMenu(false); fileRef.current?.click(); }} className="orb" style={{ display:'block', width:'100%', padding:'10px 16px', background:'none', border:'none', borderBottom:'1px solid rgba(34,211,238,0.15)', color:'#22d3ee', cursor:'pointer', fontSize:'11px', textAlign:'left' }}>🖼 Foto uploaden</button>
                    <button onClick={() => { setShowPhotoMenu(false); openCamera(); }} className="orb" style={{ display:'block', width:'100%', padding:'10px 16px', background:'none', border:'none', color:'#22d3ee', cursor:'pointer', fontSize:'11px', textAlign:'left' }}>📷 Camera openen</button>
                  </div>
                )}
              </div>
              <textarea value={input} onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="" className="orb" rows={1}
                style={{ flex:1, background:'rgba(0,0,0,0.7)', border:'1px solid rgba(34,211,238,0.4)', borderRadius:'12px', padding:'14px 16px', color:'white', outline:'none', resize:'none', fontSize:'14px', maxHeight:'120px', fontFamily:'OpenDyslexic, sans-serif' }}
              />
              <button onClick={() => {
                  const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
                  if (!SR) { alert('Spraakherkenning niet beschikbaar. Gebruik Chrome!'); return; }
                  if (isChatListening) { chatRecogRef.current?.stop(); setIsChatListening(false); return; }
                  const rec = new SR();
                  chatRecogRef.current = rec;
                  rec.lang = 'nl-NL';
                  rec.interimResults = false;
                  rec.onstart = () => setIsChatListening(true);
                  rec.onresult = (e: any) => {
                    const spoken = e.results[0][0].transcript;
                    setInput(prev => prev ? prev + ' ' + spoken : spoken);
                  };
                  rec.onend = () => setIsChatListening(false);
                  rec.onerror = () => setIsChatListening(false);
                  rec.start();
                }}
                style={{ width:'50px', height:'50px', flexShrink:0, background:'none', border:'none', borderRadius:'12px', cursor:'pointer', padding:0, display:'flex', alignItems:'center', justifyContent:'center', animation: isChatListening ? 'speakerPulse 1s ease-in-out infinite' : 'none' }}>
                <img src="/sspeakerknop.png" style={{ width:'50px', height:'50px', objectFit:'contain', borderRadius:'10px', filter: isChatListening ? 'brightness(1.5) drop-shadow(0 0 10px rgba(255,80,80,0.9))' : 'brightness(0.9)' }} />
              </button>
              <button onClick={handleSend} disabled={isPending}
                style={{ width:'50px', height:'50px', background:'rgba(34,211,238,0.1)', border:'1px solid rgba(34,211,238,0.5)', borderRadius:'12px', color:'#22d3ee', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <SendIcon />
              </button>
            </div>
          </div>
        </>
      )}

      {/* ===== AFBEELDING TAB ===== */}
      {tab === 'image' && (
        <div style={{ flex:1, overflowY:'auto', padding:'24px 20px', zIndex:10 }}>
          <div style={{ maxWidth:'700px', margin:'0 auto' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'8px' }}>
              <h2 className="orb" style={{ color:'#22d3ee', fontSize:'14px', letterSpacing:'4px' }}>AFBEELDING GENEREREN</h2>
              <button onClick={() => { setTranslatorOpen(false); setTab('chat'); }} className="orb" style={{ background:'none', border:'1px solid rgba(34,211,238,0.3)', borderRadius:'8px', color:'rgba(34,211,238,0.6)', padding:'4px 14px', cursor:'pointer', fontSize:'11px' }}>✕ SLUIT</button>
            </div>
            <p style={{ color:'rgba(255,255,255,0.4)', fontSize:'12px', marginBottom:'20px' }}>Typ je prompt in het Nederlands. Reti vertaalt naar Engels en opent de beste gratis image AI.</p>
            <div style={{ display:'flex', gap:'10px', marginBottom:'20px' }}>
              <textarea value={imagePrompt} onChange={(e) => setImagePrompt(e.target.value)}
                placeholder="Beschrijf je afbeelding in het Nederlands..." className="orb" rows={3}
                style={{ flex:1, background:'rgba(0,0,0,0.7)', border:'1px solid rgba(34,211,238,0.4)', borderRadius:'12px', padding:'14px 16px', color:'white', outline:'none', resize:'none', fontSize:'13px' }}
              />
              <button onClick={handleGenerateImage} disabled={isPending || !imagePrompt.trim()}
                style={{ padding:'14px 20px', background:'rgba(34,211,238,0.1)', border:'1px solid rgba(34,211,238,0.5)', borderRadius:'12px', color:'#22d3ee', cursor:'pointer', fontSize:'12px', fontWeight:'bold' }} className="orb">
                {isPending ? 'LADEN...' : 'VERTAAL'}
              </button>
            </div>
            {generatedImage && (
              <div style={{ marginBottom:'20px', padding:'16px', border:'1px solid rgba(34,211,238,0.3)', borderRadius:'12px', background:'rgba(0,0,0,0.4)' }}>
                <p className="orb" style={{ color:'rgba(34,211,238,0.6)', fontSize:'10px', marginBottom:'8px' }}>VERTAALDE PROMPT (gekopieerd naar klembord):</p>
                <p style={{ color:'white', fontSize:'13px', lineHeight:'1.6' }}>{generatedImage}</p>
              </div>
            )}
            {imageProviders.length > 0 && (
              <>
                <p className="orb" style={{ color:'rgba(34,211,238,0.5)', fontSize:'10px', letterSpacing:'2px', marginBottom:'12px' }}>KIES EEN GRATIS PROVIDER:</p>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))', gap:'12px' }}>
                  {imageProviders.map((p: any) => (
                    <div key={p.name} className="provider-card" onClick={() => { if(generatedImage) { navigator.clipboard.writeText(generatedImage).catch(()=>{}); } window.open(p.url, '_blank'); }}>
                      <div className="orb" style={{ color:'#22d3ee', fontSize:'13px', fontWeight:'bold', marginBottom:'4px' }}>{p.name}</div>
                      <div style={{ color:'rgba(34,211,238,0.5)', fontSize:'10px', marginBottom:'8px' }}>{p.description}</div>
                      <div style={{ display:'inline-block', padding:'3px 10px', borderRadius:'20px', background:'rgba(34,211,238,0.1)', border:'1px solid rgba(34,211,238,0.3)', color:'#22d3ee', fontSize:'10px' }} className="orb">OPEN →</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ===== HISTORY TAB ===== */}
      {tab === 'history' && (
        <div style={{ flex:1, overflowY:'auto', padding:'20px', zIndex:10 }}>
          <div style={{ maxWidth:'700px', margin:'0 auto' }}>
            {!selectedEntry && (
              <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:'12px' }}>
                <button onClick={() => { setTranslatorOpen(false); setTab('chat'); }} className="orb" style={{ background:'none', border:'1px solid rgba(34,211,238,0.3)', borderRadius:'8px', color:'rgba(34,211,238,0.6)', padding:'4px 14px', cursor:'pointer', fontSize:'11px' }}>✕ SLUIT</button>
              </div>
            )}
            {selectedEntry ? (
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'16px' }}>
                  <button onClick={() => setSelectedEntry(null)} style={{ background:'none', border:'1px solid rgba(34,211,238,0.3)', borderRadius:'8px', color:'#22d3ee', padding:'6px 12px', cursor:'pointer', fontSize:'11px' }} className="orb">← TERUG</button>
                  <button onClick={() => toggleStar(selectedEntry.id)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:'20px' }}>{selectedEntry.important ? '⭐' : '🥈'}</button>
                  <button onClick={() => deleteEntry(selectedEntry.id)} style={{ background:'none', border:'1px solid rgba(255,100,100,0.3)', borderRadius:'8px', color:'rgba(255,100,100,0.7)', padding:'6px 12px', cursor:'pointer', fontSize:'11px', marginLeft:'auto' }} className="orb">🗑 VERWIJDER</button>
                </div>
                <h3 className="space-age" style={{ color:'#22d3ee', fontSize:'14px', marginBottom:'4px' }}>{selectedEntry.title}</h3>
                <p style={{ color:'rgba(255,255,255,0.4)', fontSize:'11px', marginBottom:'16px' }}>{new Date(selectedEntry.date).toLocaleDateString('nl-NL', { day:'numeric', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' })}</p>
                <div style={{ border:'1px solid rgba(34,211,238,0.15)', borderRadius:'12px', padding:'16px', background:'rgba(0,0,0,0.4)' }}>
                  {selectedEntry.messages.map((m: any, i: number) => (
                    <div key={i} style={{ marginBottom:'12px', textAlign: m.role === 'user' ? 'right' : 'left' }}>
                      <span style={{ fontSize:'9px', color:'rgba(34,211,238,0.4)', display:'block', marginBottom:'4px' }} className="orb">{m.role === 'user' ? 'JIJ' : 'RETI'}</span>
                      <span className="chat-text" style={{ color: m.role === 'user' ? 'white' : '#22d3ee', fontSize:'13px', lineHeight:'1.7' }}>{m.content}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <>
                <div style={{ marginBottom:'20px', padding:'14px', border:'1px solid rgba(34,211,238,0.25)', borderRadius:'12px', background:'rgba(34,211,238,0.03)' }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'10px' }}>
                    <div className="orb" style={{ color:'#22d3ee', fontSize:'10px', letterSpacing:'3px' }}>🧠 RETI GEHEUGEN</div>
                    <div style={{ display:'flex', gap:'8px' }}>
                      <button onClick={() => fetch('/api/memory').then(r=>r.json()).then(setRetiMemory)} className="orb" style={{ background:'none', border:'1px solid rgba(34,211,238,0.3)', borderRadius:'6px', color:'rgba(34,211,238,0.7)', padding:'4px 10px', cursor:'pointer', fontSize:'10px' }}>↻ TOON</button>
                      <button onClick={() => { if(confirm('Geheugen wissen?')) fetch('/api/memory',{method:'DELETE'}).then(()=>setRetiMemory(null)); }} className="orb" style={{ background:'none', border:'1px solid rgba(255,100,100,0.3)', borderRadius:'6px', color:'rgba(255,100,100,0.6)', padding:'4px 10px', cursor:'pointer', fontSize:'10px' }}>✕ WISSEN</button>
                    </div>
                  </div>
                  {!retiMemory ? (
                    <p style={{ color:'rgba(255,255,255,0.3)', fontSize:'11px' }}>Druk op TOON om te zien wat Reti over jou onthoudt.</p>
                  ) : (
                    <div style={{ fontSize:'12px', lineHeight:'1.8', color:'rgba(255,255,255,0.7)' }}>
                      {retiMemory.name && <div>👤 <span style={{color:'rgba(34,211,238,0.7)'}}>Naam:</span> {retiMemory.name}</div>}
                      {retiMemory.location && <div>📍 <span style={{color:'rgba(34,211,238,0.7)'}}>Locatie:</span> {retiMemory.location}</div>}
                      {retiMemory.language && <div>🗣 <span style={{color:'rgba(34,211,238,0.7)'}}>Taal:</span> {retiMemory.language}</div>}
                      {retiMemory.interests?.length > 0 && <div>⭐ <span style={{color:'rgba(34,211,238,0.7)'}}>Interesses:</span> {retiMemory.interests.join(', ')}</div>}
                      {retiMemory.preferences?.length > 0 && <div>💡 <span style={{color:'rgba(34,211,238,0.7)'}}>Voorkeuren:</span> {retiMemory.preferences.join(', ')}</div>}
                      {retiMemory.facts?.length > 0 && <div>📝 <span style={{color:'rgba(34,211,238,0.7)'}}>Feiten:</span> {retiMemory.facts.join(', ')}</div>}
                      {!retiMemory.name && !retiMemory.location && retiMemory.interests?.length === 0 && (
                        <p style={{ color:'rgba(255,255,255,0.3)', fontSize:'11px' }}>Nog niets onthouden. Vertel Reti je naam of interesses!</p>
                      )}
                      {retiMemory.lastUpdated && <div style={{ marginTop:'6px', color:'rgba(34,211,238,0.3)', fontSize:'10px' }} className="orb">Bijgewerkt: {new Date(retiMemory.lastUpdated).toLocaleDateString('nl-NL')}</div>}
                    </div>
                  )}
                </div>
                <div style={{ display:'flex', gap:'8px', marginBottom:'16px', flexWrap:'wrap' }}>
                  <button className={`tab-btn orb ${historyFilter==='all'?'active':''}`} onClick={() => setHistoryFilter('all')}>ALLES ({historyEntries.length})</button>
                  <button className={`tab-btn orb ${historyFilter==='important'?'active':''}`} onClick={() => setHistoryFilter('important')}>⭐ BELANGRIJK ({historyEntries.filter(e=>e.important).length})</button>
                  <button className={`tab-btn orb ${bulkMode?'active':''}`} onClick={() => { setBulkMode(v => !v); setSelectedIds(new Set()); }}>☑ SELECTEER</button>
                  {bulkMode && selectedIds.size > 0 && (
                    <button className="tab-btn orb" onClick={async () => {
                      if (!confirm(`${selectedIds.size} gesprekken wissen?`)) return;
                      for (const id of selectedIds) {
                        await fetch(`/api/history/${id}`, { method: 'DELETE' });
                      }
                      setSelectedIds(new Set());
                      setBulkMode(false);
                      loadHistory();
                    }} style={{ borderColor:'rgba(255,100,100,0.5)', color:'rgba(255,100,100,0.8)' }}>🗑 WIS {selectedIds.size}</button>
                  )}
                </div>
                {historyEntries.filter(e => historyFilter === 'all' || e.important).length === 0 ? (
                  <div style={{ textAlign:'center', padding:'40px', color:'rgba(255,255,255,0.3)', fontSize:'13px' }}>
                    <p>Nog geen gesprekken opgeslagen.</p>
                    <p style={{ fontSize:'11px', marginTop:'8px' }}>Chat met Reti en gebruik ☆ om gesprekken op te slaan.</p>
                  </div>
                ) : (
                  <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                    {historyEntries.filter(e => historyFilter === 'all' || e.important).map(entry => (
                      <div key={entry.id} className="provider-card" style={{ display:'flex', alignItems:'center', gap:'12px', border: selectedIds.has(entry.id) ? '1px solid rgba(255,100,100,0.6)' : undefined }}
                        onClick={() => {
                          if (bulkMode) {
                            setSelectedIds(prev => {
                              const next = new Set(prev);
                              next.has(entry.id) ? next.delete(entry.id) : next.add(entry.id);
                              return next;
                            });
                          } else {
                            setSelectedEntry(entry);
                          }
                        }}>
                        {bulkMode
                          ? <span style={{ fontSize:'20px', flexShrink:0 }}>{selectedIds.has(entry.id) ? '☑' : '☐'}</span>
                          : <span style={{ fontSize:'20px', flexShrink:0 }}>{entry.important ? '⭐' : '🥈'}</span>
                        }
                        <div style={{ flex:1, minWidth:0 }}>
                          <div className="orb" style={{ color:'#22d3ee', fontSize:'12px', marginBottom:'3px' }}>{entry.title}</div>
                          <div style={{ color:'rgba(255,255,255,0.5)', fontSize:'11px', marginBottom:'3px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{entry.summary}</div>
                          <div style={{ color:'rgba(34,211,238,0.4)', fontSize:'10px' }} className="orb">{new Date(entry.date).toLocaleDateString('nl-NL')}</div>
                        </div>
                        {!bulkMode && <span style={{ color:'rgba(34,211,238,0.3)', fontSize:'16px' }}>›</span>}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ===== VIDEO TAB ===== */}
      {tab === 'video' && (
        <div style={{ flex:1, overflowY:'auto', padding:'24px 20px', zIndex:10 }}>
          <div style={{ maxWidth:'700px', margin:'0 auto' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'8px' }}>
              <h2 className="orb" style={{ color:'#22d3ee', fontSize:'14px', letterSpacing:'4px' }}>VIDEO GENEREREN</h2>
              <button onClick={() => { setTranslatorOpen(false); setTab('chat'); }} className="orb" style={{ background:'none', border:'1px solid rgba(34,211,238,0.3)', borderRadius:'8px', color:'rgba(34,211,238,0.6)', padding:'4px 14px', cursor:'pointer', fontSize:'11px' }}>✕ SLUIT</button>
            </div>
            <p style={{ color:'rgba(255,255,255,0.4)', fontSize:'12px', marginBottom:'20px' }}>Typ je prompt, kies een provider. De app vertaalt naar Engels en opent de site.</p>
            <textarea value={videoPrompt} onChange={(e) => setVideoPrompt(e.target.value)}
              placeholder="Beschrijf je video in het Nederlands..." className="orb" rows={3}
              style={{ width:'100%', background:'rgba(0,0,0,0.7)', border:'1px solid rgba(34,211,238,0.4)', borderRadius:'12px', padding:'14px 16px', color:'white', outline:'none', resize:'none', fontSize:'13px', marginBottom:'20px' }}
            />
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))', gap:'12px' }}>
              {videoProviders.map(p => (
                <div key={p.id} className="provider-card" onClick={() => handleOpenVideo(p.url)}>
                  <div className="orb" style={{ color:'#22d3ee', fontSize:'13px', fontWeight:'bold', marginBottom:'4px' }}>{p.name}</div>
                  <div style={{ color:'rgba(34,211,238,0.5)', fontSize:'10px', marginBottom:'8px' }}>{p.badge}</div>
                  <div style={{ display:'inline-block', padding:'3px 10px', borderRadius:'20px', background:'rgba(34,211,238,0.1)', border:'1px solid rgba(34,211,238,0.3)', color:'#22d3ee', fontSize:'10px' }} className="orb">OPEN →</div>
                </div>
              ))}
            </div>
            <p style={{ color:'rgba(255,255,255,0.3)', fontSize:'11px', marginTop:'16px', textAlign:'center' }}>Tip: Begin met Vidu (geen account nodig) of Vivago (volledig gratis)</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;