import React, { useState, useEffect, useRef } from 'react';

// HET VERZEND ICOON
const SendIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-400">
    <line x1="22" y1="2" x2="11" y2="13"></line>
    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
  </svg>
);

const ChatPage: React.FC = () => {
  const [lastAnswer, setLastAnswer] = useState<{text: string, img?: string} | null>(null);
  const [inputValue, setInputValue] = useState<string>('');
  const [isPending, setIsPending] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // --- NEURAL PARTICLES LOGICA ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Array<{x: number, y: number, vx: number, vy: number, size: number}> = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const createParticles = () => {
      particles = [];
      for (let i = 0; i < 40; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          size: Math.random() * 2,
        });
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'rgba(34, 211, 238, 0.4)'; // Cyan deeltjes
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.1)'; 

      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      });
      animationFrameId = requestAnimationFrame(draw);
    };

    window.addEventListener('resize', resize);
    resize();
    createParticles();
    draw();
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const handleSend = (e: React.FormEvent) => {
    if (e) e.preventDefault();
    if (inputValue.trim() && !isPending) {
      setIsPending(true);
      setTimeout(() => {
        setLastAnswer({ text: `Reticuli Analyse: De matrix is stabiel. Input '${inputValue}' is verwerkt in de neural link.` });
        setInputValue('');
        setIsPending(false);
      }, 1000);
    }
  };

  return (
    <div style={{ 
      backgroundImage: `linear-gradient(to bottom, rgba(2,6,23,0.9), rgba(2,6,23,0.7)), url('https://api.pollinations.ai/prompt/dark%20teal%20neon%20circuit%20board%20pattern%20background?width=1000&height=1000&nologo=true')`,
      backgroundSize: 'cover'
    }} className="flex flex-col h-screen text-slate-100 font-sans relative overflow-hidden">

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&display=swap');
        .font-orbitron { font-family: 'Orbitron', sans-serif; }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        .float-anim { animation: float 5s ease-in-out infinite; }
      `}</style>

      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />

      {/* BOVENBALK */}
      <div className="relative z-20 p-6 flex justify-between items-center">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 rounded-full border-2 border-cyan-400/50 overflow-hidden shadow-[0_0_15px_rgba(34,211,238,0.4)]">
             <img src="https://api.pollinations.ai/prompt/alien%20grey%20head%20cyan%20neon%20circuit%20coin?width=100&height=100&nologo=true" className="w-full h-full object-cover" />
           </div>
           <h1 className="font-orbitron text-2xl tracking-widest text-cyan-400">RETI</h1>
        </div>
        <div className="font-orbitron text-[8px] border border-cyan-400/50 px-3 py-1 rounded-full text-cyan-400 animate-pulse">
          ○ NEURAL LINK
        </div>
      </div>

      {/* MIDDEN: MUNT OF ANTWOORD */}
      <div className="flex-1 relative z-10 flex flex-col items-center justify-center px-6">
        {!lastAnswer && !isPending ? (
          <div className="text-center float-anim">
             <div className="relative w-48 h-48 mb-8 flex items-center justify-center">
                <div className="absolute inset-0 border border-cyan-400/20 rotate-45 transform scale-110"></div>
                <img 
                  src="https://api.pollinations.ai/prompt/silver%20alien%20head%20coin%20neon%20cyan%20triangle%20logo?width=300&height=300&nologo=true" 
                  className="w-40 h-40 rounded-full shadow-[0_0_40px_rgba(34,211,238,0.5)] border-2 border-cyan-400/30"
                />
             </div>
             <h2 className="text-xl font-orbitron tracking-[0.4em] text-cyan-400 drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]">RETICULI HUB</h2>
             <p className="text-[9px] font-orbitron opacity-40 uppercase tracking-[0.5em] mt-2">Ready for synchronization</p>
          </div>
        ) : (
          <div className="w-full max-w-xl animate-in fade-in zoom-in duration-500 text-center">
            {/* HIER KOMT DE AFBEELDING ALS DIE ER IS (80% MAX) */}
            {lastAnswer?.img && (
               <img src={lastAnswer.img} className="max-w-[80%] max-h-[250px] mx-auto rounded-xl border border-cyan-400/30 mb-6 shadow-2xl" />
            )}
            <div className="w-full p-6 border-2 border-cyan-500/30 bg-black/40 rounded-2xl backdrop-blur-sm">
              <p className="text-cyan-400 font-orbitron text-xs leading-relaxed">
                {isPending ? "SYSTEM ANALYSING..." : lastAnswer?.text}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* INPUT SECTIE */}
      <div className="p-8 relative z-20">
        <form onSubmit={handleSend} className="max-w-2xl mx-auto flex gap-3">
          <input type="file" ref={fileRef} className="hidden" accept="image/*" />
          <button 
            type="button"
            onClick={() => fileRef.current?.click()}
            className="w-14 h-14 border-2 border-cyan-500/30 rounded-xl flex items-center justify-center text-cyan-400 text-2xl hover:bg-cyan-500/10 transition-all"
          >
            +
          </button>
          <input
            className="flex-1 bg-black/40 border-2 border-cyan-500/30 rounded-xl p-4 text-sm outline-none focus:border-cyan-400 text-white font-orbitron placeholder:opacity-20"
            placeholder="Koppel met Reticuli..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <button type="submit" className="bg-cyan-500/10 border-2 border-cyan-500/50 w-14 h-14 rounded-xl flex items-center justify-center active:scale-90 transition-all">
            <SendIcon />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatPage;